/**
 * 地理计算工具
 * 中心点计算、距离计算等纯函数
 */

import type { Location } from '../types/common';

/** 北京默认坐标（天安门） */
const DEFAULT_CENTER: Location = {
  lng: 116.397428,
  lat: 39.90923,
};

/** 地球平均半径（米） */
const EARTH_RADIUS = 6371000;

/**
 * 角度转弧度
 * @param degrees - 角度值
 * @returns 弧度值
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 计算多个坐标点的地理中心点
 * 使用算术平均值（适用于小范围城市级别）
 * @param locations - 坐标点数组
 * @returns 中心点坐标，无数据时返回北京默认坐标
 */
export function calculateCenter(locations: Location[]): Location {
  if (locations.length === 0) {
    return { ...DEFAULT_CENTER };
  }

  const sum = locations.reduce(
    (acc, loc) => ({
      lng: acc.lng + loc.lng,
      lat: acc.lat + loc.lat,
    }),
    { lng: 0, lat: 0 },
  );

  return {
    lng: Number((sum.lng / locations.length).toFixed(6)),
    lat: Number((sum.lat / locations.length).toFixed(6)),
  };
}

/**
 * 计算两点之间的距离（Haversine 公式）
 * @param from - 起点坐标
 * @param to - 终点坐标
 * @returns 距离（米），保留整数
 */
export function calculateDistance(from: Location, to: Location): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS * c);
}

/**
 * 获取默认中心点（北京天安门）
 * @returns 默认中心点坐标副本
 */
export function getDefaultCenter(): Location {
  return { ...DEFAULT_CENTER };
}

/**
 * 判断坐标是否在中国大陆范围内（粗略判断）
 * 经度：73.5 ~ 135.1，纬度：3.8 ~ 53.6
 * @param location - 待判断的坐标
 * @returns 是否在中国大陆范围内
 */
export function isInChina(location: Location): boolean {
  return (
    location.lng >= 73.5 &&
    location.lng <= 135.1 &&
    location.lat >= 3.8 &&
    location.lat <= 53.6
  );
}
