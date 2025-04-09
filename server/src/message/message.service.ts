import { Injectable } from '@nestjs/common';
import { GetMessagesDto } from './dto/message.dto';
import { MessageService as ChatMessageService } from '../chat/services/message.service';

@Injectable()
export class MessageService {
  constructor(private chatMessageService: ChatMessageService) {}

  async getMessages(getMessagesDto: GetMessagesDto) {
    const { token, limit = 10 } = getMessagesDto;
    return this.chatMessageService.getConversationHistory(token, limit);
  }
}
