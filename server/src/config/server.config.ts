import { registerAs } from '@nestjs/config';

/**
 * 服务器API配置
 * 定义了与外部API通信所需的配置
 */
export default registerAs('server', () => ({
  // 外部API基础URL
  apiBaseURL: process.env.SERVER_API_BASE_URL,

  // API授权令牌
  token: process.env.SERVER_TOKEN,

  // 请求超时时间(毫秒)
  timeout: parseInt(process.env.SERVER_TIMEOUT || '30000', 10),

  // 是否启用Mock数据
  useMockData: process.env.USE_MOCK_DATA === 'true',
}));
