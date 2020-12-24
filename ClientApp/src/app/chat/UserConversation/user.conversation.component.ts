import { HttpClient } from "@angular/common/http";
import { Component, Inject, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { from, Observable, of } from "rxjs";
import { filter, first, map, take } from "rxjs/operators";
import { AuthorizeService } from "src/api-authorization/authorize.service";

@Component({
    selector: 'app-chat-user-conversation',
    templateUrl: './user.conversation.component.html',
    styleUrls: ['./user.conversation.component.css']
})

export class UserConversationComponent implements OnInit {


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
        , private http: HttpClient) {

        this.currentMessage = new ChatMessage();
        this.isAuthenticated = this.authService.isAuthenticated();

        this.opponentUserName = this.activatedRoute.snapshot.paramMap.get('userName');
        this.chatHistorySource = [];
    }

    ngOnInit() {
        this.chatHistory = of(this.chatHistorySource);
        this.getCurrentUser();
    }


    ngAfterViewChecked() {

        if (!this.chatIsScrolledToView) {
            this.scrollChatToView();
        }
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
        this.chatHistorySource = [...this.chatHistorySource, ...result];
        this.chatHistory = of(this.chatHistorySource);
        this.chatIsScrolledToView = false;
    }

    getCurrentUser(): void {
        this.authService.getUser().pipe(map(u => u && u.name)).pipe(take(1)).subscribe(user => {
            this.currentUser = user;
            this.GetChatHistory();
        });
    }

    public sendMessage() {
        this.currentMessage.fromUser = this.currentUser;
        this.currentMessage.index = this.messageSeq++;
        this.currentMessage.timestamp = new Date().toLocaleTimeString();
        this.currentMessage.toUser = this.opponentUserName;
        this.chatHistorySource.push(this.currentMessage);

        this.http.post(this.apiUrl + '/chat/sendmessage', this.currentMessage)
            .subscribe(
                result => this.OnSendMessageResult(result),
                error => this.OnSendMessageError(error)
            );

        // re-new current  message
        this.currentMessage = new ChatMessage();
        this.chatIsScrolledToView = false;
    }
    OnSendMessageError(error: any): void {
        console.log(error);
    }
    OnSendMessageResult(result: Object): void {
        console.log(result);
    }

    scrollChatToView() {
        document.getElementById('chat_eof').scrollIntoView();
        this.chatIsScrolledToView = true;
    }
}

export class ChatMessage {
    fromUser?: string;
    toUser?: string;
    message?: string;
    timestamp?: string;
    index?: number;
}