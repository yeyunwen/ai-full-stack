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
} from './interfaces/chat.interface';
import { ChatError } from './errors/chat.error';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
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

  @SubscribeMessage('chat')
  async handleChat(
    client: Socket,
    payload: ChatMessage,
  ): Promise<ChatResponse> {
    try {
      console.log('收到消息:', payload);
      const response = await this.chatService.processMessage(payload.message);
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
  async handleChatStream(client: Socket, payload: ChatMessage): Promise<void> {
    try {
      console.log('收到流式消息请求:', payload);

      // 使用回调函数处理流式响应
      await this.chatService.processMessageStream(
        payload.message,
        (chunk: string, done: boolean) => {
          // 构建流式响应
          const streamResponse: StreamResponse = {
            event: 'stream',
            data: chunk,
            done: done,
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
