import React from "react";
import { Activity } from "@/types/chat";

interface ActivityCardProps {
  activity: Activity;
  recommendReason?: string;
  onClick?: (activity: Activity) => void;
}

/**
 * 活动卡片组件
 * 用于统一展示活动信息
 */
const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  recommendReason,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(activity);
    }
  };

  // 计算活动剩余天数
  const calculateRemainingDays = (): number => {
    const endDate = new Date(activity.endTime);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 获取标签列表
  const getTags = (): string[] => {
    return activity.tags
      ? activity.tags.split(",").map((tag) => tag.trim())
      : [];
  };

  const remainingDays = calculateRemainingDays();
  const isActive = remainingDays > 0;
  const tags = getTags();

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer
        ${isActive ? "border-green-100" : "border-gray-100"}`}
      onClick={handleClick}
    >
      {/* 活动图片 */}
      <div className="relative w-full h-40 overflow-hidden">
        <img
          src={activity.cover || "/images/activity-placeholder.jpg"}
          alt={activity.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {/* 活动状态标签 */}
        <div
          className={`absolute top-0 right-0 m-2 px-2 py-1 text-xs text-white rounded-full 
          ${isActive ? "bg-green-500" : "bg-gray-500"}`}
        >
          {isActive ? "进行中" : "已结束"}
        </div>
        {/* 浏览量标签 */}
        {activity.browseNum !== undefined && (
          <div className="absolute bottom-0 right-0 m-2 px-2 py-1 text-xs bg-black/50 text-white rounded-full flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            {activity.browseNum}
          </div>
        )}
      </div>

      {/* 活动信息 */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 h-10">
          {activity.title}
        </h3>

        <div className="mt-2 text-xs text-gray-500">
          {new Date(activity.startTime).toLocaleDateString()} -{" "}
          {new Date(activity.endTime).toLocaleDateString()}
        </div>

        {activity.location && (
          <div className="mt-1 text-xs text-gray-500 flex items-center">
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
            {activity.location}
          </div>
        )}

        {isActive && (
          <div className="mt-1 text-xs text-orange-500">
            还剩 {remainingDays} 天结束
          </div>
        )}

        {/* 标签列表 */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {recommendReason && (
          <p className="mt-2 text-xs text-green-600 italic line-clamp-2">
            推荐理由: {recommendReason}
          </p>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
