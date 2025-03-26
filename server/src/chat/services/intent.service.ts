import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IntentAnalysisResult, IntentType } from '../interfaces/chat.interface';
import { ChatError } from '../errors/chat.error';

@Injectable()
export class IntentService {
  private openai: OpenAI;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
      baseURL: this.configService.get<string>('openai.baseURL'),
    });
    this.model = this.configService.get<string>('openai.model') as string;
  }

  /**
   * 分析用户消息的意图和提取关键词
   * @param message 用户输入的消息
   * @returns 意图分析结果，包含意图类型和关键词
   */
  async analyzeIntent(message: string): Promise<IntentAnalysisResult> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的意图分析助手。你需要分析用户消息中的意图并提取关键词。
            可能的意图类型有：
            1. PRODUCT - 用户想要了解或购买商品
            2. ACTIVITY - 用户想要了解活动信息
            3. GENERAL - 用户在进行普通问答，不涉及商品或活动

            你需要以JSON格式返回分析结果，格式为:
            {
              "intent": "PRODUCT|ACTIVITY|GENERAL",
              "keywords": ["关键词1", "关键词2", ...]
            }

            只返回JSON格式的结果，不要有其他内容。`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('未收到AI响应');
      }

      try {
        const result = JSON.parse(content) as IntentAnalysisResult;
        // 验证返回的意图类型是否有效
        if (!Object.values(IntentType).includes(result.intent)) {
          result.intent = IntentType.GENERAL;
        }
        return result;
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
        return {
          intent: IntentType.GENERAL,
          keywords: [],
        };
      }
    } catch (error) {
      console.error('意图分析服务错误:', error);
      throw new ChatError('意图分析服务暂时不可用', 'INTENT_SERVICE_ERROR');
    }
  }
}
