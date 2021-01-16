export class SignalRChatModel {
  body: string;
  props: SignalRChatProps;

}

export class SignalRChatProps {
  CreatedAt: Date;
  FromUser: string;
  ToUser: string;
  Index: number;
  Timestamp: string;
  
}