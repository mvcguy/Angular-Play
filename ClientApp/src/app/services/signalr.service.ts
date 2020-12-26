import { EventEmitter, Inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@aspnet/signalr';
import { AuthorizeService } from 'src/api-authorization/authorize.service';
import { SignalRChatModel } from './signalr.chat.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {

  private signalRHub: HubConnection
  public signalEmitter = new EventEmitter<SignalRChatModel>();

  constructor(@Inject('API_URL') private apiUrl: string) {
    this.buildConnection();
     this.startConnection();
  }
  startConnection() {
    if (this.signalRHub.state == HubConnectionState.Connected) return;

    this.signalRHub.start().then(
      () => {
        console.log('Connection has established');

        //TODO: try to reconnect if something goes wrong!
        //this.subscribeToChatSignals(userName);
      }
    ).catch(
      error => {
        console.error('SignalR: Error has occurred while connecting. Error: ', error);
      }
    );
  }
  buildConnection() {
    this.signalRHub = new HubConnectionBuilder()
      .withUrl(this.apiUrl + '/chathub')
      .build();
  }

  
  // TODO: fix: subscribe only once !
  subscribeToChatSignals(userName: string) {
        // TODO: use more secure way!    
    this.signalRHub.on(userName, (data: SignalRChatModel) => {
      console.log("SignalR: Signal received from server. Data: ", data);
      this.signalEmitter.emit(data);
    });
  }
}
