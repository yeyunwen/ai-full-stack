import React from "react";
import { Journey } from "@/types/chat";

interface JourneyCardProps {
  journey: Journey;
  recommendReason?: string;
  onClick?: (journey: Journey) => void;
}

/**
 * 行程卡片组件
 * 用于统一展示行程信息
 */
const JourneyCard: React.FC<JourneyCardProps> = ({
  journey,
  recommendReason,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(journey);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
      onClick={handleClick}
    >
      {/* 行程图片 */}
      <div className="relative w-full h-40 overflow-hidden">
        <img
          src={journey.image || "/images/journey-placeholder.jpg"}
          alt={journey.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />

        {/* 地点标签 */}
        <div className="absolute bottom-0 left-0 m-2 px-2 py-1 text-xs bg-black/50 text-white rounded-md flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          {journey.location}
        </div>
      </div>

      {/* 行程信息 */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 h-10">
          {journey.name}
        </h3>

        <div className="mt-2 text-xs text-gray-500 line-clamp-2">
          {journey.introduce}
        </div>

        {recommendReason && (
          <p className="mt-2 text-xs text-green-600 italic line-clamp-2">
            推荐理由: {recommendReason}
          </p>
        )}
      </div>
    </div>
  );
};

export default JourneyCard;
