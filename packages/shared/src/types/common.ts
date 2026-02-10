/**
 * 通用类型定义
 * Location、ApiResponse、分页等基础类型
 */

/** 地理坐标 */
export interface Location {
  /** 经度 */
  lng: number;
  /** 纬度 */
  lat: number;
}

/** 带名称的地理位置 */
export interface NamedLocation extends Location {
  /** 位置名称（如地址、POI名） */
  name: string;
}

/** 统一 API 响应结构 - 成功 */
export interface ApiSuccessResponse<T = unknown> {
  /** 是否成功 */
  success: true;
  /** 响应数据 */
  data: T;
}

/** 统一 API 响应结构 - 失败 */
export interface ApiErrorResponse {
  /** 是否成功 */
  success: false;
  /** 错误码 */
  code: string;
  /** 错误信息 */
  message: string;
}

/** 统一 API 响应类型 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** 分页请求参数 */
export interface PaginationParams {
  /** 页码（从 1 开始） */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/** 分页响应数据 */
export interface PaginatedData<T> {
  /** 数据列表 */
  items: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/** 时间戳字段（ISO 8601 字符串） */
export interface Timestamps {
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/** 提取可选字段为 Partial */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
