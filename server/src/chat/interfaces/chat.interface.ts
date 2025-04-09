export interface ChatMessage {
  message: string;
}

export interface UserChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendation?: RecommendationResponse | EnhancedRecommendationResponse;
  streaming?: boolean;
}

export interface ChatResponse {
  event: 'chat' | 'error';
  data: string | RecommendationResponse | EnhancedRecommendationResponse;
}

export interface StreamResponse {
  event: 'stream';
  data: string;
  done: boolean;
  apiData?: ApiDataResponse;
}

export interface ChatError {
  message: string;
  code?: string;
}

// 意图类型
export enum IntentType {
  PRODUCT = 'PRODUCT', // 商品推荐意图
  ACTIVITY = 'ACTIVITY', // 活动推荐意图
  JOURNEY = 'JOURNEY', // 行程推荐
  COUPON = 'COUPON', // 优惠券推荐意图
  GENERAL = 'GENERAL', // 普通问答意图
}

// 意图分析结果
export interface IntentAnalysisResult {
  intent: IntentType;
  keywords: string[];
}

// 商品接口
export interface Product {
  id: number;
  name: string;
  picUrl: string;
  retailPrice: number;
  sales: number;
}

// 商品API响应接口
export interface ProductResponse {
  data: {
    goods: Product[];
    flag: boolean;
  };
}

// 活动接口
export interface Activity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  /** 封面 */
  cover?: string;
  /** 地点 */
  location?: string;
  /** 浏览量 */
  browseNum?: number;
  /** 标签 ,逗号分隔 */
  tags?: string;
}

// 活动API响应接口
export interface ActivityResponse {
  data: {
    activities: Activity[];
    flag: boolean;
  };
}

// 行程接口
export interface Journey {
  id: string;
  name: string;
  location: string;
  introduce: string;
  image: string;
}

// 行程API响应接口
export interface JourneyResponse {
  data: Journey[];
}

// 优惠券接口
export interface Coupon {
  id: number;
  name: string;
  discount: number;
  restrictionPrice: number;
  startTime: string;
  endTime: string;
}

// 优惠券API响应接口
export interface CouponResponse {
  data: {
    coupons: Coupon[];
    flag: boolean;
  };
}

// 推荐响应
export interface RecommendationResponse {
  text: string;
  items: Product[] | Activity[] | Journey[] | Coupon[];
  type: IntentType;
  isExactMatch?: boolean; // 是否是精确匹配的结果
}

// 通用查询参数
export interface RefinedQuery {
  keywords: string[];
  userIntent: string;
  preferences?: string[];
  constraints?: string[];
}

// 商品查询参数
export interface ProductQueryParams {
  // 基础搜索参数
  keywords: string[]; // 关键词列表
  categoryName?: string; // 商品分类
  goodsName?: string; // 商品名称
  // 价格范围
  minPrice?: number; // 最低价格
  maxPrice?: number; // 最高价格
}

// 活动查询参数
export interface ActivityQueryParams {
  // 基础搜索参数
  keywords: string[]; // 关键词列表
  title?: string; // 活动名称

  // 时间范围
  startTime?: string; // 开始日期（YYYY-MM-DD）
  endTime?: string; // 结束日期（YYYY-MM-DD）
}

// 增强型商品响应
export interface EnhancedProduct extends Product {
  recommendReason: string;
}

// 增强型活动响应
export interface EnhancedActivity extends Activity {
  recommendReason: string;
}

// 增强型推荐响应
export interface EnhancedRecommendationResponse {
  text: string;
  items: EnhancedProduct[] | EnhancedActivity[];
  type: IntentType;
  queryContext: string;
  isExactMatch?: boolean; // 是否是精确匹配的结果
}

// API数据响应接口
export interface ApiDataResponse {
  type: 'product' | 'activity' | 'journey' | 'coupon';
  items: Product[] | Activity[] | Journey[] | Coupon[];
  isExactMatch?: boolean;
}
