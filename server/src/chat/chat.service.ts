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
  EnhancedRecommendationResponse,
  RefinedQuery,
  Product,
  Activity,
  ProductQueryParams,
  ActivityQueryParams,
  ApiDataResponse,
  Journey,
  Coupon,
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
          // 提取商品专用查询参数
          const productQueryParams =
            await this.queryEnhancerService.extractProductQueryParams(
              message,
              refinedQuery,
            );

          console.log('提取的商品查询参数:', productQueryParams);

          // 获取商品推荐
          const basicRecommendation =
            await this.recommendationService.getProductRecommendations(
              productQueryParams,
            );

          // 增强商品推荐信息
          const enhancedProducts =
            await this.queryEnhancerService.addProductRecommendReasons(
              basicRecommendation.items as Product[],
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
          // 提取活动专用查询参数
          const activityQueryParams =
            await this.queryEnhancerService.extractActivityQueryParams(
              message,
              refinedQuery,
            );

          console.log('提取的活动查询参数:', activityQueryParams);

          // 获取活动推荐
          const basicRecommendation =
            await this.recommendationService.getActivityRecommendations(
              activityQueryParams,
            );

          // 增强活动推荐信息
          const enhancedActivities =
            await this.queryEnhancerService.addActivityRecommendReasons(
              basicRecommendation.items as Activity[],
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
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
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
      let productQueryParams: ProductQueryParams;
      let activityQueryParams: ActivityQueryParams;

      switch (intentAnalysis.intent) {
        case IntentType.PRODUCT:
          // 提取商品专用查询参数
          callback('\n提取商品搜索参数...', false);
          productQueryParams =
            await this.queryEnhancerService.extractProductQueryParams(
              message,
              refinedQuery,
            );
          await this.handleProductRecommendationStream(
            productQueryParams,
            refinedQuery,
            callback,
          );
          break;

        case IntentType.ACTIVITY:
          // 提取活动专用查询参数
          callback('\n提取活动搜索参数...', false);
          activityQueryParams =
            await this.queryEnhancerService.extractActivityQueryParams(
              message,
              refinedQuery,
            );
          await this.handleActivityRecommendationStream(
            activityQueryParams,
            refinedQuery,
            callback,
          );
          break;

        case IntentType.JOURNEY:
          callback('\n提取路线搜索参数...', false);
          await this.handleJourneyRecommendationStream(refinedQuery, callback);
          break;

        case IntentType.COUPON:
          callback('\n提取优惠券搜索参数...', false);
          await this.handleCouponRecommendationStream(refinedQuery, callback);
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
   * @param queryParams 商品查询参数
   * @param refinedQuery 优化的查询参数
   * @param callback 回调函数
   */
  private async handleProductRecommendationStream(
    queryParams: ProductQueryParams,
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ): Promise<void> {
    try {
      // 1. 获取商品推荐
      callback('正在为您搜索相关商品...', false);
      const recommendation =
        await this.recommendationService.getProductRecommendations(queryParams);

      // 2. 构建响应文本并流式返回
      callback('\n\n' + recommendation.text + '\n\n', false);

      // 3. 为商品生成推荐理由并流式返回
      await this.generateProductRecommendationsStream(
        recommendation.items as Product[],
        refinedQuery,
        callback,
      );

      // 4. 发送API数据用于前端展示
      callback('', true, {
        type: 'product',
        items: recommendation.items as Product[],
        isExactMatch: recommendation.isExactMatch,
      });
    } catch (error) {
      console.error('商品推荐流处理错误:', error);
      callback('获取商品推荐失败，请稍后再试。', true);
    }
  }

  /**
   * 处理活动推荐的流式响应
   * @param queryParams 活动查询参数
   * @param refinedQuery 优化的查询参数
   * @param callback 回调函数
   */
  private async handleActivityRecommendationStream(
    queryParams: ActivityQueryParams,
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ): Promise<void> {
    try {
      // 1. 获取活动推荐
      callback('正在为您搜索相关活动...', false);
      const recommendation =
        await this.recommendationService.getActivityRecommendations(
          queryParams,
        );

      // 2. 构建响应文本并流式返回
      callback('\n\n' + recommendation.text + '\n\n', false);

      // 3. 为活动生成推荐理由并流式返回
      await this.generateActivityRecommendationsStream(
        recommendation.items as Activity[],
        refinedQuery,
        callback,
      );

      // 4. 发送API数据用于前端展示
      callback('', true, {
        type: 'activity',
        items: recommendation.items as Activity[],
        isExactMatch: recommendation.isExactMatch,
      });
    } catch (error) {
      console.error('活动推荐流处理错误:', error);
      callback('获取活动推荐失败，请稍后再试。', true);
    }
  }

  private async handleJourneyRecommendationStream(
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ) {
    try {
      // 1. 获取路线推荐
      callback('正在为您搜索相关路线...', false);
      const recommendation =
        await this.recommendationService.getJourneyRecommendations();

      // 2. 构建响应文本并流式返回
      callback('\n\n' + recommendation.text + '\n\n', false);

      // 3. 为活动生成推荐理由并流式返回
      await this.generateJourneyRecommendationsStream(
        recommendation.items as Journey[],
        refinedQuery,
        callback,
      );

      // 4. 发送API数据用于前端展示
      callback('', true, {
        type: 'journey',
        items: recommendation.items as Journey[],
        isExactMatch: recommendation.isExactMatch,
      });
    } catch (error) {
      console.error('行程推荐流处理错误:', error);
      callback('获取行程推荐失败，请稍后再试。', true);
    }
  }

  private async handleCouponRecommendationStream(
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ) {
    try {
      // 1. 获取优惠券推荐
      callback('正在为您搜索相关优惠券...', false);
      const recommendation =
        await this.recommendationService.getCouponRecommendations();

      // 2. 构建响应文本并流式返回
      callback('\n\n' + recommendation.text + '\n\n', false);

      // 3. 为活动生成推荐理由并流式返回
      await this.generateCouponRecommendationsStream(
        recommendation.items as Coupon[],
        refinedQuery,
        callback,
      );

      // 4. 发送API数据用于前端展示
      callback('', true, {
        type: 'coupon',
        items: recommendation.items as Coupon[],
        isExactMatch: recommendation.isExactMatch,
      });
    } catch (error) {
      console.error('优惠券推荐流处理错误:', error);
      callback('获取优惠券推荐失败，请稍后再试。', true);
    }
  }

  /**
   * 为商品生成推荐理由并流式返回
   * @param products 商品列表
   * @param refinedQuery 优化的查询参数
   * @param callback 回调函数
   */
  private async generateProductRecommendationsStream(
    products: Product[],
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ): Promise<void> {
    try {
      // 构建用于AI的提示
      const prompt = `
      用户查询意图: "${refinedQuery.userIntent}"
      用户关键词: "${refinedQuery.keywords.join(', ')}"
      ${refinedQuery.preferences ? `用户偏好: "${refinedQuery.preferences.join(', ')}"` : ''}
      ${refinedQuery.constraints ? `用户限制条件: "${refinedQuery.constraints.join(', ')}"` : ''}

      根据用户的需求，为以下商品生成一段综合推荐，突出这些商品如何满足用户需求。
      用通俗易懂的语言，解释为什么这些商品适合用户。
      生成的推荐内容最多不要超过300字，语言自然流畅，避免过度营销。
      使用emoji符号开头，并且保持回答的连贯性和专业性，回答结构清晰，明了。

      商品列表:
      ${products.map((p) => `ID: ${p.id}, 名称: ${p.name}, 价格: ${p.retailPrice}元, 销量: ${p.sales}`).join('\n')}
      `;

      // 调用OpenAI API的流式接口
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的商品推荐助手，擅长为商品生成个性化的推荐理由，内容生动有趣、通俗易懂，能够帮助用户快速理解商品的价值和适用场景。',
          },
          {
            role: 'user',
            content: prompt,
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
    } catch (error) {
      console.error('生成商品推荐理由流式响应时出错:', error);
      callback('无法生成详细推荐理由，但您可以查看下方商品。', false);
    }
  }

  /**
   * 为活动生成推荐理由并流式返回
   * @param activities 活动列表
   * @param refinedQuery 优化的查询参数
   * @param callback 回调函数
   */
  private async generateActivityRecommendationsStream(
    activities: Activity[],
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ): Promise<void> {
    try {
      // 构建用于AI的提示
      const prompt = `
      用户查询意图: "${refinedQuery.userIntent}"
      用户关键词: "${refinedQuery.keywords.join(', ')}"
      ${refinedQuery.preferences ? `用户偏好: "${refinedQuery.preferences.join(', ')}"` : ''}
      ${refinedQuery.constraints ? `用户限制条件: "${refinedQuery.constraints.join(', ')}"` : ''}

      根据用户的需求，为以下活动生成一段综合推荐，突出这些活动如何满足用户需求。
      用通俗易懂的语言，解释为什么这些活动适合用户。
      生成的推荐内容最多不要超过300字，语言自然流畅，避免过度营销。
      使用emoji符号开头，并且保持回答的连贯性和专业性，回答结构清晰，明了。

      注意:不要返回活动ID

      活动列表:
      ${activities.map((a) => `ID: ${a.id}, 标题: ${a.title}, 时间: ${a.startTime}至${a.endTime}${a.location ? `, 地点: ${a.location}` : ''}`).join('\n')}
      `;

      // 调用OpenAI API的流式接口
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的活动推荐助手，擅长为活动生成个性化的推荐理由，内容生动有趣、通俗易懂，能够帮助用户快速理解活动的价值和参与意义。',
          },
          {
            role: 'user',
            content: prompt,
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
    } catch (error) {
      console.error('生成活动推荐理由流式响应时出错:', error);
      callback('无法生成详细推荐理由，但您可以查看下方活动。', false);
    }
  }

  /**
   * 为行程生成推荐理由并流式返回
   * @param journeys 行程列表
   * @param refinedQuery 优化的查询参数
   * @param callback 回调函数
   */
  private async generateJourneyRecommendationsStream(
    journeys: Journey[],
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ): Promise<void> {
    try {
      // 构建用于AI的提示
      const prompt = `
      用户查询意图: "${refinedQuery.userIntent}"
      用户关键词: "${refinedQuery.keywords.join(', ')}"
      ${refinedQuery.preferences ? `用户偏好: "${refinedQuery.preferences.join(', ')}"` : ''}
      ${refinedQuery.constraints ? `用户限制条件: "${refinedQuery.constraints.join(', ')}"` : ''}

      根据用户的需求，为以下行程生成一段综合推荐，突出这些行程如何满足用户需求。
      用通俗易懂的语言，解释为什么这些行程适合用户。
      生成的推荐内容最多不要超过300字，语言自然流畅，避免过度营销。
      使用emoji符号开头，并且保持回答的连贯性和专业性，回答结构清晰，明了。

      行程列表:
      ${journeys.map((j) => `ID: ${j.id}, 名称: ${j.name}, 地点: ${j.location}, 介绍: ${j.introduce}`).join('\n')}

      格式结构为：
      emoji + 总体行程标题
      ---
      时间段 （必须项）
      emoji + 地点名称
      推荐理由或者地点简介描述
      ---
      小贴士：

      `;

      // 调用OpenAI API的流式接口
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          callback(content, false);
        }
      }
    } catch (error) {
      console.error('生成行程推荐理由流式响应时出错:', error);
      callback('无法生成详细推荐理由，但您可以查看下方行程。', false);
    }
  }

  private async generateCouponRecommendationsStream(
    coupons: Coupon[],
    refinedQuery: RefinedQuery,
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
  ): Promise<void> {
    try {
      // 构建用于AI的提示
      const prompt = `
      用户查询意图: "${refinedQuery.userIntent}"
      用户关键词: "${refinedQuery.keywords.join(', ')}"
      ${refinedQuery.preferences ? `用户偏好: "${refinedQuery.preferences.join(', ')}"` : ''}
      ${refinedQuery.constraints ? `用户限制条件: "${refinedQuery.constraints.join(', ')}"` : ''}

      根据用户的需求，为以下优惠券生成一段综合推荐，突出这些优惠券如何满足用户需求。
      用通俗易懂的语言，解释为什么这些优惠券适合用户。
      生成的推荐内容最多不要超过100字，语言自然流畅，避免过度营销。
      使用emoji符号开头，并且保持回答的连贯性和专业性，回答结构清晰，明了。

      优惠券列表:
      ${coupons.map((j) => `ID: ${j.id}, 名称: ${j.name}, 条件: ${j.restrictionPrice}元, 折扣: ${j.discount}元 ${j.startTime}至${j.endTime}`).join('\n')}
      `;

      // 调用OpenAI API的流式接口
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          callback(content, false);
        }
      }
    } catch (error) {
      console.error('生成行程推荐理由流式响应时出错:', error);
      callback('无法生成详细推荐理由，但您可以查看下方行程。', false);
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
    callback: (chunk: string, done: boolean, apiData?: ApiDataResponse) => void,
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

    // 标记流结束，不传递API数据
    callback('', true);
  }
}
