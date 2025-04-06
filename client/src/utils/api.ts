import { SERVER_CONFIG, EXTERNAL_API } from "./config";
import {
  Product,
  Activity,
  ProductResponse,
  ActivityResponse,
} from "@/types/chat";

/**
 * API服务类
 * 用于处理商品和活动API的调用
 */
class ApiService {
  /**
   * 获取商品列表
   * @param keywords 搜索关键词
   * @param category 商品分类
   * @param minPrice 最低价格
   * @param maxPrice 最高价格
   * @param sortBy 排序字段
   * @param sortDirection 排序方向
   * @param limit 返回数量限制
   * @returns 商品响应对象
   */
  async getProducts(
    keywords?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    sortBy: string = "sales",
    sortDirection: "asc" | "desc" = "desc",
    limit: number = 10
  ): Promise<ProductResponse> {
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (keywords) params.append("keywords", keywords);
      if (category) params.append("category", category);
      if (minPrice) params.append("minPrice", minPrice.toString());
      if (maxPrice) params.append("maxPrice", maxPrice.toString());
      params.append("sortBy", sortBy);
      params.append("sortDirection", sortDirection);
      params.append("limit", limit.toString());

      // 构建API URL
      const url = `${
        EXTERNAL_API.PRODUCT_API.BASE_URL
      }/api/products?${params.toString()}`;

      // 发送请求
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${EXTERNAL_API.PRODUCT_API.TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API错误 (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return {
        goods: data.items || [],
        flag: data.isExactMatch || false,
      };
    } catch (error) {
      console.error("获取商品失败:", error);
      // 返回空结果
      return { goods: [], flag: false };
    }
  }

  /**
   * 获取活动列表
   * @param keywords 搜索关键词
   * @param category 活动分类
   * @param startDate 活动开始日期
   * @param endDate 活动结束日期
   * @param limit 返回数量限制
   * @returns 活动响应对象
   */
  async getActivities(
    keywords?: string,
    category?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 5
  ): Promise<ActivityResponse> {
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (keywords) params.append("keywords", keywords);
      if (category) params.append("category", category);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("limit", limit.toString());

      // 构建API URL
      const url = `${
        EXTERNAL_API.ACTIVITY_API.BASE_URL
      }/api/activities?${params.toString()}`;

      // 发送请求
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${EXTERNAL_API.ACTIVITY_API.TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API错误 (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return {
        activities: data.items || [],
        flag: data.isExactMatch || false,
      };
    } catch (error) {
      console.error("获取活动失败:", error);
      // 返回空结果
      return { activities: [], flag: false };
    }
  }

  /**
   * 获取商品详情
   * @param id 商品ID
   * @returns 商品对象，失败返回null
   */
  async getProductById(id: number): Promise<Product | null> {
    try {
      const url = `${EXTERNAL_API.PRODUCT_API.BASE_URL}/api/products/${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${EXTERNAL_API.PRODUCT_API.TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API错误 (${response.status}): ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`获取商品(ID: ${id})失败:`, error);
      return null;
    }
  }

  /**
   * 获取活动详情
   * @param id 活动ID
   * @returns 活动对象，失败返回null
   */
  async getActivityById(id: string): Promise<Activity | null> {
    try {
      const url = `${EXTERNAL_API.ACTIVITY_API.BASE_URL}/api/activities/${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${EXTERNAL_API.ACTIVITY_API.TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API错误 (${response.status}): ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`获取活动(ID: ${id})失败:`, error);
      return null;
    }
  }
}

// 导出单例实例
export const apiService = new ApiService();
