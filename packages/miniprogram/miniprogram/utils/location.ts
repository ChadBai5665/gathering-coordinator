/**
 * 位置工具函数
 */

import type { Location } from '../services/types';

/** 获取当前位置 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02', // 国测局坐标系
      success: (res) => {
        resolve({
          lng: res.longitude,
          lat: res.latitude,
        });
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '获取位置失败'));
      },
    });
  });
}

/** 打开地图查看位置 */
export function openLocation(lat: number, lng: number, name: string, address: string): void {
  wx.openLocation({
    latitude: lat,
    longitude: lng,
    name,
    address,
    scale: 15,
  });
}

/** 选择位置 */
export function chooseLocation(): Promise<Location & { name: string; address: string }> {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      success: (res) => {
        resolve({
          lng: res.longitude,
          lat: res.latitude,
          name: res.name,
          address: res.address,
        });
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '选择位置失败'));
      },
    });
  });
}
