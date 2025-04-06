"use client";

import {
  ChatMessage,
  IntentType,
  EnhancedRecommendationResponse,
  Product,
  Activity,
  ApiDataResponse,
} from "@/types/chat";
import { useEffect, useRef } from "react";
import ProductCard from "./ProductCard";
import ActivityCard from "./ActivityCard";
import ProductCarousel from "./ProductCarousel";
import ActivityCarousel from "./ActivityCarousel";
import MarkdownRenderer from "./MarkdownRenderer";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onProductClick?: (product: Product) => void;
  onActivityClick?: (activity: Activity) => void;
}

export default function MessageList({
  messages,
  isLoading,
  onProductClick,
  onActivityClick,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 检查推荐是否是增强型推荐
  const isEnhancedRecommendation = (
    recommendation: any
  ): recommendation is EnhancedRecommendationResponse => {
    return recommendation && "queryContext" in recommendation;
  };

  // 处理商品点击
  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  // 处理活动点击
  const handleActivityClick = (activity: Activity) => {
    if (onActivityClick) {
      onActivityClick(activity);
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`${
              message.isUser
                ? "bg-blue-500 text-white max-w-[80%]"
                : "bg-white text-gray-800 border border-gray-200 w-full"
            } rounded-lg p-3`}
          >
            {message.isUser ? (
              <p className="text-sm">{message.text}</p>
            ) : (
              <div className={message.streaming ? "ai-message-streaming" : ""}>
                <MarkdownRenderer
                  content={message._renderText || message.text}
                  className={message.isUser ? "text-white" : "text-gray-800"}
                />
                {message.streaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse rounded-sm" />
                )}
              </div>
            )}

            {/* 推荐内容展示 - 旧实现，使用网格布局 */}
            {message.recommendation && !message.apiData && (
              <div className="mt-2">
                {message.recommendation.type === IntentType.PRODUCT ? (
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(message.recommendation.items as any[])
                        .slice(0, 5)
                        .map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            recommendReason={product.recommendReason}
                            onClick={handleProductClick}
                          />
                        ))}
                    </div>
                    {message.recommendation.items.length > 5 && (
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        仅显示前5个商品，共{message.recommendation.items.length}
                        个匹配结果
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(message.recommendation.items as any[])
                        .slice(0, 5)
                        .map((activity) => (
                          <ActivityCard
                            key={activity.id}
                            activity={activity}
                            recommendReason={activity.recommendReason}
                            onClick={handleActivityClick}
                          />
                        ))}
                    </div>
                    {message.recommendation.items.length > 5 && (
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        仅显示前5个活动，共{message.recommendation.items.length}
                        个匹配结果
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  {message.recommendation.isExactMatch ? (
                    <span className="text-green-600">✓ 精确匹配结果</span>
                  ) : (
                    <span>系统推荐结果</span>
                  )}
                  {isEnhancedRecommendation(message.recommendation) &&
                    message.recommendation.queryContext && (
                      <p className="mt-1">
                        基于您的需求: {message.recommendation.queryContext}
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* API数据展示 - 新实现，使用横向滑动 */}
            {message.apiData && (
              <div className="mt-3">
                {message.apiData.type === "product" ? (
                  <ProductCarousel
                    products={message.apiData.items as Product[]}
                    onProductClick={handleProductClick}
                  />
                ) : (
                  <ActivityCarousel
                    activities={message.apiData.items as Activity[]}
                    onActivityClick={handleActivityClick}
                  />
                )}
                <div className="mt-2 text-xs text-gray-500 pl-4">
                  {message.apiData.isExactMatch ? (
                    <span className="text-green-600">✓ 精确匹配结果</span>
                  ) : (
                    <span>系统推荐结果</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && !messages.some((msg) => msg.streaming) && (
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
