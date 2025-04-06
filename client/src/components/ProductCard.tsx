import React from "react";
import { Product } from "@/types/chat";

interface ProductCardProps {
  product: Product;
  recommendReason?: string;
  onClick?: (product: Product) => void;
}

/**
 * 商品卡片组件
 * 用于统一展示商品信息
 */
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  recommendReason,
  onClick,
}) => {
  console.log("product", product);

  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
      onClick={handleClick}
    >
      {/* 商品图片 */}
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={product.picUrl || "/images/product-placeholder.jpg"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* 商品信息 */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 h-10">
          {product.name}
        </h3>

        <div className="mt-2 flex justify-between items-center">
          <span className="text-red-600 font-medium">
            ¥{product.retailPrice.toLocaleString()}
          </span>
          <span className="text-gray-500 text-xs">销量: {product.sales}</span>
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

export default ProductCard;
