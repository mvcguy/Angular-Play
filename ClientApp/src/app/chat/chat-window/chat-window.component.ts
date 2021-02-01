import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ISubscription, Subject } from '@microsoft/signalr';
import { AuthorizeService } from 'src/api-authorization/authorize.service';
import { PlayChatSound } from 'src/app/services/PlayChatSound';
import { SignalRService } from 'src/app/services/signalr.service';
import { TitleBlinker } from 'src/app/services/TitleBlinker';
import { AudioMessage, ChatMessage } from '../../common/ChatMessage';

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
    , @Inject('AUTH_SERVICE') private authService: AuthorizeService
  ) {
    this.chatNotifications = [];
  }

  ngOnInit(): void {
    this.audioStreamSubject = new Subject<AudioMessage>();
  }

  public selectedUser: string;
  public currentUser: string;
  public chatNotifications: ChatMessage[];
  public liveAudio = new Audio();
  scriptProcessor: any;
  audioInput;
  audioContext;
  audioStreamSubject: Subject<AudioMessage>;
  streamGenerator;
  audioCallSubscription: ISubscription<any>;

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

  async getMedia() {
    let constraints = { audio: true, video: false };
    let stream = null;

    try {

      var browser = <any>navigator;

      browser.getUserMedia = (browser.getUserMedia ||
        browser.webkitGetUserMedia ||
        browser.mozGetUserMedia ||
        browser.msGetUserMedia);
      stream = await browser.mediaDevices.getUserMedia(constraints);

      //let audio = <any>document.getElementById('live_play');
      // audio.srcObject = stream;
      // audio.play();

      this.liveAudio.srcObject = stream;

      /* use the stream */

      this.audioContext = new AudioContext();
      this.audioInput = this.audioContext.createMediaStreamSource(stream);

      // this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.scriptProcessor = this.audioContext.createScriptProcessor(1024, 1, 1);


      // connect stream to our scriptProcessor
      this.audioInput.connect(this.scriptProcessor);

      // connect our scriptProcessor to the previous destination
      this.scriptProcessor.connect(this.audioContext.destination);

      // connect volume
      const volume = this.audioContext.createGain();
      this.audioInput.connect(volume);
      volume.connect(this.scriptProcessor);

      this.streamGenerator = this.signalRService.forwardAudioStream2(this.audioStreamSubject);
      this.currentUser = (await this.authService.getUser()).name;
      // this.signalRService.subscribeToAudioStream(this.currentUser, (data: AudioMessage) => {
      //   console.log(data);
      // })

      if (this.audioCallSubscription) {
        this.audioCallSubscription.dispose();
      }

      // this.audioCallSubscription = this.signalRService
      //   .subscribeToAudioStream2(this.currentUser, (data: AudioMessage) => {
      //     console.log(data);
      //   })


    } catch (err) {
      console.log('error during media streaming %o', err);
    }
  }

  playSound() {
    this.liveAudio.play();
    this.scriptProcessor.onaudioprocess = (e) => {
      //console.log(e);
      // this.signalRService.forwardAudioStream(e.inputBuffer.getChannelData(0), this.currentUser, this.selectedUser);
      var audioSignal: AudioMessage = {
        fromUser: this.currentUser,
        toUser: this.selectedUser,
        pcmStream: Array.from(e.inputBuffer.getChannelData(0))
      }
      this.audioStreamSubject.next(audioSignal);
    }

    // call only once?
    this.streamGenerator.next();
  }

  stopSound() {
    this.liveAudio.pause();
    this.scriptProcessor.onaudioprocess = null;
    this.audioStreamSubject.complete();

  }

}
