import { HttpClient } from "@angular/common/http";
import { Component, Inject, Input, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, of } from "rxjs";
import { AuthorizeService, IUser } from "src/api-authorization/authorize.service";
import { SignalRChatModel } from "src/app/services/signalr.chat.model";
import { SignalRService } from "src/app/services/signalr.service";
import { ChatMessage } from "./ChatMessage";

@Component({
  selector: 'app-chat-user-conversation',
  templateUrl: './user.conversation.component.html',
  styleUrls: ['./user.conversation.component.css']
})

export class UserConversationComponent implements OnInit {

  @Input() showSelectedUser: boolean;


  private _selectedUser: string;
  @Input()
  get selectedUser(): string { return this._selectedUser };
  set selectedUser(value: string) {

    if (value && value != '') {
      this._selectedUser = value;

      //
      // TODO: How you await the async calls in the setter ?
      //
      this.RefreshChat();
      this.subscribeToSignalREvents();
    }
  }

  public chatHistory: Observable<ChatMessage[]>;
  public chatHistorySource: ChatMessage[];
  public currentMessage: ChatMessage;
  public messageSeq: number = 1;
  public chatIsScrolledToView: boolean = false;
  public historyFetched: boolean = false;
  public isAuthenticated: boolean = false;
  public currentUser: IUser = null;

  constructor(@Inject('API_URL') private apiUrl: string
    , @Inject('AUTH_SERVICE') private authService: AuthorizeService
    , private signalRService: SignalRService
    , private http: HttpClient) {

    this.currentMessage = new ChatMessage();

    //
    // not needed anymore
    //
    // this.opponentUserName = this.activatedRoute.snapshot.paramMap.get('userName');
    this.chatHistorySource = [];
    this.showSelectedUser = true;
    this.selectedUser = '';
  }

  async ngOnInit() {
    this.chatHistory = of(this.chatHistorySource);
    var user = await this.authService.getUser();
    this.onUserEvent(user, 'promise');
    this.authService.subscribeUserEvents('user-conversation-component', (user: IUser) => {
      this.onUserEvent(user, 'event');
    });
  }

  private onUserEvent(user: IUser, source: string) {
    this.currentUser = user;
    this.isAuthenticated = !!user;
    console.log('user-conversation-comp: userevent source: %s, Event-Payload: %o', source, user);
    this.RefreshChat();
    this.subscribeToSignalREvents();
  }

  async subscribeToSignalREvents() {
    if (!!this.currentUser && this.currentUser.name && this.selectedUser) {
      var subscriptionId = this.currentUser.name + this.selectedUser;
      this.signalRService
        .subscribeToChatSignals(subscriptionId, (data: SignalRChatModel) => this.onNewChatMessageArrived(data));
    }
  }

  onNewChatMessageArrived(data: SignalRChatModel) {
    var message: ChatMessage = {
      message: data.body,
      fromUser: data.props.FromUser,
      index: data.props.Index,
      toUser: data.props.ToUser,
      timestamp: data.props.Timestamp
    };
    this.chatHistorySource.push(message);
    console.log("SignalR: Data is received by the component. Data: ", message);
    this.chatIsScrolledToView = false;
  }

  ngAfterViewChecked() {

    if (!this.chatIsScrolledToView) {
      this.scrollChatToView();
    }
  }

  public async RefreshChat() {
    this.historyFetched = false;
    await this.GetChatHistory();
  }

  private async GetChatHistory() {

    var user = this.currentUser && this.currentUser.name;
    console.log('GetHistory: CurrentUser: ' + user + ', OppUser: ' + this.selectedUser);

    if (user && this.selectedUser && !this.historyFetched) {
      this.historyFetched = true;
      this.http.get<ChatMessage[]>(this.apiUrl + '/chat/messagehistory?currentuser=' + user
        + '&opponentuser=' + this.selectedUser)
        .subscribe(
          result => this.OnChatHistoryReceived(result),
          error => this.OnChatHistoryError(error)
        );
    }
  }

  OnChatHistoryError(error: any): void {
    console.log(error);
  }
  OnChatHistoryReceived(result: ChatMessage[]): void {

    //
    // TODO: only append new history items
    //

    // this.chatHistorySource = [...this.chatHistorySource, ...result];
    this.chatHistorySource = [...result];
    this.chatHistory = of(this.chatHistorySource);
    this.chatIsScrolledToView = false;
  }

  public async sendMessage() {
    this.currentMessage.fromUser = (await this.authService.getUser())?.name;
    this.currentMessage.index = this.messageSeq++;
    this.currentMessage.timestamp = new Date().toLocaleTimeString();
    this.currentMessage.toUser = this.selectedUser;

    this.chatHistorySource.push(this.currentMessage);
    this.chatIsScrolledToView = false;

    this.http.post(this.apiUrl + '/chat/sendmessage', this.currentMessage)
      .subscribe(
        result => this.OnSendMessageResult(result),
        error => this.OnSendMessageError(error)
      );

    // re-new current  message
    this.currentMessage = new ChatMessage();
  }
  OnSendMessageError(error: any): void {
    console.log(error);
  }
  OnSendMessageResult(result: Object): void {
    // console.log(result);
  }

  scrollChatToView() {
    document.getElementById('chat_eof').scrollIntoView();
    this.chatIsScrolledToView = true;
  }
}

