export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  event: 'chat' | 'error';
  data: string | RecommendationResponse;
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
