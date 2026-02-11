// 全局 App 实例
App<IAppOption>({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: '',
  },

  onLaunch() {
    // 读取本地缓存的登录信息
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }

    // 设置 API 基础地址
    this.globalData.apiBaseUrl = this.getApiBaseUrl();
  },

  getApiBaseUrl(): string {
    // 根据环境返回不同的 API 地址
    const envVersion = __wxConfig?.envVersion || 'release';
    const urlMap: Record<string, string> = {
      develop: 'http://localhost:3000/api',
      trial: 'https://api-staging.ontheway.app/api',
      release: 'https://api.ontheway.app/api',
    };
    return urlMap[envVersion] || urlMap.release;
  },

  /** 检查是否已登录 */
  isLoggedIn(): boolean {
    return !!this.globalData.token;
  },

  /** 设置登录信息 */
  setAuth(token: string, userInfo: IUserInfo) {
    this.globalData.token = token;
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
  },

  /** 清除登录信息 */
  clearAuth() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },
});
