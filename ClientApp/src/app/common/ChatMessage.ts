
export class ChatMessage {
  fromUser?: string;
  toUser?: string;
  message?: string;
  timestamp?: string;
  index?: number;
  seen: boolean;
}

export class UserChat {
  userName: string
  chatMessages: ChatMessage[]
}
