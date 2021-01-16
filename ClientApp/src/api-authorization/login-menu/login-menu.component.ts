import { Component, Inject, OnInit } from '@angular/core';
import { AuthorizeService, IUser } from '../authorize.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-login-menu',
  templateUrl: './login-menu.component.html',
  styleUrls: ['./login-menu.component.css']
})

export class LoginMenuComponent implements OnInit {

  constructor(@Inject('AUTH_SERVICE') private authService: AuthorizeService) { }

  async ngOnInit() {

    var result = await this.authService.getUser();

    this.onUserEvent(result, "promise");

    this.authService.subscribeUserEvents('login-menu-component', (user: IUser) => { this.onUserEvent(user, "event") });

  }

  private onUserEvent(user: IUser, source: string) {
    // debugger;
    this.userName = user && user.name;
    this.isAuthenticated = !!user && user.name !== undefined;
    // console.log('login-menu-comp: login-source: %s, Payload: %o', source, user);
  }

  public userName: string;
  public isAuthenticated: boolean;
}
