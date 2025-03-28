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
}

export interface ChatError {
  message: string;
  code?: string;
}

// 意图类型
export enum IntentType {
  PRODUCT = 'PRODUCT', // 商品推荐意图
  ACTIVITY = 'ACTIVITY', // 活动推荐意图
  GENERAL = 'GENERAL', // 普通问答意图
}

// 意图分析结果
export interface IntentAnalysisResult {
  intent: IntentType;
  keywords: string[];
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

// 推荐响应
export interface RecommendationResponse {
  text: string;
  items: Product[] | Activity[];
  type: IntentType;
}

// 查询参数提炼结果
export interface RefinedQuery {
  keywords: string[];
  userIntent: string;
  preferences?: string[];
  constraints?: string[];
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
}
