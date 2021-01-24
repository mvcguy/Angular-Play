import { EventEmitter, Inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, IHttpConnectionOptions } from '@microsoft/signalr';
import { Subscription } from 'rxjs';
import { AuthorizeService, IUser } from 'src/api-authorization/authorize.service';
import { AudioMessage, ChatMessage } from '../common/ChatMessage';
import { SignalRChatModel } from '../common/signalr.chat.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {

  private signalRHub: HubConnection
  public signalEmitter: EventEmitter<SignalRChatModel>;
  public subscriptions: ChatSubscriptionItem[];
  public audioSubscriptions: ChatSubscriptionItem[];

  constructor(@Inject('API_URL') private apiUrl: string
    , @Inject('AUTH_SERVICE') private authService: AuthorizeService
  ) {
    this.signalEmitter = new EventEmitter<SignalRChatModel>();
    this.buildConnection();

    this.authService.isAuthenticated().then((isAuthenticated) => {
      if (isAuthenticated) {
        this.startConnection();
      }
    }).catch(console.log);

    this.authService.subscribeUserEvents('signal-r-service', (user: IUser) => { this.setupConnection(user) });
    this.subscriptions = [];
    this.audioSubscriptions = [];
  }

  setupConnection(user: IUser) {
    if (!!user) {
      this.startConnection();
    }
  }

  startConnection() {
    if (this.signalRHub.state == HubConnectionState.Connected) return;

    this.signalRHub.start().then(
      () => {
        //console.log('Connection has established');
        //TODO: try to reconnect if something goes wrong!
      }
    ).catch(
      error => {
        //console.error('SignalR: Error has occurred while connecting. Error: ', error);
      }
    );
  }
  buildConnection() {

    const options: IHttpConnectionOptions = {
      accessTokenFactory: async () => await this.authService.getAccessToken()
    };

    try {
      this.signalRHub = new HubConnectionBuilder()
        .withUrl(this.apiUrl + '/chathub', options)
        .withAutomaticReconnect()
        .build();
    } catch (error) {

    }
  }

  subscribeToChatSignals(userName: string, newMethod: (...args: any[]) => void) {
    // TODO: use more secure way!
    //  debugger;
    var index = this.subscriptions.findIndex(({ key }) => key === userName);
    if (index !== -1) {
      // delete the existing subscription
      this.subscriptions.splice(index, 1)[0];
      // console.log('existing subscription removed');
    };

    // TODO: add callback for errors and complete
    this.subscriptions.push({ key: userName, subscription: newMethod });
    // remove the handler if exist from before
    this.signalRHub.off(userName);
    // console.log('subscription list: ', this.subscriptions);
    // register the handler

    this.signalRHub.on(userName, (data: SignalRChatModel) => {
      // console.log("SignalR: Signal received from server. TargetUser: %s Data: %o", userName, data);
      var index = this.subscriptions.findIndex(({ key }) => key === data.props.ToUser);
      if (index !== -1) {
        var item = this.subscriptions[index];
        item.subscription(data)
      }
    });
  }

  subscribeToAudioStream(userName: string, newMethod: (...args: any[]) => void) {

    var subKey = userName + '-audio'

    // TODO: use more secure way!
    //  debugger;
    var index = this.audioSubscriptions.findIndex(({ key }) => key === subKey);
    if (index !== -1) {
      // delete the existing subscription
      this.audioSubscriptions.splice(index, 1)[0];
      // console.log('existing subscription removed');
    };

    this.audioSubscriptions.push({ key: subKey, subscription: newMethod });
    // remove the handler if exist from before
    this.signalRHub.off(subKey);

    this.signalRHub.on(subKey, (data: AudioMessage) => {

      //console.log("SignalR: Signal received from server. TargetUser: %s Data: %o", subKey, data);
      var index = this.audioSubscriptions.findIndex(({ key }) => key === data.toUser+'-audio');
      if (index !== -1) {
        var item = this.audioSubscriptions[index];
        item.subscription(data)
      }
    });
  }

  public async sendMessage(chatMessage: ChatMessage): Promise<void> {
    await this.signalRHub.send('SendMessage', chatMessage);
  }

  public async markMessageAsSeen(messages: ChatMessage[]): Promise<void> {
    await this.signalRHub.send('MarkAsSeen', messages);
    console.log('messages are marked as Seen');
  }

  public async forwardAudioStream(data:Float32Array, source: string, destination: string): Promise<void> {

    // debugger;
    await this.signalRHub.send("ForwardAudioStream", { pcmStream:Array.from(data), fromUser: source, toUser: destination });
    // await this.signalRHub.send("ForwardAudioStream", { pcmStream:data, fromUser: source, toUser: destination });

  }

}

export class ChatSubscriptionItem {
  key: string;
  subscription: (...args: any[]) => void
}

export class AuthSubscriptionItem {
  key: string;
  subscription: Subscription
}
