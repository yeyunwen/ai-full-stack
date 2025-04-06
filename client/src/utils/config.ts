/**
 * 应用配置文件
 * 用于管理API端点、服务器连接等配置
 */

// 服务器API相关配置
export const SERVER_CONFIG = {
  // WebSocket连接地址
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",

  // 后端API基础URL
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",

  // API请求超时时间(ms)
  API_TIMEOUT: 30000,

  // WebSocket路径
  WS_PATH: "/socket.io",
};

// 外部服务API配置
export const EXTERNAL_API = {
  // 商品服务API
  PRODUCT_API: {
    BASE_URL: process.env.NEXT_PUBLIC_PRODUCT_API_URL,
    TOKEN: process.env.NEXT_PUBLIC_PRODUCT_API_TOKEN,
  },

  // 活动服务API
  ACTIVITY_API: {
    BASE_URL: process.env.NEXT_PUBLIC_ACTIVITY_API_URL,
    TOKEN: process.env.NEXT_PUBLIC_ACTIVITY_API_TOKEN,
  },
};

// 缓存配置
export const CACHE_CONFIG = {
  // 商品数据缓存时间(ms)
  PRODUCT_CACHE_TTL: 5 * 60 * 1000, // 5分钟

  // 活动数据缓存时间(ms)
  ACTIVITY_CACHE_TTL: 10 * 60 * 1000, // 10分钟
};

// 应用通用配置
export const APP_CONFIG = {
  // 每次加载的商品数量
  PRODUCTS_PER_PAGE: 10,

  // 每次加载的活动数量
  ACTIVITIES_PER_PAGE: 5,

  // 推荐商品最大数量
  MAX_RECOMMENDED_PRODUCTS: 5,

  // 推荐活动最大数量
  MAX_RECOMMENDED_ACTIVITIES: 3,
};
