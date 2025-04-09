// 意图类型
export enum IntentType {
  PRODUCT = "PRODUCT", // 商品推荐意图
  ACTIVITY = "ACTIVITY", // 活动推荐意图
  JOURNEY = "JOURNEY", // 行程推荐意图
  GENERAL = "GENERAL", // 普通问答意图
}

// 商品接口
export interface Product {
  id: number;
  name: string;
  picUrl: string;
  retailPrice: number;
  sales: number;
}

// 活动接口
export interface Activity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  cover?: string;
  location?: string;
  browseNum?: number;
  tags?: string;
}

// 商品API响应接口
export interface ProductResponse {
  goods: Product[];
  flag: boolean;
}

// 活动API响应接口
export interface ActivityResponse {
  activities: Activity[];
  flag: boolean;
}

// 增强型商品响应
export interface EnhancedProduct extends Product {
  recommendReason: string;
}

// 增强型活动响应
export interface EnhancedActivity extends Activity {
  recommendReason: string;
}

// 推荐响应
export interface RecommendationResponse {
  text: string;
  items: Product[] | Activity[] | Journey[];
  type: IntentType;
  isExactMatch?: boolean; // 是否是精确匹配的结果
}

// 增强型推荐响应
export interface EnhancedRecommendationResponse extends RecommendationResponse {
  queryContext: string;
  items: EnhancedProduct[] | EnhancedActivity[] | EnhancedJourney[];
}

// API数据响应接口
export interface ApiDataResponse {
  type: "product" | "activity" | "journey";
  items: Product[] | Activity[] | Journey[];
  isExactMatch?: boolean;
}

// 流式响应
export interface StreamResponse {
  event: "stream";
  data: string;
  done: boolean;
  apiData?: ApiDataResponse;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendation?: RecommendationResponse | EnhancedRecommendationResponse;
  apiData?: ApiDataResponse;
  streaming?: boolean;
  _renderText?: string; // 临时渲染文本，用于优化流式渲染
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

// 增强型行程响应
export interface EnhancedJourney extends Journey {
  recommendReason: string;
}
