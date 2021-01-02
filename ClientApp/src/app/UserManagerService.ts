import { Inject, Injectable } from '@angular/core';
import { ApplicationName, ApplicationPaths } from 'src/api-authorization/api-authorization.constants';
import { UserManager, WebStorageStateStore } from 'oidc-client';


@Injectable()
export class UserManagerService {

  constructor(@Inject('API_URL') private apiUrl: string) {
  }

  private userManager: UserManager;
  get GetUserManger(): UserManager {
    return this.userManager;
  }


  public async load(): Promise<void> {
    // debugger;
    const response = await fetch(`${this.apiUrl}${ApplicationPaths.ApiAuthorizationClientConfigurationUrl}`);
    if (!response.ok) {
      throw new Error(`Could not load settings for '${ApplicationName}'`);
    }

    //  debugger;
    const settings: any = await response.json();

    //
    // TODO: flaw in the login process in Azure: The logged-in user is removed from the local-storage
    //
    // settings.automaticSilentRenew = true;
    // settings.includeIdTokenInSilentRenew = true;
    settings.userStore = this.getWebStorageStateStore();
    this.userManager = new UserManager(settings);

    this.userManager.events.addUserSignedOut(async () => {
      //
      // TODO: flaw in the login process in Azure: The logged-in user is removed from the local-storage
      // Also there is an infinite loop
      //
      //await this.userManager.removeUser();
      //this.userSubject.next(null);
    });
  }

  private getWebStorageStateStore(): WebStorageStateStore {
    return new WebStorageStateStore({ store: window.localStorage });
  }

}
