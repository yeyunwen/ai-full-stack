"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import {
  ChatMessage,
  StreamResponse,
  RecommendationResponse,
  EnhancedRecommendationResponse,
  Product,
  Activity,
} from "@/types/chat";
import { getSocket, closeSocket } from "@/utils/socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { v4 as uuidv4 } from "uuid";

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  // 初始化Socket连接
  useEffect(() => {
    try {
      socketRef.current = getSocket();

      // 监听聊天消息
      socketRef.current.on("chat", (response) => {
        console.log("收到消息:", response);
        // 根据返回数据类型处理
        if (typeof response === "string") {
          // 普通文本回复
          addMessage(response, false);
        } else if (response && typeof response === "object") {
          // 检查是否是增强型推荐响应
          const isEnhanced =
            response.queryContext &&
            response.items &&
            response.items.some((item: any) => item.recommendReason);

          console.log("接收到的推荐类型:", isEnhanced ? "增强型" : "基本型");

          // 推荐内容回复
          addRecommendationMessage(response);
        }
        setIsLoading(false);
      });

      // 监听流式响应
      socketRef.current.on("stream", (response: StreamResponse) => {
        console.log("收到流式数据:", response);
        handleStreamResponse(response);
      });

      // 监听错误消息
      socketRef.current.on("error", (errorMsg) => {
        console.error("收到错误:", errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      });
    } catch (err) {
      console.error("初始化Socket失败:", err);
      setError("连接聊天服务失败，请刷新页面重试。");
    }

    // 组件卸载时关闭Socket连接
    return () => {
      closeSocket();
    };
  }, []);

  // 处理流式响应
  const handleStreamResponse = (response: StreamResponse) => {
    const { data, done, apiData } = response;

    // 保存当前的messageId，防止竞态条件
    const currentStreamingId = streamingMessageIdRef.current;

    // 尝试解析JSON数据（针对推荐内容）
    const tryParseRecommendation = (jsonString: string) => {
      try {
        if (
          jsonString &&
          jsonString.startsWith("{") &&
          jsonString.endsWith("}")
        ) {
          const jsonData = JSON.parse(jsonString);

          // 验证是否为推荐数据结构
          if (jsonData.text && jsonData.items && jsonData.type) {
            // 检查是否为增强型推荐
            const isEnhanced =
              jsonData.queryContext &&
              jsonData.items.some((item: any) => item.recommendReason);

            console.log("推荐类型:", isEnhanced ? "增强型" : "基本型");
            console.log("精确匹配:", jsonData.isExactMatch ? "是" : "否");
            return { isValid: true, data: jsonData };
          }
        }
        return { isValid: false };
      } catch (e) {
        console.log("JSON解析失败:", e);
        return { isValid: false };
      }
    };

    // 处理现有消息的更新
    if (currentStreamingId) {
      setMessages((prevMessages) => {
        // 在回调内部再次检查currentStreamingId，以防setState排队期间发生变化
        if (!currentStreamingId) return prevMessages;

        return prevMessages.map((msg) => {
          if (msg.id !== currentStreamingId) return msg;

          // 检查是否有API数据
          if (apiData) {
            console.log("接收到API数据:", apiData);
            return {
              ...msg,
              apiData,
              streaming: false,
            };
          }

          // 检查是否为JSON推荐数据
          const parseResult = tryParseRecommendation(data);
          if (parseResult.isValid) {
            return {
              ...msg,
              text: parseResult.data.text,
              recommendation: parseResult.data,
              streaming: false,
            };
          }

          // 普通文本处理
          let updatedText = msg.text + data;

          // 优化Markdown渲染，保持代码块完整性
          const lastCodeBlockStart = updatedText.lastIndexOf("```");
          if (lastCodeBlockStart !== -1) {
            const codeBlocksCount = (updatedText.match(/```/g) || []).length;
            // 如果是奇数个```，说明代码块没有关闭
            if (codeBlocksCount % 2 !== 0) {
              // 添加临时关闭标签用于渲染，但保持流式效果
              return {
                ...msg,
                text: updatedText,
                _renderText: updatedText + "\n```",
                streaming: !done,
              };
            }
          }

          return {
            ...msg,
            text: updatedText,
            _renderText: undefined, // 清除临时渲染文本
            streaming: !done,
          };
        });
      });
    }
    // 创建新消息
    else if (data || apiData) {
      const newMessageId = uuidv4();
      streamingMessageIdRef.current = newMessageId;

      // 如果有apiData但没有文本数据，这种情况不应该出现
      if (apiData && !data) {
        console.warn("收到apiData但没有对应的文本内容");
      }

      // 检查是否为JSON推荐数据
      const parseResult = data
        ? tryParseRecommendation(data)
        : { isValid: false };
      if (parseResult.isValid) {
        const newMessage: ChatMessage = {
          id: newMessageId,
          text: parseResult.data.text,
          isUser: false,
          timestamp: new Date(),
          recommendation: parseResult.data,
          streaming: false,
        };

        setMessages((prev) => [...prev, newMessage]);

        // 只有在完成时才重置引用
        if (done) {
          streamingMessageIdRef.current = null;
          setIsLoading(false);
        }
        return;
      }

      // 普通文本消息
      const newMessage: ChatMessage = {
        id: newMessageId,
        text: data || "",
        isUser: false,
        timestamp: new Date(),
        apiData: apiData, // 添加API数据
        streaming: !done,
      };

      setMessages((prev) => [...prev, newMessage]);
    }

    // 流结束处理 - 修改为在setState回调后执行
    if (done) {
      // 使用setTimeout确保所有setState操作都已完成再重置状态
      setTimeout(() => {
        streamingMessageIdRef.current = null;
        setIsLoading(false);
      }, 0);
    }
  };

  // 发送消息
  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return;

    // 添加用户消息到列表
    addMessage(text, true);
    setIsLoading(true);
    setError(null);

    // 发送消息到服务器 (使用流式API)
    if (socketRef.current) {
      console.log("发送流式消息:", { message: text });
      socketRef.current.emit("chat_stream", { message: text });
    } else {
      setError("聊天服务未连接，请刷新页面重试。");
      setIsLoading(false);
    }
  };

  // 添加普通消息
  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // 添加推荐内容消息
  const addRecommendationMessage = (
    recommendationData: RecommendationResponse | EnhancedRecommendationResponse
  ) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      text: recommendationData.text,
      isUser: false,
      timestamp: new Date(),
      recommendation: recommendationData,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // 处理商品点击事件
  const handleProductClick = (product: Product) => {
    console.log("商品点击:", product);
    // 跳转到商品详情页面，实际项目中应该使用路由导航
    window.open(`/product/${product.id}`, "_blank");
  };

  // 处理活动点击事件
  const handleActivityClick = (activity: Activity) => {
    console.log("活动点击:", activity);
    // 跳转到活动详情页面
    window.open(`/activity/${activity.id}`, "_blank");
  };

  return (
    <div className="flex flex-col h-[70vh] bg-gray-50 rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onProductClick={handleProductClick}
          onActivityClick={handleActivityClick}
        />
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded-md mt-2">
            错误: {error}
          </div>
        )}
      </div>
      <MessageInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
}
