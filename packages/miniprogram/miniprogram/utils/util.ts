/**
 * 工具函数
 */

/** 格式化时间 */
export function formatTime(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
}

function formatNumber(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 倒计时格式化（秒 -> HH:MM:SS 或 MM:SS） */
export function formatCountdown(seconds: number): string {
  if (seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(secs)}`;
  }
  return `${formatNumber(minutes)}:${formatNumber(secs)}`;
}

/** 节流函数 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/** 防抖函数 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: number | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay) as any;
  };
}

/** 封装 wx.showToast */
export function showToast(title: string, icon: 'success' | 'error' | 'loading' | 'none' = 'none'): void {
  wx.showToast({
    title,
    icon,
    duration: 2000,
  });
}

/** 封装 wx.showLoading */
export function showLoading(title: string = '加载中...'): void {
  wx.showLoading({
    title,
    mask: true,
  });
}

/** 封装 wx.hideLoading */
export function hideLoading(): void {
  wx.hideLoading();
}

/** 封装 wx.showModal 返回 Promise */
export function showModal(title: string, content: string): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}
