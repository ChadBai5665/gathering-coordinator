/**
 * 提名服务（v2）
 * - travel_infos 计算
 * - nomination score 计算（用于投票平票 tie-break）
 */

import type { Participant, Location, TravelInfo } from '@ontheway/shared';
import { calculateDistance } from '@ontheway/shared';
import { routePlan } from './amap.service.js';

export function isValidLocation(location: Location | null | undefined): location is Location {
  return !!location && Number.isFinite(location.lng) && Number.isFinite(location.lat);
}

export async function calculateTravelInfos(
  participants: Participant[],
  destination: Location,
): Promise<TravelInfo[]> {
  const infos: TravelInfo[] = [];

  for (const p of participants) {
    if (!isValidLocation(p.location)) continue;

    const straightDist = calculateDistance(p.location, destination);
    let distance = straightDist;
    let duration = Math.round(straightDist / 8); // 粗估，30km/h

    try {
      const result = await routePlan(
        `${p.location.lng},${p.location.lat}`,
        `${destination.lng},${destination.lat}`,
        'transit',
      );
      distance = result.distance;
      duration = result.duration;
    } catch {
      // 保留粗估
    }

    infos.push({
      participant_id: p.id,
      nickname: p.nickname,
      distance,
      duration,
    });
  }

  return infos;
}

function scoreBalance(distances: number[]): number {
  if (distances.length <= 1) return 1;
  const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
  const variance =
    distances.reduce((sum, d) => sum + (d - mean) ** 2, 0) / distances.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 1 - stdDev / 5000);
}

export function computeNominationScore(input: {
  travel_infos: TravelInfo[];
  rating: number | null;
  cost: number | null;
}): number {
  const distances = input.travel_infos.map((t) => t.distance).filter((d) => Number.isFinite(d));
  const maxDist = distances.length > 0 ? Math.max(...distances) : 10_000;

  // 最大距离（越小越好）
  const maxDistScore = Math.max(0, 1 - maxDist / 10_000) * 40;
  // 均衡度
  const balanceScore = scoreBalance(distances) * 20;
  // 评分
  const ratingScore = ((input.rating ?? 3) / 5) * 25;
  // 人均消费：30-100 得满分
  let costFactor = 0.6;
  if (typeof input.cost === 'number') {
    if (input.cost >= 30 && input.cost <= 100) costFactor = 1;
    else if (input.cost < 30) costFactor = 0.8;
    else costFactor = Math.max(0.2, 1 - (input.cost - 100) / 200);
  }
  const costScore = costFactor * 15;

  return Math.max(0, Math.min(100, Math.round(maxDistScore + balanceScore + ratingScore + costScore)));
}

