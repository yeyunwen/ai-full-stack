import { Journey } from "@/types/chat";
import JourneyCard from "./JourneyCard";
import { useRef, useState, useEffect } from "react";

interface JourneyCarouselProps {
  journeys: Journey[];
  onJourneyClick?: (journey: Journey) => void;
}

/**
 * 行程横向滑动展示组件
 */
const JourneyCarousel: React.FC<JourneyCarouselProps> = ({
  journeys,
  onJourneyClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // 限制显示的行程数量不超过5个
  const limitedJourneys = journeys.slice(0, 5);

  // 检查滚动状态以确定是否显示左右箭头
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10); // 10px 容差
  };

  // 初始化和滚动时检查箭头状态
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener("scroll", checkScrollPosition);
      // 添加一个重新检查的定时器，处理图片懒加载等可能导致的宽度变化
      const timer = setTimeout(checkScrollPosition, 1000);

      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        clearTimeout(timer);
      };
    }
  }, [limitedJourneys]);

  // 滚动操作
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // 滚动80%的可视区域

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full mt-4 mb-2">
      {/* 左箭头 */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
          aria-label="向左滚动"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* 右箭头 */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
          aria-label="向右滚动"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {/* 横向滚动容器 */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide py-2 px-4 -mx-4 snap-x gap-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {limitedJourneys.map((journey) => (
          <div
            key={journey.id}
            className="min-w-[240px] max-w-[240px] snap-start"
          >
            <JourneyCard
              journey={journey}
              recommendReason={
                journey.hasOwnProperty("recommendReason")
                  ? (journey as any).recommendReason
                  : undefined
              }
              onClick={onJourneyClick}
            />
          </div>
        ))}
      </div>

      {/* 如果行程数量超过5个，显示提示信息 */}
      {journeys.length > 5 && (
        <div className="text-xs text-gray-500 mt-1 text-right pr-4">
          仅显示前5个行程，共{journeys.length}个匹配结果
        </div>
      )}
    </div>
  );
};

export default JourneyCarousel;
