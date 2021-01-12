import { Inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
// import { Observable } from 'rxjs';
import { AuthorizeService } from './authorize.service';
import { tap } from 'rxjs/operators';
import { ApplicationPaths, QueryParameterNames } from './api-authorization.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthorizeGuard implements CanActivate {
  constructor(@Inject('AUTH_SERVICE') private authorize: AuthorizeService, private router: Router) {
  }
  async canActivate(
    _next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
    var isAuthorized = await this.authorize.isAuthenticated();
    this.handleAuthorization(isAuthorized, state);
    return isAuthorized;
  }

  private handleAuthorization(isAuthenticated: boolean, state: RouterStateSnapshot) {
    if (!isAuthenticated) {
      this.router.navigate(ApplicationPaths.LoginPathComponents, {
        queryParams: {
          [QueryParameterNames.ReturnUrl]: state.url
        }
      });
    }
  }
}
