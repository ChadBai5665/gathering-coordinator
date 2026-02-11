/**
 * 认证状态管理
 */

type AuthListener = (isLoggedIn: boolean) => void;

class AuthStore {
  private listeners: AuthListener[] = [];

  get isLoggedIn(): boolean {
    const app = getApp<IAppOption>();
    return app.isLoggedIn();
  }

  get token(): string | null {
    const app = getApp<IAppOption>();
    return app.globalData.token;
  }

  get userInfo(): IUserInfo | null {
    const app = getApp<IAppOption>();
    return app.globalData.userInfo;
  }

  login(token: string, userInfo: IUserInfo): void {
    const app = getApp<IAppOption>();
    app.setAuth(token, userInfo);
    this.notify();
  }

  logout(): void {
    const app = getApp<IAppOption>();
    app.clearAuth();
    this.notify();
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(): void {
    const isLoggedIn = this.isLoggedIn;
    this.listeners.forEach((listener) => listener(isLoggedIn));
  }
}

export const authStore = new AuthStore();
