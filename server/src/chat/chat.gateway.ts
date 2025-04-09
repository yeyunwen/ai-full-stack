import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import {
  ChatMessage,
  ChatResponse,
  StreamResponse,
  ApiDataResponse,
} from './interfaces/chat.interface';
import { ChatError } from './errors/chat.error';

// 扩展ChatMessage接口，添加token字段
interface ChatMessageWithToken extends ChatMessage {
  token?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*'],
  },
  namespace: '/chat',
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 生成或获取用户token
   * @param payload 消息载荷
   * @param client WebSocket客户端
   * @returns 用户token
   */
  private getUserToken(payload: ChatMessageWithToken, client: Socket): string {
    // 如果客户端提供了token，则使用客户端的token
    if (payload.token) {
      return payload.token;
    }

    // 否则使用客户端ID作为token
    return client.id;
  }

  @SubscribeMessage('chat')
  async handleChat(
    client: Socket,
    payload: ChatMessageWithToken,
  ): Promise<ChatResponse> {
    try {
      console.log('收到消息:', payload);

      // 获取用户token
      const token = this.getUserToken(payload, client);

      const response = await this.chatService.processMessage(
        payload.message,
        token,
      );
      console.log('处理结果:', response);

      // 根据返回类型构建响应
      if (typeof response === 'string') {
        return {
          event: 'chat',
          data: response,
        };
      } else {
        return {
          event: 'chat',
          data: response,
        };
      }
    } catch (error) {
      console.error('处理消息错误:', error);
      if (error instanceof ChatError) {
        return {
          event: 'error',
          data: error.message,
        };
      }
      return {
        event: 'error',
        data: '处理消息时发生错误',
      };
    }
  }

  @SubscribeMessage('chat_stream')
  async handleChatStream(
    client: Socket,
    payload: ChatMessageWithToken,
  ): Promise<void> {
    try {
      console.log('收到流式消息请求:', payload);

      // 获取用户token
      const token = this.getUserToken(payload, client);

      // 使用回调函数处理流式响应
      await this.chatService.processMessageStream(
        payload.message,
        token,
        (chunk: string, done: boolean, apiData?: ApiDataResponse) => {
          // 构建流式响应
          const streamResponse: StreamResponse = {
            event: 'stream',
            data: chunk,
            done: done,
            apiData: apiData,
          };

          // 向客户端发送流式响应
          client.emit('stream', streamResponse);
        },
      );

      console.log('流式消息处理完成');
    } catch (error) {
      console.error('处理流式消息错误:', error);
      const errorResponse = {
        event: 'error',
        data: error instanceof ChatError ? error.message : '处理消息时发生错误',
      };
      client.emit('error', errorResponse);
    }
  }
}
