import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { IntentService } from './services/intent.service';
import { RecommendationService } from './services/recommendation.service';
import { QueryEnhancerService } from './services/query-enhancer.service';

@Module({
  providers: [
    ChatGateway,
    ChatService,
    IntentService,
    RecommendationService,
    QueryEnhancerService,
  ],
})
export class ChatModule {}
