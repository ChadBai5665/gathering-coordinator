/**
 * 时间工具函数
 * 格式化、倒计时、出发时间计算等纯函数
 */

/** 默认缓冲时间（分钟） */
const DEFAULT_BUFFER_MINUTES = 10;

/**
 * 计算建议出发时间
 * 公式：出发时间 = 目标时间 - 行程时长 - 缓冲时间
 * @param targetTime - 目标到达时间（ISO 8601 字符串或 Date）
 * @param travelDurationSeconds - 预计行程时长（秒）
 * @param bufferMinutes - 缓冲时间（分钟），默认 10 分钟
 * @returns 建议出发时间的 Date 对象
 */
export function calculateDepartureTime(
  targetTime: string | Date,
  travelDurationSeconds: number,
  bufferMinutes: number = DEFAULT_BUFFER_MINUTES,
): Date {
  const target = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  const bufferMs = bufferMinutes * 60 * 1000;
  const travelMs = travelDurationSeconds * 1000;

  return new Date(target.getTime() - travelMs - bufferMs);
}

/**
 * 计算距离目标时间的剩余毫秒数
 * @param targetTime - 目标时间（ISO 8601 字符串或 Date）
 * @param now - 当前时间（可选，默认 Date.now()，方便测试）
 * @returns 剩余毫秒数，已过期则返回 0
 */
export function getTimeRemaining(
  targetTime: string | Date,
  now: number = Date.now(),
): number {
  const target = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  const remaining = target.getTime() - now;
  return Math.max(0, remaining);
}

/**
 * 将毫秒数格式化为倒计时文本
 * @param ms - 毫秒数
 * @returns 格式化文本，如 "2小时30分钟"、"45分钟"、"已到时间"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '已到时间';

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时`;
  }
  if (minutes > 0) {
    return `${minutes}分钟`;
  }
  return '不到1分钟';
}

/**
 * 将秒数格式化为行程时长文本
 * @param seconds - 秒数
 * @returns 格式化文本，如 "约30分钟"、"约1小时15分钟"
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0分钟';

  const totalMinutes = Math.ceil(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `约${hours}小时${minutes}分钟`;
  }
  if (hours > 0) {
    return `约${hours}小时`;
  }
  return `约${minutes}分钟`;
}

/**
 * 格式化时间为 HH:mm 格式
 * @param date - 时间（ISO 8601 字符串或 Date）
 * @returns "HH:mm" 格式字符串
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 判断目标时间是否已过期
 * @param targetTime - 目标时间（ISO 8601 字符串或 Date）
 * @param now - 当前时间戳（可选）
 * @returns 是否已过期
 */
export function isExpired(
  targetTime: string | Date,
  now: number = Date.now(),
): boolean {
  const target = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  return target.getTime() <= now;
}

/**
 * 判断是否应该提醒出发
 * 当前时间 >= 建议出发时间 时返回 true
 * @param departureTime - 建议出发时间（ISO 8601 字符串或 Date）
 * @param now - 当前时间戳（可选）
 * @returns 是否应该提醒出发
 */
export function shouldRemindDeparture(
  departureTime: string | Date,
  now: number = Date.now(),
): boolean {
  return isExpired(departureTime, now);
}
