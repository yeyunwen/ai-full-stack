import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatError } from './errors/chat.error';
import { IntentService } from './services/intent.service';
import { RecommendationService } from './services/recommendation.service';
import { QueryEnhancerService } from './services/query-enhancer.service';
import {
  IntentType,
  // 这些接口实际上在代码中使用了，TypeScript可能无法追踪到
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  RecommendationResponse,
  EnhancedRecommendationResponse,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  RefinedQuery,
} from './interfaces/chat.interface';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private readonly model: string;

  constructor(
    private configService: ConfigService,
    private intentService: IntentService,
    private recommendationService: RecommendationService,
    private queryEnhancerService: QueryEnhancerService,
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
  ): Promise<string | EnhancedRecommendationResponse> {
    try {
      // 1. 分析用户消息意图
      const intentAnalysis = await this.intentService.analyzeIntent(message);

      // 2. 提炼查询参数
      const refinedQuery = await this.queryEnhancerService.refineQuery(
        message,
        intentAnalysis.intent,
        intentAnalysis.keywords,
      );

      // 3. 根据意图类型处理消息
      switch (intentAnalysis.intent) {
        case IntentType.PRODUCT: {
          // 获取商品推荐
          const basicRecommendation =
            this.recommendationService.getProductRecommendations(
              refinedQuery.keywords,
            );
          // 增强商品推荐信息
          const enhancedProducts =
            await this.queryEnhancerService.addProductRecommendReasons(
              basicRecommendation.items as any[],
              refinedQuery,
            );
          // 返回增强的推荐响应
          return {
            text: basicRecommendation.text,
            items: enhancedProducts,
            type: IntentType.PRODUCT,
            queryContext: refinedQuery.userIntent,
          };
        }

        case IntentType.ACTIVITY: {
          // 获取活动推荐
          const basicRecommendation =
            this.recommendationService.getActivityRecommendations(
              refinedQuery.keywords,
            );
          // 增强活动推荐信息
          const enhancedActivities =
            await this.queryEnhancerService.addActivityRecommendReasons(
              basicRecommendation.items as any[],
              refinedQuery,
            );
          // 返回增强的推荐响应
          return {
            text: basicRecommendation.text,
            items: enhancedActivities,
            type: IntentType.ACTIVITY,
            queryContext: refinedQuery.userIntent,
          };
        }

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
   * 流式处理用户消息，分析意图并通过回调函数返回部分结果
   * @param message 用户输入的消息
   * @param callback 处理部分结果的回调函数
   */
  async processMessageStream(
    message: string,
    callback: (chunk: string, done: boolean) => void,
  ): Promise<void> {
    try {
      // 1. 分析用户消息意图
      callback('正在分析您的问题...', false);
      const intentAnalysis = await this.intentService.analyzeIntent(message);

      // 2. 提炼查询参数
      callback('\n正在理解您的需求...', false);
      const refinedQuery = await this.queryEnhancerService.refineQuery(
        message,
        intentAnalysis.intent,
        intentAnalysis.keywords,
      );

      // 3. 根据意图类型处理消息
      switch (intentAnalysis.intent) {
        case IntentType.PRODUCT:
          await this.handleProductRecommendationStream(refinedQuery, callback);
          break;

        case IntentType.ACTIVITY:
          await this.handleActivityRecommendationStream(refinedQuery, callback);
          break;

        case IntentType.GENERAL:
        default:
          // 一般问答，使用AI流式回答
          await this.getAiResponseStream(message, callback);
          break;
      }
    } catch (error) {
      console.error('处理流式消息错误:', error);
      if (error instanceof ChatError) {
        callback(`错误: ${error.message}`, true);
      } else {
        callback('AI服务暂时不可用，请稍后再试。', true);
      }
    }
  }

  /**
   * 处理商品推荐的流式响应
   * @param refinedQuery 优化的查询参数
   * @param callback 回调函数
   */
  private async handleProductRecommendationStream(
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean) => void,
  ): Promise<void> {
    try {
      // 1. 获取基础推荐
      callback('正在为您搜索相关商品...', false);
      const basicRecommendation =
        this.recommendationService.getProductRecommendations(
          refinedQuery.keywords,
        );

      // 2. 增强商品推荐信息
      callback('\n正在为您生成个性化推荐...', false);
      const enhancedProducts =
        await this.queryEnhancerService.addProductRecommendReasons(
          basicRecommendation.items as any[],
          refinedQuery,
        );

      // 3. 构建完整的增强推荐响应
      const enhancedResponse: EnhancedRecommendationResponse = {
        text: basicRecommendation.text,
        items: enhancedProducts,
        type: IntentType.PRODUCT,
        queryContext: refinedQuery.userIntent,
      };

      // 4. 发送最终结果
      callback(JSON.stringify(enhancedResponse), true);
    } catch (error) {
      console.error('商品推荐流处理错误:', error);
      callback('获取商品推荐失败，请稍后再试。', true);
    }
  }

  /**
   * 处理活动推荐的流式响应
   * @param refinedQuery 优化的查询参数
   * @param callback 回调函数
   */
  private async handleActivityRecommendationStream(
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean) => void,
  ): Promise<void> {
    try {
      // 1. 获取基础推荐
      callback('正在为您搜索相关活动...', false);
      const basicRecommendation =
        this.recommendationService.getActivityRecommendations(
          refinedQuery.keywords,
        );

      // 2. 增强活动推荐信息
      callback('\n正在为您生成个性化推荐...', false);
      const enhancedActivities =
        await this.queryEnhancerService.addActivityRecommendReasons(
          basicRecommendation.items as any[],
          refinedQuery,
        );

      // 3. 构建完整的增强推荐响应
      const enhancedResponse: EnhancedRecommendationResponse = {
        text: basicRecommendation.text,
        items: enhancedActivities,
        type: IntentType.ACTIVITY,
        queryContext: refinedQuery.userIntent,
      };

      // 4. 发送最终结果
      callback(JSON.stringify(enhancedResponse), true);
    } catch (error) {
      console.error('活动推荐流处理错误:', error);
      callback('获取活动推荐失败，请稍后再试。', true);
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

  /**
   * 获取AI的流式回复
   * @param message 用户输入的消息
   * @param callback 处理部分结果的回调函数
   */
  private async getAiResponseStream(
    message: string,
    callback: (chunk: string, done: boolean) => void,
  ): Promise<void> {
    const stream = await this.openai.chat.completions.create({
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
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        callback(content, false);
      }
    }

    // 标记流结束
    callback('', true);
  }
}
