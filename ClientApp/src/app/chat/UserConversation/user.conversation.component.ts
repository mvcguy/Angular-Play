import { Component, OnInit } from "@angular/core";
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
    public choosenUserName: string;
    public chatHistory: Observable<ChatMessage[]>;
    public currentMessage: ChatMessage;
    fakeChatHistory: ChatMessage[];
    public messageSeq: number = 1;

    constructor(private authService: AuthorizeService
        , private activatedRoute: ActivatedRoute,) {
        this.currentMessage = new ChatMessage();
        this.isAuthenticated = this.authService.isAuthenticated();
        this.currentUser = this.authService.getUser().pipe(map(u => u && u.name));
        this.choosenUserName = this.activatedRoute.snapshot.paramMap.get('userName');

        this.fakeChatHistory = [
            { userName: "Shahid Ali", message: 'Assalam O Alaikum', timestamp: '09:15 AM', index: this.messageSeq++ },
            { userName: "Shahid Ali", message: 'How are you doing today?', timestamp: '10:30 AM', index: this.messageSeq++ },
            {
                userName: "Shahid Ali",
                message: 'Have you read some topics about angular 11 yet? Use <a>s or <button>s to create actionable list group items with hover, disabled, and active states by adding .list-group-item-action. We separate these pseudo-classes to ensure list groups made of non-interactive elements (like <li>s or <div>s) don’t provide a click or tap affordance.',
                timestamp: '11:27 PM', index: this.messageSeq++
            }
        ];

    }

    ngOnInit() {

        this.chatHistory = of(this.fakeChatHistory);

    }

    getCurrentUser(): string {
        let returnVlaue: string = ''
        this.currentUser.subscribe(x => { returnVlaue = x });
        console.log(returnVlaue);
        return returnVlaue;
    }

    public sendMessage() {
        this.currentMessage.userName = "Shahid Ali";
        this.currentMessage.index = this.messageSeq++;
        this.currentMessage.timestamp = new Date().toLocaleTimeString();
        this.fakeChatHistory.push(this.currentMessage);
        this.currentMessage = new ChatMessage();
        debugger;
        this.scrollToElement('item-' + (this.messageSeq - 2));
    }

    scrollToElement(elementId: string) {
        document.getElementById(elementId).scrollIntoView();
    }
}

export class ChatMessage {
    userName?: string;
    message?: string;
    timestamp?: string;
    index?: number;
}