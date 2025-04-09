import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import {
  Activity,
  IntentType,
  Product,
  RecommendationResponse,
  ProductQueryParams,
  ActivityQueryParams,
  ProductResponse,
  ActivityResponse,
  Journey,
  JourneyResponse,
  Coupon,
  CouponResponse,
} from '../interfaces/chat.interface';

@Injectable()
export class RecommendationService {
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;

  // 模拟数据库中的商品数据 - 仅在外部API不可用时使用
  private products: Product[] = [
    {
      id: 1,
      name: '智能手机',
      retailPrice: 4999,
      picUrl: 'https://example.com/smartphone.jpg',
      sales: 100,
    },
    {
      id: 2,
      name: '笔记本电脑',
      retailPrice: 6999,
      picUrl: 'https://example.com/laptop.jpg',
      sales: 50,
    },
    {
      id: 3,
      name: '智能手表',
      retailPrice: 1599,
      picUrl: 'https://example.com/smartwatch.jpg',
      sales: 200,
    },
    {
      id: 4,
      name: '无线耳机',
      retailPrice: 899,
      picUrl: 'https://example.com/headphones.jpg',
      sales: 300,
    },
    {
      id: 5,
      name: '平板电脑',
      retailPrice: 3699,
      picUrl: 'https://example.com/tablet.jpg',
      sales: 150,
    },
  ];

  // 模拟数据库中的活动数据 - 仅在外部API不可用时使用
  private activities: Activity[] = [
    {
      id: 'a1',
      title: '双11全球购物节',
      startTime: '2023-11-01',
      endTime: '2023-11-12',
      cover: 'https://example.com/double11.jpg',
      location: '全球',
    },
    {
      id: 'a2',
      title: '新品发布会',
      startTime: '2023-10-15',
      endTime: '2023-10-15',
      cover: 'https://example.com/newproduct.jpg',
      location: '北京',
    },
    {
      id: 'a3',
      title: '教师节特惠',
      startTime: '2023-09-08',
      endTime: '2023-09-10',
      cover: 'https://example.com/teachersday.jpg',
      location: '北京',
    },
    {
      id: 'a4',
      title: '夏季清凉特卖',
      startTime: '2023-07-01',
      endTime: '2023-08-15',
      cover: 'https://example.com/summer.jpg',
      location: '北京',
    },
    {
      id: 'a5',
      title: '会员专享日',
      startTime: '2023-06-18',
      endTime: '2023-06-20',
      cover: 'https://example.com/member.jpg',
      location: '北京',
    },
  ];

  constructor(private configService: ConfigService) {
    // 从配置中获取API URL和密钥
    this.apiBaseUrl = this.configService.get<string>(
      'server.apiBaseURL',
    ) as string;
    this.apiKey = this.configService.get<string>('server.token') as string;
  }

  /**
   * 根据查询参数搜索商品
   * @param queryParams 商品搜索参数
   * @returns 推荐的商品和响应文本
   */
  async getProductRecommendations(
    queryParams: ProductQueryParams,
  ): Promise<RecommendationResponse> {
    try {
      // 尝试从外部API获取商品数据
      const { products, isExactMatch } =
        await this.fetchProductsFromApi(queryParams);

      // 限制商品数量最多为5个
      const limitedProducts = products.slice(0, 5);

      // 构建响应文本
      let responseText: string;
      if (isExactMatch) {
        responseText = `根据您的需求"${queryParams.keywords.join('、')}"${
          queryParams.categoryName
            ? `，在${queryParams.categoryName}分类下`
            : ''
        }${
          queryParams.minPrice ? `，价格不低于${queryParams.minPrice}元` : ''
        }${
          queryParams.maxPrice ? `，价格不超过${queryParams.maxPrice}元` : ''
        }，为您找到${products.length > 5 ? `${products.length}个匹配商品，以下是其中的5个` : '以下匹配商品'}：`;
      } else {
        responseText = `很抱歉，没有找到与您需求"${queryParams.keywords.join('、')}"完全匹配的商品，以下是一些您可能感兴趣的推荐商品：`;
      }

      return {
        text: responseText,
        items: limitedProducts,
        type: IntentType.PRODUCT,
        isExactMatch,
      };
    } catch (error) {
      console.error('获取商品推荐失败:', error);
      // 发生错误时返回本地数据，限制为3个
      const randomProducts = this.getRandomItems(this.products, 3);
      return {
        text: `很抱歉，搜索服务暂时不可用，以下是一些热门商品推荐：`,
        items: randomProducts,
        type: IntentType.PRODUCT,
        isExactMatch: false,
      };
    }
  }

