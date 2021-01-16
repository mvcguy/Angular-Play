import { Component, OnInit } from '@angular/core';
import { ChatMessage } from '../UserConversation/ChatMessage';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {

  constructor() {
    this.chatNotifications = [];
  }

  ngOnInit(): void {
  }

  public selectedUser: string;
  public chatNotifications: ChatMessage[];

  public onUserSelected(selectedUserName: string) {
    // console.log('OnUserSelected: ', selectedUserName);
    this.selectedUser = selectedUserName;
  }

  public onChatMessageArrived(chatMessage: ChatMessage) {
    console.log("Message arrived %o", chatMessage);
    this.chatNotifications.push(chatMessage);
  }

  public onMessageSeen(user: string) {
    this.chatNotifications.forEach((chatMessage, index) => {
      if (user === chatMessage.fromUser)
        chatMessage.seen = true;
    });
  }

  public onChatWindowClicked(user: string) {
    console.log('chat window clicked: ', user);
    this.onMessageSeen(user);
  }

}
