"use client";

import { ChatMessage, IntentType } from "@/types/chat";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.isUser
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-800 border border-gray-200"
            }`}
          >
            <p className="text-sm">{message.text}</p>
            {message.recommendation && (
              <div className="mt-2">
                {message.recommendation.type === IntentType.PRODUCT ? (
                  <div className="space-y-2">
                    {(message.recommendation.items as any[]).map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-50 p-2 rounded-md text-sm"
                      >
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-gray-600">{product.description}</p>
                        <p className="text-blue-600 mt-1">
                          ¥{product.price.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(message.recommendation.items as any[]).map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-gray-50 p-2 rounded-md text-sm"
                      >
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-gray-600">{activity.description}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(activity.startDate).toLocaleDateString()} -{" "}
                          {new Date(activity.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