  /**
   * 根据查询参数搜索活动
   * @param queryParams 活动搜索参数
   * @returns 推荐的活动和响应文本
   */
  async getActivityRecommendations(
    queryParams: ActivityQueryParams,
  ): Promise<RecommendationResponse> {
    try {
      // 尝试从外部API获取活动数据
      const { activities, isExactMatch } =
        await this.fetchActivitiesFromApi(queryParams);

      // 限制活动数量最多为5个
      const limitedActivities = activities.slice(0, 5);

      // 构建响应文本
      let responseText: string;
      if (isExactMatch) {
        responseText = `根据您的需求"${queryParams.keywords.join('、')}"${
          queryParams.title ? `，活动名称：${queryParams.title}` : ''
        }${queryParams.startTime ? `，从${queryParams.startTime}开始` : ''}${
          queryParams.endTime ? `，至${queryParams.endTime}结束` : ''
        }，为您找到${activities.length > 5 ? `${activities.length}个匹配活动，以下是其中的5个` : '以下匹配活动'}：`;
      } else {
        responseText = `很抱歉，没有找到与您需求"${queryParams.keywords.join('、')}"完全匹配的活动，以下是一些您可能感兴趣的推荐活动：`;
      }

      return {
        text: responseText,
        items: limitedActivities,
        type: IntentType.ACTIVITY,
        isExactMatch,
      };
    } catch (error) {
      console.error('获取活动推荐失败:', error);
      // 发生错误时返回本地数据，限制为3个
      const randomActivities = this.getRandomItems(this.activities, 3);
      return {
        text: `很抱歉，搜索服务暂时不可用，以下是一些近期热门活动推荐：`,
        items: randomActivities,
        type: IntentType.ACTIVITY,
        isExactMatch: false,
      };
    }
  }

  async getJourneyRecommendations(): Promise<RecommendationResponse> {
    try {
      const { journey, isExactMatch } = await this.fetchJourneyFromApi();
      return {
        text: `根据您的需求，为您找到${journey.length > 5 ? `${journey.length}个匹配行程，以下是其中的5个` : '以下匹配行程'}：`,
        items: journey,
        type: IntentType.JOURNEY,
        isExactMatch,
      };
    } catch (error) {
      console.error('获取行程推荐失败:', error);
      return {
        text: `很抱歉，搜索服务暂时不可用`,
        items: [],
        type: IntentType.JOURNEY,
        isExactMatch: false,
      };
    }
  }

  async getCouponRecommendations(): Promise<RecommendationResponse> {
    try {
      const { coupons, isExactMatch } = await this.fetchCouponsFromApi();
      return {
        text: `根据您的需求，为您找到${coupons.length > 5 ? `${coupons.length}个匹配优惠券，以下是其中的5个` : '以下匹配优惠券'}：`,
        items: coupons,
        type: IntentType.COUPON,
        isExactMatch,
      };
    } catch (error) {
      console.error('获取优惠券推荐失败:', error);
      return {
        text: `很抱歉，搜索服务暂时不可用`,
        items: [],
        type: IntentType.COUPON,
        isExactMatch: false,
      };
    }
  }

