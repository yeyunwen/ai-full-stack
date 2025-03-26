"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { ChatMessage } from "@/types/chat";
import { getSocket, closeSocket } from "@/utils/socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { v4 as uuidv4 } from "uuid";

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

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
          // 推荐内容回复
          addRecommendationMessage(response);
        }
        setIsLoading(false);
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

  // 发送消息
  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return;

    // 添加用户消息到列表
    addMessage(text, true);
    setIsLoading(true);
    setError(null);

    // 发送消息到服务器
    if (socketRef.current) {
      console.log("发送消息:", { message: text });
      socketRef.current.emit("chat", { message: text });
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
  const addRecommendationMessage = (recommendationData: any) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      text: recommendationData.text,
      isUser: false,
      timestamp: new Date(),
      recommendation: recommendationData,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="flex flex-col h-[70vh] bg-gray-50 rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} isLoading={isLoading} />
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
