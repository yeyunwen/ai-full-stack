import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatError } from './errors/chat.error';
import { IntentService } from './services/intent.service';
import { RecommendationService } from './services/recommendation.service';
import {
  IntentType,
  RecommendationResponse,
} from './interfaces/chat.interface';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private readonly model: string;

  constructor(
    private configService: ConfigService,
    private intentService: IntentService,
    private recommendationService: RecommendationService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
      baseURL: this.configService.get<string>('openai.baseURL'),
    });
    this.model = this.configService.get<string>('openai.model') as string;
  }

  /**
   * 处理用户消息，分析意图并返回相应的回复或推荐
   * @param message 用户输入的消息
   * @returns 处理后的回复或推荐内容
   */
  async processMessage(
    message: string,
  ): Promise<string | RecommendationResponse> {
    try {
      // 1. 分析用户消息意图
      const intentAnalysis = await this.intentService.analyzeIntent(message);

      // 2. 根据意图类型处理消息
      switch (intentAnalysis.intent) {
        case IntentType.PRODUCT:
          // 获取商品推荐
          return this.recommendationService.getProductRecommendations(
            intentAnalysis.keywords,
          );

        case IntentType.ACTIVITY:
          // 获取活动推荐
          return this.recommendationService.getActivityRecommendations(
            intentAnalysis.keywords,
          );

        case IntentType.GENERAL:
        default:
          // 一般问答，使用AI回答
          return await this.getAiResponse(message);
      }
    } catch (error) {
      console.error('处理消息错误:', error);
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('AI服务暂时不可用，请稍后再试。', 'AI_SERVICE_ERROR');
    }
  }

  /**
   * 获取AI的回复
   * @param message 用户输入的消息
   * @returns AI生成的回复内容
   */
  private async getAiResponse(message: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是一个有帮助的AI助手，请用简洁友好的方式回答问题。',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '抱歉，我现在无法回答。';
  }
}