  /**
   * 从外部API获取商品数据
   * @param queryParams 商品查询参数
   * @returns 商品列表和是否精确匹配
   */
  private async fetchProductsFromApi(
    queryParams: ProductQueryParams,
  ): Promise<{ products: Product[]; isExactMatch: boolean }> {
    try {
      // 构建查询参数
      const params: Record<string, string | number> = {
        q: queryParams.keywords.join(' '),
      };

      // 添加可选参数
      if (queryParams.categoryName)
        params.categoryName = queryParams.categoryName;
      if (queryParams.minPrice) params.minPrice = queryParams.minPrice;
      if (queryParams.maxPrice) params.maxPrice = queryParams.maxPrice;
      if (queryParams.goodsName) params.goodsName = queryParams.goodsName;

      // 检查API基础URL是否配置
      if (!this.apiBaseUrl) {
        throw new Error('未配置API基础URL，请检查环境变量SERVER_API_BASE_URL');
      }

      console.log('调用商品API:', `${this.apiBaseUrl}/api/goods/listNoPage`);
      console.log('使用参数:', params);

      // 调用外部API获取数据
      const response = await axios.get<ProductResponse>(
        `${this.apiBaseUrl}/api/goods/listByNameAndPrice`,
        {
          params,
          headers: {
            token: `${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5秒超时
        },
      );

      if (response.status === 200) {
        const { data } = response.data;
        const { goods, flag } = data;

        // 验证商品数据
        if (Array.isArray(goods) && goods.length > 0) {
          return {
            products: goods.slice(0, 5), // 确保最多返回5个商品
            isExactMatch: flag, // flag为true表示精确匹配，false表示系统推荐
          };
        }
      }

      throw new Error('API返回数据格式错误');
    } catch (error) {
      console.error('从API获取商品失败:', error);

      // 检查是否是API相关错误
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        if (axiosError.response) {
          console.error('API响应状态码:', axiosError.response.status);
          console.error('API响应数据:', axiosError.response.data);
        } else if (axiosError.request) {
          console.error('未收到API响应:', axiosError.request);
        } else {
          console.error('请求配置错误:', axiosError.message);
        }
      }

      // 在测试环境或API不可用时，使用模拟数据
      if (
        process.env.NODE_ENV === 'development' ||
        process.env.USE_MOCK_DATA === 'true'
      ) {
        console.log('使用模拟商品数据');

        // 尝试根据关键词过滤本地数据
        const filteredProducts = this.products.filter((product) => {
          // 关键词匹配
          const keywordMatch = queryParams.keywords.some((keyword) =>
            product.name.includes(keyword),
          );

          // 分类匹配（模拟数据中可能不存在categoryName字段）
          const categoryMatch = !queryParams.categoryName;

          // 价格范围匹配
          const minPriceMatch =
            !queryParams.minPrice ||
            product.retailPrice >= queryParams.minPrice;
          const maxPriceMatch =
            !queryParams.maxPrice ||
            product.retailPrice <= queryParams.maxPrice;

          return (
            keywordMatch && categoryMatch && minPriceMatch && maxPriceMatch
          );
        });

        // 返回过滤后的结果，最多5个，如果没有匹配项则返回随机3个
        const hasMatches = filteredProducts.length > 0;
        return {
          products: hasMatches
            ? filteredProducts.slice(0, 5)
            : this.getRandomItems(this.products, 3),
          isExactMatch: hasMatches,
        };
      }

      // 如果不使用模拟数据，则抛出一个新的错误
      throw new Error(
        '无法获取商品数据：' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * 从外部API获取活动数据
   * @param queryParams 活动查询参数
   * @returns 活动列表和是否精确匹配
   */
  private async fetchActivitiesFromApi(
    queryParams: ActivityQueryParams,
  ): Promise<{ activities: Activity[]; isExactMatch: boolean }> {
    try {
      // 构建查询参数
      const params: Record<string, string | number> = {
        q: queryParams.keywords.join(' '),
      };

      // 添加可选参数
      if (queryParams.title) params.title = queryParams.title;
      if (queryParams.startTime) params.startTime = queryParams.startTime;
      if (queryParams.endTime) params.endTime = queryParams.endTime;

      // 检查API基础URL是否配置
      if (!this.apiBaseUrl) {
        throw new Error('未配置API基础URL，请检查环境变量SERVER_API_BASE_URL');
      }

      console.log('调用活动API:', `${this.apiBaseUrl}/api/activity/listNoPage`);
      console.log('使用参数:', params);

      // 调用外部API获取数据
      const response = await axios.get<ActivityResponse>(
        `${this.apiBaseUrl}/api/activity/listNoPage`,
        {
          params,
          headers: {
            token: `${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5秒超时
        },
      );

      if (response.status === 200 && response.data) {
        const { data } = response.data;
        console.log('活动数据:', data);

        const { activities, flag } = data;

        // 验证活动数据
        if (Array.isArray(activities) && activities.length > 0) {
          return {
            activities: activities.slice(0, 5), // 确保最多返回5个活动
            isExactMatch: flag, // flag为true表示精确匹配，false表示系统推荐
          };
        }
      }

      throw new Error('API返回数据格式错误');
    } catch (error) {
      console.error('从API获取活动失败:', error);

      // 检查是否是API相关错误
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        if (axiosError.response) {
          console.error('API响应状态码:', axiosError.response.status);
          console.error('API响应数据:', axiosError.response.data);
        } else if (axiosError.request) {
          console.error('未收到API响应:', axiosError.request);
        } else {
          console.error('请求配置错误:', axiosError.message);
        }
      }

      // 在测试环境或API不可用时，使用模拟数据
      if (
        process.env.NODE_ENV === 'development' ||
        process.env.USE_MOCK_DATA === 'true'
      ) {
        console.log('使用模拟活动数据');

        // 尝试根据关键词过滤本地数据
        const filteredActivities = this.activities.filter((activity) => {
          // 关键词匹配
          const keywordMatch = queryParams.keywords.some((keyword) =>
            activity.title.includes(keyword),
          );

          // 名称匹配
          const titleMatch =
            !queryParams.title || activity.title === queryParams.title;

          // 日期范围匹配
          const startTimeMatch =
            !queryParams.startTime ||
            activity.startTime >= queryParams.startTime;
          const endTimeMatch =
            !queryParams.endTime || activity.endTime <= queryParams.endTime;

          return keywordMatch && titleMatch && startTimeMatch && endTimeMatch;
        });

        // 返回过滤后的结果，最多5个，如果没有匹配项则返回随机3个
        const hasMatches = filteredActivities.length > 0;
        return {
          activities: hasMatches
            ? filteredActivities.slice(0, 5)
            : this.getRandomItems(this.activities, 3),
          isExactMatch: hasMatches,
        };
      }

      // 如果不使用模拟数据，则抛出一个新的错误
      throw new Error(
        '无法获取活动数据：' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  private async fetchJourneyFromApi(): Promise<{
    journey: Journey[];
    isExactMatch: boolean;
  }> {
    try {
      // 检查API基础URL是否配置
      if (!this.apiBaseUrl) {
        throw new Error('未配置API基础URL，请检查环境变量SERVER_API_BASE_URL');
      }

      console.log('调用行程API:', `${this.apiBaseUrl}/api/route/list`);

      // 调用外部API获取数据
      const response = await axios.get<JourneyResponse>(
        `${this.apiBaseUrl}/api/route/list`,
        {
          headers: {
            token: `${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5秒超时
        },
      );

      if (response.status === 200 && response.data) {
        const { data } = response.data;
        console.log('行程数据:', data);

        // 验证活动数据
        if (Array.isArray(data) && data.length > 0) {
          return {
            journey: data.slice(0, 5), // 确保最多返回5个活动
            isExactMatch: true, // flag为true表示精确匹配，false表示系统推荐
          };
        }
      }

      throw new Error('API返回数据格式错误');
    } catch (error) {
      console.error('从API获取行程失败:', error);

      // 检查是否是API相关错误
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        if (axiosError.response) {
          console.error('API响应状态码:', axiosError.response.status);
          console.error('API响应数据:', axiosError.response.data);
        } else if (axiosError.request) {
          console.error('未收到API响应:', axiosError.request);
        } else {
          console.error('请求配置错误:', axiosError.message);
        }
      }

      // 在测试环境或API不可用时，使用模拟数据
      if (
        process.env.NODE_ENV === 'development' ||
        process.env.USE_MOCK_DATA === 'true'
      ) {
        console.log('使用模拟活动数据');

        return {
          journey: [],
          isExactMatch: false,
        };
      }

      // 如果不使用模拟数据，则抛出一个新的错误
      throw new Error(
        '无法获取活动数据：' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  private async fetchCouponsFromApi(): Promise<{
    coupons: Coupon[];
    isExactMatch: boolean;
  }> {
    try {
      // 检查API基础URL是否配置
      if (!this.apiBaseUrl) {
        throw new Error('未配置API基础URL，请检查环境变量SERVER_API_BASE_URL');
      }

      console.log(
        '调用行程API:',
        `${this.apiBaseUrl}/api/coupon/activity/queryList`,
      );

      // 调用外部API获取数据
      const response = await axios.get<CouponResponse>(
        `${this.apiBaseUrl}/api/coupon/activity/queryList`,
        {
          headers: {
            token: `${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5秒超时
        },
      );

      if (response.status === 200 && response.data) {
        const { data } = response.data;
        console.log('优惠券数据:', data);
        const { coupons, flag } = data;

        // 验证活动数据
        if (Array.isArray(coupons) && coupons.length > 0) {
          return {
            coupons: coupons.slice(0, 5), // 确保最多返回5个活动
            isExactMatch: flag, // flag为true表示精确匹配，false表示系统推荐
          };
        }
      }

      throw new Error('API返回数据格式错误');
    } catch (error) {
      console.error('从API获取优惠券失败:', error);

      // 检查是否是API相关错误
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        if (axiosError.response) {
          console.error('API响应状态码:', axiosError.response.status);
          console.error('API响应数据:', axiosError.response.data);
        } else if (axiosError.request) {
          console.error('未收到API响应:', axiosError.request);
        } else {
          console.error('请求配置错误:', axiosError.message);
        }
      }

      // 在测试环境或API不可用时，使用模拟数据
      if (
        process.env.NODE_ENV === 'development' ||
        process.env.USE_MOCK_DATA === 'true'
      ) {
        console.log('使用模拟优惠券数据');

        return {
          coupons: [],
          isExactMatch: false,
        };
      }

      // 如果不使用模拟数据，则抛出一个新的错误
      throw new Error(
        '无法获取活动数据：' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * 从数组中随机获取指定数量的元素
   * @param items 数据数组
   * @param count 需要获取的元素数量
   * @returns 随机选取的元素数组
   */
  private getRandomItems<T>(items: T[], count: number): T[] {
    if (items.length <= count) {
      return [...items];
    }

    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
