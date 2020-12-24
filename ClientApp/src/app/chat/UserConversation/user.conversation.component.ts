import { HttpClient } from "@angular/common/http";
import { Component, Inject, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { from, Observable, of } from "rxjs";
import { first, map } from "rxjs/operators";
import { AuthorizeService } from "src/api-authorization/authorize.service";

@Component({
    selector: 'app-chat-user-conversation',
    templateUrl: './user.conversation.component.html',
    styleUrls: ['./user.conversation.component.css']
})

export class UserConversationComponent implements OnInit {


    public isAuthenticated: Observable<boolean>;
    public currentUser: Observable<string>;
    public opponentUserName: string;
    public chatHistory: Observable<ChatMessage[]>;
    public chatHistorySource: ChatMessage[];
    public currentMessage: ChatMessage;
    public messageSeq: number = 1;
    public chatIsScrolledToView: boolean = false;

    constructor(private authService: AuthorizeService
        , private activatedRoute: ActivatedRoute
        , @Inject('API_URL') private apiUrl: string
        , private http: HttpClient) {

        this.currentMessage = new ChatMessage();
        this.isAuthenticated = this.authService.isAuthenticated();
        this.currentUser = this.authService.getUser().pipe(map(u => u && u.name));
        this.opponentUserName = this.activatedRoute.snapshot.paramMap.get('userName');
        this.chatHistorySource = [];
    }

    ngOnInit() {
        this.chatHistory = of(this.chatHistorySource);

    }

    ngAfterViewChecked() {
        if (!this.chatIsScrolledToView) {
            this.scrollChatToView();
            this.chatIsScrolledToView = true;
        }

    }
    getCurrentUser(): string {
        let returnVlaue: string = ''
        this.currentUser.subscribe(x => { returnVlaue = x });
        console.log(returnVlaue);
        return returnVlaue;
    }

    public sendMessage() {
        this.currentMessage.fromUser = this.getCurrentUser();
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
    }
}

export class ChatMessage {
    fromUser?: string;
    toUser?: string;
    message?: string;
    timestamp?: string;
    index?: number;
}