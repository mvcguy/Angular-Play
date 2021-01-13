import { Inject, Injectable, EventEmitter } from '@angular/core';
import { User, UserManager } from 'oidc-client';
import { SubscriptionItem } from 'src/app/services/signalr.service';
// import { BehaviorSubject, concat, from, Observable, pipe } from 'rxjs';
// import { filter, map, mergeMap, take, tap } from 'rxjs/operators';

export type IAuthenticationResult =
  SuccessAuthenticationResult |
  FailureAuthenticationResult |
  RedirectAuthenticationResult;

export interface SuccessAuthenticationResult {
  status: AuthenticationResultStatus.Success;
  state: any;
}

export interface FailureAuthenticationResult {
  status: AuthenticationResultStatus.Fail;
  message: string;
}

export interface RedirectAuthenticationResult {
  status: AuthenticationResultStatus.Redirect;
}

export enum AuthenticationResultStatus {
  Success,
  Redirect,
  Fail
}

export interface IUser {
  name?: string;
  access_token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizeService {

  constructor(@Inject('USER_MANAGER') private userManager: Promise<UserManager>) {
  }

  private userEvents: EventEmitter<IUser> = new EventEmitter<IUser>();

  public subscriptions: SubscriptionItem[] = [];
  // By default pop ups are disabled because they don't work properly on Edge.
  // If you want to enable pop up authentication simply set this flag to false.
  private popUpDisabled = true;


  public subscribeUserEvents(uniqueName: string, newMethod: (...args: any[]) => void) {
    // debugger;
    var index = this.subscriptions.findIndex(({ key }) => key === uniqueName);
    if (index !== -1) {
      // delete the existing subscription
      var existingSub = this.subscriptions.splice(index, 1)[0];
      existingSub.subscription.unsubscribe();
    };

    // TODO: add callback for errors and complete
    var sub = this.userEvents.subscribe(newMethod);
    this.subscriptions.push({ key: uniqueName, subscription: sub });
  }

  public async isAuthenticated(): Promise<boolean> {
    return !!(await this.getUser());
  }

  public async getUser(): Promise<IUser> {
    return await this.getUserFromStorage();
  }

  public async getAccessToken(): Promise<string> {
    var user = await this.getUser();
    var result = user && user.access_token;
    // debugger;
    return result;
  }

  // We try to authenticate the user in three different ways:
  // 1) We try to see if we can authenticate the user silently. This happens
  //    when the user is already logged in on the IdP and is done using a hidden iframe
  //    on the client.
  // 2) We try to authenticate the user using a PopUp Window. This might fail if there is a
  //    Pop-Up blocker or the user has disabled PopUps.
  // 3) If the two methods above fail, we redirect the browser to the IdP to perform a traditional
  //    redirect flow.
  public async signIn(state: any): Promise<IAuthenticationResult> {
    // debugger;
    let user: User = null;
    let mgr: UserManager = await this.userManager;
    if (mgr == null) return this.error("Cannot sign in at the moment. Try again latter");
    try {

      user = await mgr.signinSilent(this.createArguments());
      this.userEvents.emit({ name: user && user.profile.name, access_token: user && user.access_token });
      return this.success(state);
    } catch (silentError) {
      // User might not be authenticated, fallback to popup authentication
      console.log('Silent authentication error: ', silentError);

      try {
        if (this.popUpDisabled) {
          throw new Error('Popup disabled. Change \'authorize.service.ts:AuthorizeService.popupDisabled\' to false to enable it.');
        }
        user = await mgr.signinPopup(this.createArguments());
        this.userEvents.emit({ name: user && user.profile.name, access_token: user && user.access_token });
        return this.success(state);
      } catch (popupError) {
        if (popupError.message === 'Popup window closed') {
          // The user explicitly cancelled the login action by closing an opened popup.
          return this.error('The user closed the window.');
        } else if (!this.popUpDisabled) {
          console.log('Popup authentication error: ', popupError);
        }

        // PopUps might be blocked by the user, fallback to redirect
        try {
          await mgr.signinRedirect(this.createArguments(state));
          return this.redirect();
        } catch (redirectError) {
          console.log('Redirect authentication error: ', redirectError);
          return this.error(redirectError);
        }
      }
    }
  }

  public async completeSignIn(url: string): Promise<IAuthenticationResult> {

    let mgr: UserManager = await this.userManager;
    try {
      if (mgr == null) return this.error("Cannot sign in at the moment. Try again latter");
      const user = await mgr.signinCallback(url);
      this.userEvents.emit({ name: user && user.profile.name, access_token: user && user.access_token });
      // debugger;
      return this.success(user && user.state);
    } catch (error) {
      console.log('There was an error signing in: ', error);
      return this.error('There was an error signing in.');
    }
  }

  public async signOut(state: any): Promise<IAuthenticationResult> {
    // debugger;
    let mgr: UserManager = await this.userManager;
    if (mgr == null) return this.error("Cannot sign out at the moment. Try again latter");
    try {
      if (this.popUpDisabled) {
        throw new Error('Popup disabled. Change \'authorize.service.ts:AuthorizeService.popupDisabled\' to false to enable it.');
      }
      // debugger;
      await mgr.signoutPopup(this.createArguments());
      return this.success(state);
    } catch (popupSignOutError) {
      console.log('Popup signout error: ', popupSignOutError);
      try {
        await mgr.signoutRedirect(this.createArguments(state));
        return this.redirect();
      } catch (redirectSignOutError) {
        console.log('Redirect signout error: ', redirectSignOutError);
        return this.error(redirectSignOutError);
      }
    }
  }

  public async completeSignOut(url: string): Promise<IAuthenticationResult> {
    // debugger;
    try {
      let mgr: UserManager = await this.userManager;
      if (mgr == null) return this.error("Cannot signout at the moment. Please try again later");
      const response = await mgr.signoutCallback(url);
      this.userEvents.emit(null);
      return this.success(response && response.state);
    } catch (error) {
      console.log(`There was an error trying to log out '${error}'.`);
      return this.error(error);
    }
  }

  private createArguments(state?: any): any {
    return { useReplaceToNavigate: true, data: state };
  }

  private error(message: string): IAuthenticationResult {
    return { status: AuthenticationResultStatus.Fail, message };
  }

  private success(state: any): IAuthenticationResult {
    return { status: AuthenticationResultStatus.Success, state };
  }

  private redirect(): IAuthenticationResult {
    return { status: AuthenticationResultStatus.Redirect };

  }

  private async getUserFromStorage(): Promise<IUser> {

    // debugger;
    var mgr = await this.userManager;
    if (!!mgr) {
      var usr = await mgr.getUser();
      if (!!usr && !!usr.profile) {
        return { name: usr.profile.name, access_token: usr.access_token }
      }
    }

    return null;
  }
}
