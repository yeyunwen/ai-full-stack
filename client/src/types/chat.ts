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

// 推荐响应
export interface RecommendationResponse {
  text: string;
  items: Product[] | Activity[];
  type: IntentType;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendation?: RecommendationResponse;
}
