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
    this.userName = result && result.name;
    this.isAuthenticated = !!result;

  }

  public userName: string;
  public isAuthenticated: boolean;
}
