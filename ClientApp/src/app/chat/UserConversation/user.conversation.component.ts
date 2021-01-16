import { HttpClient } from "@angular/common/http";
import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
// import { Observable, of } from "rxjs";
import { AuthorizeService, IUser } from "src/api-authorization/authorize.service";
import { SignalRChatModel } from "src/app/services/signalr.chat.model";
import { SignalRService } from "src/app/services/signalr.service";
import { ChatMessage, UserChat } from "./ChatMessage";

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
      this.RefreshChat();
    }
  }

  @Output() chatMessageArrived = new EventEmitter<ChatMessage>();
  @Output() chatInputClicked = new EventEmitter<string>();

  public currentMessage: ChatMessage;
  public currentChat: UserChat;
  public messageSeq: number = 1;
  public chatIsScrolledToView: boolean = false;
  public historyFetched: boolean = false;
  public isAuthenticated: boolean = false;
  public currentUser: IUser = null;
  public instanceId: string = new Date().toUTCString();

  constructor(@Inject('API_URL') private apiUrl: string
    , @Inject('AUTH_SERVICE') private authService: AuthorizeService
    , private signalRService: SignalRService
    , private http: HttpClient) {

    this.currentMessage = new ChatMessage();

    //
    // not needed anymore
    //
    // this.opponentUserName = this.activatedRoute.snapshot.paramMap.get('userName');
    this.showSelectedUser = true;
    this.selectedUser = '';
    this.currentChat = { userName: '', chatMessages: [] };
  }

  async ngOnInit() {
    var user = await this.authService.getUser();
    this.onUserEvent(user, 'promise');
    this.authService.subscribeUserEvents('user-conversation-component', (user: IUser) => {
      this.onUserEvent(user, 'event');
    });
  }

  private onUserEvent(user: IUser, source: string) {
    this.currentUser = user;
    this.isAuthenticated = !!user && user.name !== undefined;
    // console.log('user-conversation-comp: userevent source: %s, Event-Payload: %o', source, user);
    this.RefreshChat();
    this.subscribeToSignalREvents();
  }

  async subscribeToSignalREvents() {
    if (!!this.currentUser && this.currentUser.name) {
      var subscriptionId = this.currentUser.name;
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
      timestamp: data.props.Timestamp,
      seen: false
    };
    this.chatMessageArrived.emit(message);

    if (this.currentChat.userName === message.fromUser) {
      this.currentChat.chatMessages.push(message);
      // console.log("Instance-[%s] - SignalR: Data is received by the component. Data: %o", this.instanceId, message);
      this.chatIsScrolledToView = false;
    }

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
    // console.log('GetHistory: CurrentUser: ' + user + ', OppUser: ' + this.selectedUser);

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

    if (this.selectedUser === '') return;

    this.currentChat = { userName: this.selectedUser, chatMessages: [...result] };
    this.chatIsScrolledToView = false;
  }

  public async sendMessage() {

    if (!this.isAuthenticated || this.selectedUser === '' || this.selectedUser === undefined || this.selectedUser === null) {
      return;
    }

    this.currentMessage.fromUser = this.currentUser.name;
    this.currentMessage.index = this.messageSeq++;
    this.currentMessage.timestamp = new Date().toLocaleTimeString();
    this.currentMessage.toUser = this.selectedUser;

    this.currentChat.chatMessages.push(this.currentMessage);
    this.chatIsScrolledToView = false;

    this.http.post(this.apiUrl + '/chat/sendmessage', this.currentMessage)
      .subscribe(
        result => this.OnSendMessageResult(result),
        error => this.OnSendMessageError(error)
      );

    // re-new current  message
    this.currentMessage = new ChatMessage();
    this.chatInputClicked.emit(this.selectedUser);
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

  onChatInputClicked(event: any) {
    // console.log('chat input is clicked %o', event);
    this.chatInputClicked.emit(this.selectedUser);
  }
}

