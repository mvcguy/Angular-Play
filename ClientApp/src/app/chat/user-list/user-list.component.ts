import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { AuthorizeService } from 'src/api-authorization/authorize.service';
import { ChatUserModel } from '../UserSearch/user.search.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  @Output() userSelected = new EventEmitter<string>();

  topUsers: ChatUserModel[];
  selectedUser: string;

  constructor(private http: HttpClient
    , @Inject('API_URL') private apiUrl:string
    , @Inject('AUTH_SERVICE') private authService: AuthorizeService

    ) {
  }
  ngOnInit() {

    this.selectedUser = "Select user from the list";
    this.authService.isAuthenticated().then(isAuthorized => {
      if (isAuthorized && !this.topUsers) {
        this.http.get<ChatUserModel[]>(this.apiUrl + '/chat/userlist')
          .subscribe(
            result => { this.OnTopUsersQueryResult(result); }
            , error => { this.OnTopUsersQueryError(error) });
      }
    }).catch(error => console.log('cannot load user list. Error: ', error));
  }

  private OnTopUsersQueryResult(result: ChatUserModel[]) {
    this.topUsers = result;
  }

  private OnTopUsersQueryError(error: any) {
    console.log(error);
  }

  public updateUser(user: string) {
    this.selectedUser = user;
    this.userSelected.emit(this.selectedUser);
  }
}
