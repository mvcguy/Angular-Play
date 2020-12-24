import { EventEmitter, Inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
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
    this.signalRHub.start().then(
      () => {
        console.log('Connection has established');
        this.subscribeToChatSignals();
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

  subscribeToChatSignals() {
    this.signalRHub.on("ClientSideMethod", (data : SignalRChatModel) => {
      console.log("SignalR: Signal received from server. Data: ", data);
      this.signalEmitter.emit(data);
    });
  }


}
