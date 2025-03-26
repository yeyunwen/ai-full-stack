import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  RefinedQuery,
  Product,
  Activity,
  EnhancedProduct,
  EnhancedActivity,
  IntentType,
} from '../interfaces/chat.interface';

// 定义API响应的类型
interface QueryRefinementResult {
  keywords?: string[];
  userIntent?: string;
  preferences?: string[];
  constraints?: string[];
}

@Injectable()
export class QueryEnhancerService {
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
   * 提炼用户查询，优化搜索关键词
   * @param message 用户原始消息
   * @param intent 已识别的意图类型
   * @param keywords 初步识别的关键词
   * @returns 优化后的查询参数
   */
  async refineQuery(
    message: string,
    intent: IntentType,
    keywords: string[],
  ): Promise<RefinedQuery> {
    const intentType = intent === IntentType.PRODUCT ? '商品' : '活动';

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的${intentType}搜索专家。你需要从用户的查询中提取出最关键、最准确的搜索参数，以提高搜索效果。输出必须是JSON格式。`,
          },
          {
            role: 'user',
            content: `根据以下用户查询，提炼出最有效的搜索参数，包括关键词、用户真实意图、偏好和约束条件。
用户查询: "${message}"
初步识别的关键词: ${keywords.join(', ')}
请输出JSON格式的结果，包含以下字段：
{
  "keywords": ["关键词1", "关键词2", ...],
  "userIntent": "用户的真实意图描述",
  "preferences": ["偏好1", "偏好2", ...],
  "constraints": ["约束1", "约束2", ...]
}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';

      // 使用明确的类型转换
      const result = JSON.parse(content) as QueryRefinementResult;
      return {
        keywords: result.keywords || keywords,
        userIntent: result.userIntent || `查找相关${intentType}`,
        preferences: result.preferences || [],
        constraints: result.constraints || [],
      };
    } catch (error) {
      console.error('提炼查询参数失败:', error);
      // 返回原始关键词
      return {
        keywords,
        userIntent: `查找相关${intentType}`,
        preferences: [],
        constraints: [],
      };
    }
  }

  /**
   * 为商品添加个性化推荐原因
   * @param products 商品列表
   * @param refinedQuery 优化的查询参数
   * @returns 带有推荐原因的商品列表
   */
  async addProductRecommendReasons(
    products: Product[],
    refinedQuery: RefinedQuery,
  ): Promise<EnhancedProduct[]> {
    if (products.length === 0) return [];

    // 并行处理所有商品的推荐原因生成
    const enhancedProducts = await Promise.all(
      products.map(async (product) => {
        const reason = await this.generateRecommendReason(
          product,
          refinedQuery,
          IntentType.PRODUCT,
        );
        return { ...product, recommendReason: reason };
      }),
    );

    return enhancedProducts;
  }

  /**
   * 为活动添加个性化推荐原因
   * @param activities 活动列表
   * @param refinedQuery 优化的查询参数
   * @returns 带有推荐原因的活动列表
   */
  async addActivityRecommendReasons(
    activities: Activity[],
    refinedQuery: RefinedQuery,
  ): Promise<EnhancedActivity[]> {
    if (activities.length === 0) return [];

    // 并行处理所有活动的推荐原因生成
    const enhancedActivities = await Promise.all(
      activities.map(async (activity) => {
        const reason = await this.generateRecommendReason(
          activity,
          refinedQuery,
          IntentType.ACTIVITY,
        );
        return { ...activity, recommendReason: reason };
      }),
    );

    return enhancedActivities;
  }

  /**
   * 生成单个商品或活动的推荐原因
   * @param item 商品或活动
   * @param refinedQuery 优化的查询参数
   * @param type 意图类型
   * @returns 推荐原因文本
   */
  private async generateRecommendReason(
    item: Product | Activity,
    refinedQuery: RefinedQuery,
    type: IntentType,
  ): Promise<string> {
    const itemType = type === IntentType.PRODUCT ? '商品' : '活动';
    const itemName =
      type === IntentType.PRODUCT
        ? (item as Product).name
        : (item as Activity).title;
    const itemDesc = item.description;

    // 构建用户偏好和约束条件文本
    const preferencesText = refinedQuery.preferences?.length
      ? `用户的偏好: ${refinedQuery.preferences.join(', ')}`
      : '';

    const constraintsText = refinedQuery.constraints?.length
      ? `用户的约束条件: ${refinedQuery.constraints.join(', ')}`
      : '';

    // 构建商品或活动特定信息
    const itemSpecificInfo =
      type === IntentType.PRODUCT
        ? `价格: ¥${(item as Product).price}`
        : `时间: ${(item as Activity).startDate} 至 ${(item as Activity).endDate}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的${itemType}推荐专家。你需要生成一个简短但有说服力的理由，解释为什么向用户推荐这个${itemType}。`,
          },
          {
            role: 'user',
            content: `用户的意图: "${refinedQuery.userIntent}"
              用户的关键词: ${refinedQuery.keywords.join(', ')}
              ${preferencesText}
              ${constraintsText}

              ${itemType}信息:
              名称: ${itemName}
              描述: ${itemDesc}
              ${itemSpecificInfo}

              请生成一个简短的推荐理由(不超过50字)，说明为什么这个${itemType}适合该用户。`,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      return (
        completion.choices[0]?.message?.content ||
        `这是一个可能符合您需求的${itemType}`
      );
    } catch (error) {
      console.error(`生成${itemType}推荐原因失败:`, error);
      return `这是一个可能符合您需求的${itemType}`;
    }
  }
}
