// 意图类型
export enum IntentType {
  PRODUCT = "PRODUCT", // 商品推荐意图
  ACTIVITY = "ACTIVITY", // 活动推荐意图
  GENERAL = "GENERAL", // 普通问答意图
}

// 商品接口
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

// 活动接口
export interface Activity {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
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
  items: Product[] | Activity[];
  type: IntentType;
}

// 增强型推荐响应
export interface EnhancedRecommendationResponse extends RecommendationResponse {
  queryContext: string;
  items: EnhancedProduct[] | EnhancedActivity[];
}

// 流式响应
export interface StreamResponse {
  event: 'stream';
  data: string;
  done: boolean;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendation?: RecommendationResponse | EnhancedRecommendationResponse;
  streaming?: boolean;
}
