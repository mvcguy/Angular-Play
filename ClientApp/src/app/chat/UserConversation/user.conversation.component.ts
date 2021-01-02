import { HttpClient } from "@angular/common/http";
import { Component, Inject, Input, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { from, Observable, of } from "rxjs";
import { filter, first, map, take } from "rxjs/operators";
import { AuthorizeService } from "src/api-authorization/authorize.service";
import { SignalRChatModel, SignalRChatProps } from "src/app/services/signalr.chat.model";
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
    this._selectedUser = value;
    this.opponentUserName = this._selectedUser;
    this.RefreshChat();
    this.subscribeToSignalREvents();
  }

  public isAuthenticated: Observable<boolean>;
  public currentUser: string;
  public opponentUserName: string;
  public chatHistory: Observable<ChatMessage[]>;
  public chatHistorySource: ChatMessage[];
  public currentMessage: ChatMessage;
  public messageSeq: number = 1;
  public chatIsScrolledToView: boolean = false;
  public historyFetched: boolean = false;

  constructor(private authService: AuthorizeService
    , private activatedRoute: ActivatedRoute
    , @Inject('API_URL') private apiUrl: string
    , private signalRService: SignalRService
    , private http: HttpClient) {

    this.currentMessage = new ChatMessage();
    this.isAuthenticated = this.authService.isAuthenticated();

    this.opponentUserName = this.activatedRoute.snapshot.paramMap.get('userName');
    this.chatHistorySource = [];
    this.showSelectedUser = true;
  }

  ngOnInit() {
    this.chatHistory = of(this.chatHistorySource);
    this.getCurrentUser();
  }
  subscribeToSignalREvents() {

    if (this.currentUser && this.opponentUserName) {
      var subscriptionId = this.currentUser + this.opponentUserName;
      this.signalRService.subscribeToChatSignals(subscriptionId, (data: SignalRChatModel) => this.onNewChatMessageArrived(data));
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

  public RefreshChat() {
    this.historyFetched = false;
    this.GetChatHistory();
  }

  private GetChatHistory() {

    console.log('GetHistory: CurrentUser: ' + this.currentUser + ', OppUser: ' + this.opponentUserName);

    if (this.currentUser && this.opponentUserName && !this.historyFetched) {
      this.historyFetched = true;
      this.http.get<ChatMessage[]>(this.apiUrl + '/chat/messagehistory?currentuser=' + this.currentUser
        + '&opponentuser=' + this.opponentUserName)
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

  getCurrentUser(): void {
    this.authService.getUser().pipe(map(u => u && u.name)).pipe(take(1)).subscribe(user => {
      this.currentUser = user;
      // this.GetChatHistory();
      // this.subscribeToSignalREvents();
    });
  }

  public sendMessage() {
    this.currentMessage.fromUser = this.currentUser;
    this.currentMessage.index = this.messageSeq++;
    this.currentMessage.timestamp = new Date().toLocaleTimeString();
    this.currentMessage.toUser = this.opponentUserName;

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

