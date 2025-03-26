"use client";

import { useState, KeyboardEvent } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function MessageInput({
  onSendMessage,
  isLoading,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex space-x-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          className="flex-1 resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  );
}
