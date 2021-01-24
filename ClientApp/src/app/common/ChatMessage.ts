
export class ChatMessage {
  fromUser?: string;
  toUser?: string;
  message?: string;
  timestamp?: string;
  index?: number;
  seen: boolean;
}

export class AudioMessage {
  fromUser?: string;
  toUser?: string;
  pcmStream: number[];
}

export class UserChat {
  userName: string
  chatMessages: ChatMessage[]
}
