import { Injectable } from '@nestjs/common';
import {
  Activity,
  IntentType,
  Product,
  RecommendationResponse,
} from '../interfaces/chat.interface';

@Injectable()
export class RecommendationService {
  // 模拟数据库中的商品数据
  private products: Product[] = [
    {
      id: 'p1',
      name: '智能手机',
      description: '高性能5G智能手机，搭载最新处理器',
      price: 4999,
      imageUrl: 'https://example.com/smartphone.jpg',
    },
    {
      id: 'p2',
      name: '笔记本电脑',
      description: '轻薄高性能笔记本，适合办公和轻度游戏',
      price: 6999,
      imageUrl: 'https://example.com/laptop.jpg',
    },
    {
      id: 'p3',
      name: '智能手表',
      description: '支持健康监测和运动记录的智能手表',
      price: 1599,
      imageUrl: 'https://example.com/smartwatch.jpg',
    },
    {
      id: 'p4',
      name: '无线耳机',
      description: '降噪无线蓝牙耳机，长续航',
      price: 899,
      imageUrl: 'https://example.com/headphones.jpg',
    },
    {
      id: 'p5',
      name: '平板电脑',
      description: '大屏高清平板，支持手写笔',
      price: 3699,
      imageUrl: 'https://example.com/tablet.jpg',
    },
  ];

  // 模拟数据库中的活动数据
  private activities: Activity[] = [
    {
      id: 'a1',
      title: '双11全球购物节',
      description: '全场商品低至5折，满1000减100',
      startDate: '2023-11-01',
      endDate: '2023-11-12',
      imageUrl: 'https://example.com/double11.jpg',
    },
    {
      id: 'a2',
      title: '新品发布会',
      description: '最新科技产品发布，现场有抽奖活动',
      startDate: '2023-10-15',
      endDate: '2023-10-15',
      imageUrl: 'https://example.com/newproduct.jpg',
    },
    {
      id: 'a3',
      title: '教师节特惠',
      description: '教育行业用户专享优惠，满500减50',
      startDate: '2023-09-08',
      endDate: '2023-09-10',
      imageUrl: 'https://example.com/teachersday.jpg',
    },
    {
      id: 'a4',
      title: '夏季清凉特卖',
      description: '夏季商品大促，买二送一',
      startDate: '2023-07-01',
      endDate: '2023-08-15',
      imageUrl: 'https://example.com/summer.jpg',
    },
    {
      id: 'a5',
      title: '会员专享日',
      description: '会员用户专享折扣，最高享8折优惠',
      startDate: '2023-06-18',
      endDate: '2023-06-20',
      imageUrl: 'https://example.com/member.jpg',
    },
  ];

  /**
   * 根据关键词搜索商品
   * @param keywords 搜索关键词数组
   * @returns 推荐的商品和响应文本
   */
  getProductRecommendations(keywords: string[]): RecommendationResponse {
    // 如果没有关键词，返回随机商品
    if (!keywords.length) {
      const randomProducts = this.getRandomItems(this.products, 3);
      return {
        text: '以下是我们为您推荐的一些热门商品，希望您会喜欢：',
        items: randomProducts,
        type: IntentType.PRODUCT,
      };
    }

    // 根据关键词搜索匹配的商品
    const matchedProducts = this.products.filter((product) => {
      return keywords.some(
        (keyword) =>
          product.name.includes(keyword) ||
          product.description.includes(keyword),
      );
    });

    // 如果有匹配的商品，返回匹配结果，否则返回随机商品
    if (matchedProducts.length > 0) {
      return {
        text: `根据您的需求"${keywords.join('、')}"，为您推荐以下商品：`,
        items: matchedProducts,
        type: IntentType.PRODUCT,
      };
    } else {
      const randomProducts = this.getRandomItems(this.products, 3);
      return {
        text: `很抱歉，没有找到与"${keywords.join('、')}"完全匹配的商品，以下是一些您可能感兴趣的商品：`,
        items: randomProducts,
        type: IntentType.PRODUCT,
      };
    }
  }

  /**
   * 根据关键词搜索活动
   * @param keywords 搜索关键词数组
   * @returns 推荐的活动和响应文本
   */
  getActivityRecommendations(keywords: string[]): RecommendationResponse {
    // 如果没有关键词，返回随机活动
    if (!keywords.length) {
      const randomActivities = this.getRandomItems(this.activities, 3);
      return {
        text: '以下是我们近期的一些热门活动，希望您会感兴趣：',
        items: randomActivities,
        type: IntentType.ACTIVITY,
      };
    }

    // 根据关键词搜索匹配的活动
    const matchedActivities = this.activities.filter((activity) => {
      return keywords.some(
        (keyword) =>
          activity.title.includes(keyword) ||
          activity.description.includes(keyword),
      );
    });

    // 如果有匹配的活动，返回匹配结果，否则返回随机活动
    if (matchedActivities.length > 0) {
      return {
        text: `根据您的需求"${keywords.join('、')}"，为您推荐以下活动：`,
        items: matchedActivities,
        type: IntentType.ACTIVITY,
      };
    } else {
      const randomActivities = this.getRandomItems(this.activities, 3);
      return {
        text: `很抱歉，没有找到与"${keywords.join('、')}"完全匹配的活动，以下是一些您可能感兴趣的近期活动：`,
        items: randomActivities,
        type: IntentType.ACTIVITY,
      };
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
