import { EventEmitter, Inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, IHttpConnectionOptions } from '@aspnet/signalr';
import { Subscription } from 'rxjs';
import { AuthorizeService } from 'src/api-authorization/authorize.service';
import { SignalRChatModel } from './signalr.chat.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {

  private signalRHub: HubConnection
  public signalEmitter: EventEmitter<SignalRChatModel>;
  public subscriptions: SubscriptionItem[];

  constructor(@Inject('API_URL') private apiUrl: string
    , private authorize: AuthorizeService
  ) {
    this.signalEmitter = new EventEmitter<SignalRChatModel>();
    this.buildConnection();
    this.startConnection();
    this.subscriptions = [];
  }
  startConnection() {
    if (this.signalRHub.state == HubConnectionState.Connected) return;

    this.signalRHub.start().then(
      () => {
        console.log('Connection has established');

        //TODO: try to reconnect if something goes wrong!
      }
    ).catch(
      error => {
        console.error('SignalR: Error has occurred while connecting. Error: ', error);
      }
    );
  }
  buildConnection() {

    const options: IHttpConnectionOptions = {
      accessTokenFactory: () => this.authorize.getAccessToken().toPromise()
    };

    this.signalRHub = new HubConnectionBuilder()
      .withUrl(this.apiUrl + '/chathub', options)
      .build();
  }

  subscribeToChatSignals(userName: string, newMethod: (...args: any[]) => void) {
    // TODO: use more secure way!    
    // debugger;
    var index = this.subscriptions.findIndex(({ key }) => key === userName);
    if (index !== -1) {
      // delete the existing subscription 
      var existingSub = this.subscriptions.splice(index, 1)[0];
      existingSub.subscription.unsubscribe();
    };

    // TODO: add callback for errors and complete
    var sub = this.signalEmitter.subscribe(newMethod);
    this.subscriptions.push({ key: userName, subscription: sub });
    // remove the handler if exist from before
    this.signalRHub.off(userName);

    // register the handler
    this.signalRHub.on(userName, (data: SignalRChatModel) => {
      console.log("SignalR: Signal received from server. Data: ", data);
      this.signalEmitter.emit(data);
    });
  }
}

export class SubscriptionItem {
  key: string;
  subscription: Subscription
}
