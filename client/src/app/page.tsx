"use client";

import { useEffect } from "react";
import ChatContainer from "@/components/ChatContainer";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">与AI团团对话</h2>
      <p className="mb-6 text-gray-600">
        您可以询问任何问题，包括商品推荐和近期活动信息。
      </p>
      <ChatContainer />
    </div>
  );
}
