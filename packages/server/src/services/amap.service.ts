/**
 * 高德地图 API 服务
 * POI 搜索、路径规划、逆地理编码
 * 内置节流机制（200ms 间隔），防止触发高德限流
 */

import { config } from '../config/index.js';
import type { Location } from '@ontheway/shared';

// ── 类型定义 ──

/** POI 搜索结果 */
export interface POIResult {
  /** 高德 POI ID */
  id: string;
  /** 名称 */
  name: string;
  /** 类型/菜系 */
  type: string;
  /** 地址 */
  address: string;
  /** 坐标 */
  location: Location;
  /** 评分 */
  rating: number | null;
  /** 人均消费（元） */
  cost: number | null;
  /** 距搜索中心的距离（米） */
  distance: number;
}

/** POI 分页搜索结果 */
export interface POIPageResult {
  /** 结果列表 */
  pois: POIResult[];
  /** 总数（高德返回的 count） */
  total: number;
}

/** 路径规划结果 */
export interface RouteResult {
  /** 距离（米） */
  distance: number;
  /** 时长（秒） */
  duration: number;
}

// ── 节流控制 ──

let lastCallTime = 0;
const THROTTLE_MS = 200;

/**
 * 节流等待，确保两次 API 调用间隔 ≥ 200ms
 */
async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < THROTTLE_MS) {
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS - elapsed));
  }
  lastCallTime = Date.now();
}

/**
 * 发起高德 API 请求
 */
