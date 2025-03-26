import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import openaiConfig from './config/openai.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [openaiConfig],
    }),
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
