import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { AuthorizeService, IUser } from 'src/api-authorization/authorize.service';
import { ChatMessage } from '../UserConversation/ChatMessage';
import { ChatUserModel } from '../UserSearch/user.search.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  @Output() userSelected = new EventEmitter<string>();

  private _chatNotifications: ChatMessage[] = [];

  @Input()
  get chatNotifications(): ChatMessage[] { return this._chatNotifications; }
  set chatNotifications(value: ChatMessage[]) {
    this._chatNotifications = value;
    console.log('chat messages: %o', value);
  }

  topUsers: ChatUserModel[];
  selectedUser: string;

  constructor(private http: HttpClient
    , @Inject('API_URL') private apiUrl: string
    , @Inject('AUTH_SERVICE') private authService: AuthorizeService) {
    this.chatNotifications = [];
  }
  async ngOnInit() {

    this.selectedUser = "Select user from the list";

    var user = await this.authService.getUser();
    this.onUserAuthorized(user, 'promise');

    this.authService.subscribeUserEvents('user-list-component', (user: IUser) => {
      this.onUserAuthorized(user, 'event');
    });
  }

  private onUserAuthorized(user: IUser, source: string) {
    var isAuthenticated = !!user && user.name !== undefined;
    if (isAuthenticated && !this.topUsers) {
      this.http.get<ChatUserModel[]>(this.apiUrl + '/chat/userlist')
        .subscribe(
          result => { this.OnTopUsersQueryResult(result); }
          , error => { this.OnTopUsersQueryError(error) });
    }
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

    this.chatNotifications.forEach((chatMessage, index) => {
      if (user === chatMessage.fromUser)
        chatMessage.seen = true;
    });
  }

  public getMessageCount(user: string): number {
    var filtered = this.chatNotifications
      .filter((chatMessage, index) => chatMessage.fromUser === user && chatMessage.seen === false);
    return filtered.length;
  }

  public showPendingMessage(user: string): boolean {
    var index = this.chatNotifications.findIndex(({ fromUser, seen }) => fromUser == user && seen === false);
    return index >= 0;
  }
}
