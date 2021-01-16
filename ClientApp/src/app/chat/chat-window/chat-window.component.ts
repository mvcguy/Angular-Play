import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PlayChatSound } from 'src/app/services/PlayChatSound';
import { SignalRService } from 'src/app/services/signalr.service';
import { TitleBlinker } from 'src/app/services/TitleBlinker';
import { ChatMessage } from '../../common/ChatMessage';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {

  constructor(@Inject('SIGNAL_R_SERVICE') private signalRService: SignalRService
    , private titleBlinker: TitleBlinker
    , private titleService: Title
    , private chatSoundService: PlayChatSound
  ) {
    this.chatNotifications = [];
  }

  ngOnInit(): void {
  }

  public selectedUser: string;
  public chatNotifications: ChatMessage[];

  public onUserSelected(selectedUserName: string) {
    // console.log('OnUserSelected: ', selectedUserName);
    this.selectedUser = selectedUserName;
    this.titleService.setTitle(this.selectedUser);

    this.onMessageSeen(selectedUserName);
  }

  public onChatMessageArrived(chatMessage: ChatMessage) {
    // console.log("Message arrived %o", chatMessage);
    this.chatNotifications.push(chatMessage);

    if (!chatMessage.seen) {
      this.titleBlinker.blink(chatMessage.fromUser, 10);
      this.chatSoundService.play('src="./../../../assets/pling-sound.mp3');
    }

  }

  public onMessageSeen(user: string) {
    var list: ChatMessage[] = [];
    this.chatNotifications.forEach((chatMessage, index) => {
      if (chatMessage.seen) return;
      if (user === chatMessage.fromUser) {
        chatMessage.seen = true;
        list.push(chatMessage);
      }
    });

    // debugger;
    if (list.length > 0)
      this.signalRService.markMessageAsSeen(list);

  }

  public onChatWindowClicked(user: string) {
    console.log('chat window clicked: ', user);
    this.onMessageSeen(user);
  }

}