async function amapFetch(url: string): Promise<Record<string, unknown>> {
  await throttle();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`高德 API 请求失败: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (data.status !== '1' && data.status !== 1) {
    throw new Error(`高德 API 返回错误: ${data.info || '未知错误'} (infocode: ${data.infocode})`);
  }

  return data;
}

/**
 * 解析高德坐标字符串 "lng,lat" 为 Location
 */
function parseLocation(str: string): Location {
  const [lng, lat] = str.split(',').map(Number);
  return { lng, lat };
}

// ── 公开 API ──

/**
 * POI 搜索（周边搜索）
 * @param location - 搜索中心坐标 "lng,lat"
 * @param keywords - 搜索关键词（如 "川菜|火锅"）
 * @param radius - 搜索半径（米），默认 3000
 * @returns POI 结果列表
 */
export async function searchPOI(
  location: string,
  keywords: string,
  radius: number = 3000,
): Promise<POIResult[]> {
  const { pois } = await searchPOIPage(location, keywords, radius, 1, 20);
  return pois;
}

/**
 * POI 搜索（分页）
 */
export async function searchPOIPage(
  location: string,
  keywords: string,
  radius: number = 3000,
  page: number = 1,
  pageSize: number = 20,
): Promise<POIPageResult> {
  if (!config.amapKey) {
    console.warn('[AmapService] 未配置 AMAP_KEY，返回空结果');
    return { pois: [], total: 0 };
  }

  const url = new URL('https://restapi.amap.com/v3/place/around');
  url.searchParams.set('key', config.amapKey);
  url.searchParams.set('location', location);
  url.searchParams.set('keywords', keywords);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('types', '050000'); // 餐饮服务大类
  url.searchParams.set('sortrule', 'weight'); // 综合排序
  url.searchParams.set('offset', String(pageSize));
  url.searchParams.set('page', String(page));
  url.searchParams.set('extensions', 'all');

  const data = await amapFetch(url.toString());
  const pois = (data.pois || []) as Array<Record<string, unknown>>;
  const total = parseInt(String((data as any).count || '0'), 10) || 0;

  return {
    pois: pois.map((poi) => {
      const loc = parseLocation(poi.location as string);
      const biz = (poi.biz_ext || {}) as Record<string, unknown>;

      return {
        id: poi.id as string,
        name: poi.name as string,
        type: (poi.typecode as string)?.startsWith('05')
          ? ((poi.type as string) || '餐饮')
          : ((poi.type as string) || '未知'),
        address: (poi.address as string) || '',
        location: loc,
        rating: biz.rating ? parseFloat(biz.rating as string) : null,
        cost: biz.cost ? parseFloat(biz.cost as string) : null,
        distance: parseInt(poi.distance as string, 10) || 0,
      };
    }),
    total,
  };
}

/**
 * 路径规划
 * @param origin - 起点坐标 "lng,lat"
 * @param destination - 终点坐标 "lng,lat"
 * @param mode - 出行方式: transit(公交) | driving(驾车) | walking(步行)
 * @returns 距离和时长
 */
export async function routePlan(
  origin: string,
  destination: string,
  mode: 'transit' | 'driving' | 'walking' = 'transit',
): Promise<RouteResult> {
  if (!config.amapKey) {
    console.warn('[AmapService] 未配置 AMAP_KEY，返回估算结果');
    // 粗略估算：直线距离 × 1.4 / 速度
    const [oLng, oLat] = origin.split(',').map(Number);
    const [dLng, dLat] = destination.split(',').map(Number);
    const R = 6371000;
    const dLatR = ((dLat - oLat) * Math.PI) / 180;
    const dLngR = ((dLng - oLng) * Math.PI) / 180;
    const a =
      Math.sin(dLatR / 2) ** 2 +
      Math.cos((oLat * Math.PI) / 180) *
        Math.cos((dLat * Math.PI) / 180) *
        Math.sin(dLngR / 2) ** 2;
    const straightDist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = Math.round(straightDist * 1.4);
    // 公交约 25km/h，驾车约 35km/h，步行约 5km/h
    const speeds: Record<string, number> = { transit: 25, driving: 35, walking: 5 };
    const speed = speeds[mode] || 25;
    const duration = Math.round(distance / (speed * 1000 / 3600));
    return { distance, duration };
  }

  // 公交路径规划
  if (mode === 'transit') {
    const url = new URL('https://restapi.amap.com/v3/direction/transit/integrated');
    url.searchParams.set('key', config.amapKey);
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('city', '北京'); // 默认城市，实际可从逆地理编码获取
    url.searchParams.set('strategy', '0'); // 最快捷

    const data = await amapFetch(url.toString());
    const route = data.route as Record<string, unknown>;
    const transits = (route?.transits || []) as Array<Record<string, unknown>>;

    if (transits.length === 0) {
      // 无公交方案，回退到步行
      return routePlan(origin, destination, 'walking');
    }

    const best = transits[0];
    return {
      distance: parseInt(best.distance as string, 10) || 0,
      duration: parseInt(best.duration as string, 10) || 0,
    };
  }

  // 驾车路径规划
  if (mode === 'driving') {
    const url = new URL('https://restapi.amap.com/v3/direction/driving');
    url.searchParams.set('key', config.amapKey);
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('strategy', '10'); // 最快

    const data = await amapFetch(url.toString());
    const route = data.route as Record<string, unknown>;
    const paths = (route?.paths || []) as Array<Record<string, unknown>>;
    const best = paths[0] || {};

    return {
      distance: parseInt(best.distance as string, 10) || 0,
      duration: parseInt(best.duration as string, 10) || 0,
    };
  }

  // 步行路径规划
  const url = new URL('https://restapi.amap.com/v3/direction/walking');
  url.searchParams.set('key', config.amapKey);
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);

  const data = await amapFetch(url.toString());
  const route = data.route as Record<string, unknown>;
  const paths = (route?.paths || []) as Array<Record<string, unknown>>;
  const best = paths[0] || {};

  return {
    distance: parseInt(best.distance as string, 10) || 0,
    duration: parseInt(best.duration as string, 10) || 0,
  };
}

/**
 * 逆地理编码（坐标 → 地址）
 * @param location - 坐标 "lng,lat"
 * @returns 格式化地址字符串
 */
export async function regeo(location: string): Promise<string> {
  if (!config.amapKey) {
    return '未知位置';
  }

  const url = new URL('https://restapi.amap.com/v3/geocode/regeo');
  url.searchParams.set('key', config.amapKey);
  url.searchParams.set('location', location);

  const data = await amapFetch(url.toString());
  const regeocode = data.regeocode as Record<string, unknown>;
  return (regeocode?.formatted_address as string) || '未知位置';
}
