import { Inject, Injectable } from '@angular/core';
import { ApplicationName, ApplicationPaths } from 'src/api-authorization/api-authorization.constants';
import { UserManager, WebStorageStateStore } from 'oidc-client';


@Injectable()
export class UserManagerService {

  constructor(@Inject('API_URL') private apiUrl: string) {
  }

  private _userManager: UserManager;
  get userManger(): UserManager {
    return this._userManager;
  }


  public async load(): Promise<void> {
    // debugger;
    try {

      const response = await fetch(`${this.apiUrl}${ApplicationPaths.ApiAuthorizationClientConfigurationUrl}`);

      if (!response.ok) {
        throw new Error(`Could not load settings for '${ApplicationName}'`);
      }

      //  debugger;
      const settings: any = await response.json();

      //
      // TODO: flaw in the login process in Azure: The logged-in user is removed from the local-storage
      //
      settings.automaticSilentRenew = true;
      settings.includeIdTokenInSilentRenew = true;
      settings.userStore = this.getWebStorageStateStore();
      this._userManager = new UserManager(settings);

      this._userManager.events.addUserSignedOut(async () => {
        //
        // TODO: flaw in the login process in Azure: The logged-in user is removed from the local-storage
        // Also there is an infinite loop
        //
        await this._userManager.removeUser();
      });

    } catch (error) {
      console.log(error);
      throw error;
      //
      // TODO: Retry a few times before give up
      //
    }
  }

  private getWebStorageStateStore(): WebStorageStateStore {
    return new WebStorageStateStore({ store: window.sessionStorage });
  }

}
