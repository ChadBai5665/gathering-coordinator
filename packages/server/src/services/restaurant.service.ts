/**
 * 餐厅推荐服务
 * 基于参与者位置和口味偏好，通过高德 POI 搜索推荐餐厅
 * 评分维度：口味匹配(20) + 最大距离(30) + 均衡度(20) + 评分(20) + 人均(10)
 */

import type { Participant, Location, TravelInfo } from '@ontheway/shared';
import { calculateCenter, calculateDistance } from '@ontheway/shared';
import { searchPOI, routePlan, type POIResult } from './amap.service.js';
import { config } from '../config/index.js';

/** 推荐候选餐厅（含评分详情） */
export interface RestaurantCandidate {
  /** 高德 POI ID */
  amap_id: string;
  /** 餐厅名称 */
  name: string;
  /** 类型/菜系 */
  type: string;
  /** 地址 */
  address: string;
  /** 坐标 */
  location: Location;
  /** 评分 */
  rating: number | null;
  /** 人均消费 */
  cost: number | null;
  /** 综合得分（0-100） */
  score: number;
  /** 各参与者的行程信息 */
  travel_infos: TravelInfo[];
}

// ── 评分权重 ──
const WEIGHT = {
  TASTE: 20,       // 口味匹配
  MAX_DIST: 30,    // 最大距离（越小越好）
  BALANCE: 20,     // 距离均衡度（标准差越小越好）
  RATING: 20,      // 高德评分
  COST: 10,        // 人均消费适中
} as const;

/**
 * 合并所有参与者的口味偏好
 * 去重后返回关键词列表
 */
function mergeTastes(participants: Participant[]): string[] {
  const tasteSet = new Set<string>();
  for (const p of participants) {
    if (p.tastes && p.tastes.length > 0) {
      for (const t of p.tastes) {
        tasteSet.add(t);
      }
    }
  }
  // 如果没有任何口味偏好，返回常见菜系
  if (tasteSet.size === 0) {
    return ['美食', '餐厅'];
  }
  return Array.from(tasteSet);
}

/**
 * 计算口味匹配分（0-1）
 * POI 类型名称中包含的口味关键词越多，分数越高
 */
function scoreTasteMatch(poi: POIResult, tastes: string[]): number {
  if (tastes.length === 0) return 0.5; // 无偏好给中间分

  const poiType = (poi.type + poi.name).toLowerCase();
  let matchCount = 0;
  for (const taste of tastes) {
    if (poiType.includes(taste)) {
      matchCount++;
    }
  }
  return matchCount / tastes.length;
}

/**
 * 计算距离均衡度分（0-1）
 * 标准差越小越均衡，分数越高
 */
function scoreBalance(distances: number[]): number {
  if (distances.length <= 1) return 1;

  const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
  const variance =
    distances.reduce((sum, d) => sum + (d - mean) ** 2, 0) / distances.length;
  const stdDev = Math.sqrt(variance);

  // 标准差 0 → 1分，标准差 ≥ 5000m → 0分
  return Math.max(0, 1 - stdDev / 5000);
}

/**
 * 生成 Mock 餐厅数据（无高德 Key 时使用）
 */
function generateMockRestaurants(
  center: Location,
  participants: Participant[],
): RestaurantCandidate[] {
  const mockNames = [
    { name: '老北京涮肉', type: '火锅', rating: 4.5, cost: 88 },
    { name: '川味小馆', type: '川菜', rating: 4.3, cost: 55 },
    { name: '粤式茶餐厅', type: '粤菜', rating: 4.6, cost: 72 },
    { name: '日式拉面屋', type: '日料', rating: 4.4, cost: 45 },
    { name: '湘菜人家', type: '湘菜', rating: 4.2, cost: 60 },
  ];

  return mockNames.map((mock, index) => {
    // 在中心点附近随机偏移
    const offsetLng = (Math.random() - 0.5) * 0.02;
    const offsetLat = (Math.random() - 0.5) * 0.02;
    const loc: Location = {
      lng: Number((center.lng + offsetLng).toFixed(6)),
      lat: Number((center.lat + offsetLat).toFixed(6)),
    };

    // 为每个参与者生成模拟行程信息
    const travelInfos: TravelInfo[] = participants
      .filter((p) => p.location)
      .map((p) => {
        const dist = calculateDistance(p.location!, loc);
        return {
          participant_id: p.id,
          distance: dist,
          duration: Math.round(dist / 8), // 约 30km/h
        };
      });

    return {
      amap_id: `mock_${index}`,
      name: mock.name,
      type: mock.type,
      address: `模拟地址 ${index + 1}`,
      location: loc,
      rating: mock.rating,
      cost: mock.cost,
      score: 80 - index * 5, // 递减分数
      travel_infos: travelInfos,
    };
  });
}

