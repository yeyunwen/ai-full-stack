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
  ProductQueryParams,
  ActivityQueryParams,
} from '../interfaces/chat.interface';
import * as dayjs from 'dayjs';

// 基础查询优化结果类型
interface QueryRefinementResult {
  keywords?: string[];
  userIntent?: string;
  preferences?: string[];
  constraints?: string[];
}

// 商品查询提取结果类型
interface ProductQueryExtractionResult {
  keywords: string[];
  categoryName?: string;
  goodsName?: string;
  minPrice?: number;
  maxPrice?: number;
}

// 活动查询提取结果类型
interface ActivityQueryExtractionResult {
  keywords: string[];
  title?: string;
  startTime?: string;
  endTime?: string;
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
   * 提取商品查询专用参数
   * @param message 用户原始消息
   * @param refinedQuery 已经提炼的基础查询参数
   * @returns 商品查询专用参数
   */
  async extractProductQueryParams(
    message: string,
    refinedQuery: RefinedQuery,
  ): Promise<ProductQueryParams> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的商品搜索解析专家。你需要从用户的查询中提取出结构化的商品搜索参数。输出必须是JSON格式。`,
          },
          {
            role: 'user',
            content: `从以下用户查询中，提取商品搜索API所需的参数。
            用户查询: "${message}"
            已识别的意图: "${refinedQuery.userIntent}"
            已提取的关键词: ${refinedQuery.keywords.join(', ')}
            偏好条件: ${refinedQuery.preferences?.join(', ') || '无'}
            约束条件: ${refinedQuery.constraints?.join(', ') || '无'}

            支持的商品分类:
            1.护肤美妆
            2.生活娱乐
            3.鞋帽配饰
            4.美食餐饮
            5.服饰包袋
            注：如果用户没有明确提到商品分类，请根据商品名称和描述判断分类，如果无法判断，请返回空字符串。不一定要完全匹配，只要大致符合即可，比如用户提到"衣服"，请判断为服饰包袋。

            请提取以下参数并以JSON格式输出:
            {
              "keywords": ["关键词1", "关键词2"],  // 搜索关键词
              "categoryName": "商品分类",              // 可能的商品分类
              "goodsName": "商品名称",              // 可能的商品名称
              "minPrice": 数字,                   // 最低价格，如果用户提到
              "maxPrice": 数字,                   // 最高价格，如果用户提到
            }

