/// <reference path="./types/wx/index.d.ts" />

/** 微信小程序内部配置（非公开 API） */
declare const __wxConfig: {
  envVersion?: 'develop' | 'trial' | 'release';
} | undefined;

interface IAppOption {
  globalData: {
    userInfo: IUserInfo | null;
    token: string | null;
    apiBaseUrl: string;
  };
  getApiBaseUrl(): string;
  isLoggedIn(): boolean;
  setAuth(token: string, userInfo: IUserInfo): void;
  clearAuth(): void;
}

interface IUserInfo {
  id: string;
  nickname: string;
  avatar_url: string | null;
  wx_openid: string | null;
  preferences: {
    default_tastes?: string[];
    default_nickname?: string;
  };
}
