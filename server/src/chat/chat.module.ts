import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { IntentService } from './services/intent.service';
import { RecommendationService } from './services/recommendation.service';

@Module({
  providers: [ChatGateway, ChatService, IntentService, RecommendationService],
})
export class ChatModule {}
