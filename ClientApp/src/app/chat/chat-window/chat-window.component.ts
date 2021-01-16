import { Component, Inject, OnInit } from '@angular/core';
import { SignalRService } from 'src/app/services/signalr.service';
import { ChatMessage } from '../../common/ChatMessage';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {

  constructor(@Inject('SIGNAL_R_SERVICE') private signalRService: SignalRService) {
    this.chatNotifications = [];
  }

  ngOnInit(): void {
  }

  public selectedUser: string;
  public chatNotifications: ChatMessage[];

  public onUserSelected(selectedUserName: string) {
    // console.log('OnUserSelected: ', selectedUserName);
    this.selectedUser = selectedUserName;
    this.onMessageSeen(selectedUserName);
  }

  public onChatMessageArrived(chatMessage: ChatMessage) {
    // console.log("Message arrived %o", chatMessage);
    this.chatNotifications.push(chatMessage);
  }

  public onMessageSeen(user: string) {
    var list: ChatMessage[] = [];
    this.chatNotifications.forEach((chatMessage, index) => {
      if (chatMessage.seen) return;
      if (user === chatMessage.fromUser)
        chatMessage.seen = true;
      list.push(chatMessage);
    });

    if (list.length > 0)
      this.signalRService.markMessageAsSeen(list);

  }

  public onChatWindowClicked(user: string) {
    console.log('chat window clicked: ', user);
    this.onMessageSeen(user);
  }

}
