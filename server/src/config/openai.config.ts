import { registerAs } from '@nestjs/config';

export default registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
  baseURL: process.env.OPENAI_BASE_URL,
}));
