import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApiDataResponse,
  ConversationEntry,
} from '../interfaces/chat.interface';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  /**
   * 保存用户或助手的消息到数据库
   * @param token 用户标识
   * @param role 角色(user或assistant)
   * @param content 消息内容
   * @param apiData API数据响应
   * @returns 保存的消息
   */
  async saveMessage(
    token: string,
    role: string,
    content: string,
    apiData?: ApiDataResponse,
  ) {
    // 如果存在API数据，序列化为JSON字符串
    const serializedApiData = apiData ? JSON.stringify(apiData.items) : null;
    const dataType = apiData ? apiData.type : null;

    return this.prisma.message.create({
      data: {
        token,
        role,
        content,
        apiData: serializedApiData,
        dataType,
      },
    });
  }

  /**
   * 获取特定用户的最近消息历史
   * @param token 用户标识
   * @param limit 获取的消息数量限制
   * @returns 消息列表
   */
  async getRecentMessages(token: string, limit = 10) {
    const messages = await this.prisma.message.findMany({
      where: {
        token,
      },
      orderBy: {
        createdTime: 'desc',
      },
      take: limit,
    });

    // 解析API数据
    return messages.map((msg) => ({
      ...msg,
      apiData: msg.apiData
        ? (JSON.parse(msg.apiData) as ApiDataResponse)
        : undefined,
    }));
  }

  /**
   * 获取用户对话历史，按消息对组织
   * @param token 用户标识
   * @param limit 获取的对话对数量限制
   * @returns 消息对列表，每对包含用户消息和助手回复
   */
  async getConversationHistory(
    token: string,
    limit = 5,
  ): Promise<ConversationEntry[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        token,
      },
      orderBy: {
        createdTime: 'desc',
      },
      take: limit * 2, // 获取足够的消息以组成对话对
    });

    // 按时间正序排列
    messages.reverse();

    // 构建对话历史上下文
    const history: ConversationEntry[] = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'user') {
        // 查找下一条消息是否是助手回复
        if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
          const assistantMsg = messages[i + 1];
          history.push({
            user: messages[i].content,
            assistant: assistantMsg.content,
            apiData: assistantMsg.apiData
              ? (JSON.parse(assistantMsg.apiData) as ApiDataResponse)
              : undefined,
            dataType: assistantMsg.dataType || undefined,
          });
          i++; // 跳过已处理的助手消息
        } else {
          // 没有对应的助手回复，只添加用户消息
          history.push({
            user: messages[i].content,
            assistant: null,
          });
        }
      }
    }

    return history;
  }
}
