import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MessageService } from './message.service';
import { GetMessagesDto } from './dto/message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async getMessages(@Body() getMessagesDto: GetMessagesDto) {
    return this.messageService.getMessages(getMessagesDto);
  }
}