/**
 * 推荐餐厅
 * @param participants - 聚会参与者列表（需含位置信息）
 * @returns 排序后的候选餐厅列表（最多 5 个）
 */
export async function recommend(
  participants: Participant[],
): Promise<RestaurantCandidate[]> {
  // 筛选有位置的参与者
  const withLocation = participants.filter((p) => p.location !== null);
  if (withLocation.length === 0) {
    return [];
  }

  // 计算中心点
  const locations = withLocation.map((p) => p.location!);
  const center = calculateCenter(locations);

  // 无 AMAP_KEY 时返回 Mock 数据
  if (!config.amapKey) {
    console.warn('[RestaurantService] 未配置 AMAP_KEY，返回模拟数据');
    return generateMockRestaurants(center, participants);
  }

  // 合并口味偏好
  const tastes = mergeTastes(participants);
  const keywords = tastes.join('|');

  // 搜索 POI
  const pois = await searchPOI(
    `${center.lng},${center.lat}`,
    keywords,
    3000,
  );

  if (pois.length === 0) {
    // 扩大搜索范围重试
    const widePois = await searchPOI(
      `${center.lng},${center.lat}`,
      '美食|餐厅',
      5000,
    );
    if (widePois.length === 0) {
      return generateMockRestaurants(center, participants);
    }
    return await scoreAndRank(widePois, withLocation, tastes);
  }

  return await scoreAndRank(pois, withLocation, tastes);
}

/**
 * 对 POI 列表评分排序，返回 Top 5
 */
async function scoreAndRank(
  pois: POIResult[],
  participants: Participant[],
  tastes: string[],
): Promise<RestaurantCandidate[]> {
  const candidates: RestaurantCandidate[] = [];

  for (const poi of pois) {
    // 计算每个参与者到该餐厅的距离
    const distances: number[] = [];
    const travelInfos: TravelInfo[] = [];

    for (const p of participants) {
      if (!p.location) continue;

      // 先用直线距离粗筛
      const straightDist = calculateDistance(p.location, poi.location);
      distances.push(straightDist);

      // 路径规划获取实际行程（对 Top 候选再做）
      travelInfos.push({
        participant_id: p.id,
        distance: straightDist,
        duration: Math.round(straightDist / 8), // 粗估，后续精算
      });
    }

    // ── 评分 ──
    // 1. 口味匹配 (0-20)
    const tasteScore = scoreTasteMatch(poi, tastes) * WEIGHT.TASTE;

    // 2. 最大距离 (0-30)：最远参与者距离越短越好
    const maxDist = Math.max(...distances, 1);
    const maxDistScore = Math.max(0, 1 - maxDist / 10000) * WEIGHT.MAX_DIST;

    // 3. 均衡度 (0-20)
    const balanceScore = scoreBalance(distances) * WEIGHT.BALANCE;

    // 4. 评分 (0-20)：高德评分 0-5 映射到 0-1
    const ratingScore = (poi.rating ? poi.rating / 5 : 0.6) * WEIGHT.RATING;

    // 5. 人均消费 (0-10)：30-100 元区间得满分
    let costScore = 0.5;
    if (poi.cost) {
      if (poi.cost >= 30 && poi.cost <= 100) costScore = 1;
      else if (poi.cost < 30) costScore = 0.7;
      else costScore = Math.max(0.2, 1 - (poi.cost - 100) / 200);
    }
    costScore *= WEIGHT.COST;

    const totalScore = Math.round(tasteScore + maxDistScore + balanceScore + ratingScore + costScore);

    candidates.push({
      amap_id: poi.id,
      name: poi.name,
      type: poi.type,
      address: poi.address,
      location: poi.location,
      rating: poi.rating,
      cost: poi.cost,
      score: totalScore,
      travel_infos: travelInfos,
    });
  }

  // 按分数降序排列，取 Top 5
  candidates.sort((a, b) => b.score - a.score);
  const top5 = candidates.slice(0, 5);

  // 对 Top 5 做精确路径规划
  for (const candidate of top5) {
    for (const info of candidate.travel_infos) {
      const participant = participants.find((p) => p.id === info.participant_id);
      if (!participant?.location) continue;

      try {
        const result = await routePlan(
          `${participant.location.lng},${participant.location.lat}`,
          `${candidate.location.lng},${candidate.location.lat}`,
          'transit',
        );
        info.distance = result.distance;
        info.duration = result.duration;
      } catch (err) {
        console.warn(`[RestaurantService] 路径规划失败: ${(err as Error).message}`);
        // 保留粗估值
      }
    }
  }

  return top5;
}