            注意：
            1. 仅在用户明确提到相关条件时才填充对应字段，否则保持字段空缺
            2. 价格必须是数字，不要包含货币符号
            3. 正确解析出用户可能表述的价格区间，如"千元以下"表示maxPrice为1000`,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content) as ProductQueryExtractionResult;

      // 构建最终参数，确保包含基础关键词
      return {
        keywords: result.keywords || refinedQuery.keywords,
        categoryName: result.categoryName,
        goodsName: result.goodsName,
        minPrice: result.minPrice,
        maxPrice: result.maxPrice,
      };
    } catch (error) {
      console.error('提取商品查询参数失败:', error);
      // 返回基础的查询参数
      return {
        keywords: refinedQuery.keywords,
      };
    }
  }

  /**
   * 提取活动查询专用参数
   * @param message 用户原始消息
   * @param refinedQuery 已经提炼的基础查询参数
   * @returns 活动查询专用参数
   */
  async extractActivityQueryParams(
    message: string,
    refinedQuery: RefinedQuery,
  ): Promise<ActivityQueryParams> {
    try {
      // 获取当前日期格式化为YYYY-MM-DD
      const nowDate = dayjs().format('YYYY-MM-DD');

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的活动搜索解析专家。你需要从用户的查询中提取出结构化的活动搜索参数。输出必须是JSON格式。`,
          },
          {
            role: 'user',
            content: `从以下用户查询中，提取活动搜索API所需的参数。
              用户查询: "${message}"
              已识别的意图: "${refinedQuery.userIntent}"
              已提取的关键词: ${refinedQuery.keywords.join(', ')}
              偏好条件: ${refinedQuery.preferences?.join(', ') || '无'}
              约束条件: ${refinedQuery.constraints?.join(', ') || '无'}
              当前日期: ${nowDate}
              请提取以下参数并以JSON格式输出:
              {
                "keywords": ["关键词1", "关键词2"],  // 搜索关键词
                "title": "活动名称",              // 可能的活动名称
                "startTime": "YYYY-MM-DD",          // 开始日期，如果用户提到
                "endTime": "YYYY-MM-DD",            // 结束日期，如果用户提到
              }

              注意：
              1. 仅在用户明确提到相关条件时才填充对应字段，否则保持字段空缺
              2. 日期必须使用YYYY-MM-DD格式
              3. 正确解析用户可能表述的时间信息，如"下个月"、"本周末"等，转换为具体日期`,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content) as ActivityQueryExtractionResult;

      // 构建最终参数，确保包含基础关键词
      return {
        keywords: result.keywords || refinedQuery.keywords,
        title: result.title,
        startTime: result.startTime,
        endTime: result.endTime,
      };
    } catch (error) {
      console.error('提取活动查询参数失败:', error);
      // 返回基础的查询参数
      return {
        keywords: refinedQuery.keywords,
      };
    }
  }

  /**
   * 为商品添加推荐理由
   * @param products 商品列表
   * @param refinedQuery 优化后的查询内容
   * @returns 增强后的商品列表，包含推荐理由
   */
  async addProductRecommendReasons(
    products: Product[],
    refinedQuery: RefinedQuery,
  ): Promise<EnhancedProduct[]> {
    try {
      // 构建用于AI的提示
      const prompt = `
      用户查询意图: "${refinedQuery.userIntent}"
      用户关键词: "${refinedQuery.keywords.join(', ')}"
      ${
        refinedQuery.preferences
          ? `用户偏好: "${refinedQuery.preferences.join(', ')}"`
          : ''
      }
      ${
        refinedQuery.constraints
          ? `用户限制条件: "${refinedQuery.constraints.join(', ')}"`
          : ''
      }

      为以下每个商品生成一个简短的推荐理由，解释为什么这个商品符合用户的需求。
      回复应该是JSON格式的数组，每个元素包含商品ID和推荐理由。

      商品列表:
      ${products
        .map(
          (p) =>
            `ID: ${p.id}, 名称: ${p.name}, 价格: ${p.retailPrice}元, 销量: ${p.sales}`,
        )
        .join('\n')}

      推荐理由应当简洁且具体，长度在15-30个汉字之间，重点突出商品如何满足用户需求。
      你的回复应该只包含JSON，不要有其他内容:
      [
        {"id": "商品ID", "reason": "推荐理由"},
        ...
      ]`;

      // 调用OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的商品推荐助手，擅长为商品生成个性化的推荐理由',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('未收到AI响应');
      }

      // 解析AI响应
      const parsedResponse = JSON.parse(content);
      const reasons = Array.isArray(parsedResponse)
        ? parsedResponse
        : parsedResponse.recommendations || parsedResponse.results || [];

      // 将推荐理由与商品合并
      return products.map((product) => {
        const match = reasons.find(
          (r: { id: string | number }) => String(r.id) === String(product.id),
        );
        return {
          ...product,
          recommendReason: match?.reason || this.getDefaultReason(product),
        };
      });
    } catch (error) {
      console.error('生成商品推荐理由时出错:', error);
      // 出错时使用默认推荐理由
      return products.map((product) => ({
        ...product,
        recommendReason: this.getDefaultReason(product),
      }));
    }
  }

  /**
   * 为活动添加推荐理由
   * @param activities 活动列表
   * @param refinedQuery 优化后的查询内容
   * @returns 增强后的活动列表，包含推荐理由
   */
  async addActivityRecommendReasons(
    activities: Activity[],
    refinedQuery: RefinedQuery,
  ): Promise<EnhancedActivity[]> {
    try {
      // 构建用于AI的提示
      const prompt = `
      用户查询意图: "${refinedQuery.userIntent}"
      用户关键词: "${refinedQuery.keywords.join(', ')}"
      ${
        refinedQuery.preferences
          ? `用户偏好: "${refinedQuery.preferences.join(', ')}"`
          : ''
      }
      ${
        refinedQuery.constraints
          ? `用户限制条件: "${refinedQuery.constraints.join(', ')}"`
          : ''
      }

      为以下每个活动生成一个简短的推荐理由，解释为什么这个活动符合用户的需求。
      回复应该是JSON格式的数组，每个元素包含活动ID和推荐理由。

      活动列表:
      ${activities
        .map(
          (a) =>
            `ID: ${a.id}, 标题: ${a.title}, 时间: ${a.startTime}至${a.endTime}${a.location ? `, 地点: ${a.location}` : ''}`,
        )
        .join('\n')}

      推荐理由应当简洁且具体，长度在15-30个汉字之间，重点突出活动如何满足用户需求。
      你的回复应该只包含JSON，不要有其他内容:
      [
        {"id": "活动ID", "reason": "推荐理由"},
        ...
      ]`;

      // 调用OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的活动推荐助手，擅长为活动生成个性化的推荐理由',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('未收到AI响应');
      }

      // 解析AI响应
      const parsedResponse = JSON.parse(content);
      const reasons = Array.isArray(parsedResponse)
        ? parsedResponse
        : parsedResponse.recommendations || parsedResponse.results || [];

      // 将推荐理由与活动合并
      return activities.map((activity) => {
        const match = reasons.find((r: { id: string }) => r.id === activity.id);
        return {
          ...activity,
          recommendReason:
            match?.reason || this.getDefaultActivityReason(activity),
        };
      });
    } catch (error) {
      console.error('生成活动推荐理由时出错:', error);
      // 出错时使用默认推荐理由
      return activities.map((activity) => ({
        ...activity,
        recommendReason: this.getDefaultActivityReason(activity),
      }));
    }
  }

  /**
   * 生成默认的商品推荐理由
   * @param product 商品
   * @returns 默认推荐理由
   */
  private getDefaultReason(product: Product): string {
    const reasons = [
      `${product.name}是热门畅销商品，已有${product.sales}人购买`,
      `该商品价格为${product.retailPrice}元，性价比高`,
      `${product.name}品质优良，深受广大用户喜爱`,
      `这款${product.name}是我们精选推荐的优质商品`,
    ];
    const randomIndex = Math.floor(Math.random() * reasons.length);
    return reasons[randomIndex];
  }

  /**
   * 生成默认的活动推荐理由
   * @param activity 活动
   * @returns 默认推荐理由
   */
  private getDefaultActivityReason(activity: Activity): string {
    const reasons = [
      `${activity.title}活动即将开始，不容错过`,
      `该活动时间为${activity.startTime}至${activity.endTime}，正符合您的需求`,
      `${activity.title}是当前最热门的活动之一`,
      `这个${activity.title}活动是我们精心推荐的`,
    ];
    const randomIndex = Math.floor(Math.random() * reasons.length);
    return reasons[randomIndex];
  }
}
