import type {
  ApiResponse,
  AuthResponse,
  Gathering,
  GatheringDetail,
  Participant,
  Restaurant,
  Vote,
  VoteDetail,
  Message,
  CreateGatheringParams,
  JoinGatheringParams,
} from './types';

/** API 错误 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 获取存储的 token */
function getToken(): string | null {
  try {
    return wx.getStorageSync('token') || null;
  } catch {
    return null;
  }
}

/** 获取 API 基础地址 */
function getBaseUrl(): string {
  const app = getApp<IAppOption>();
  return app.globalData.apiBaseUrl;
}

/** 请求选项（不含 url，由 request 内部拼接） */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: string | WechatMiniprogram.IAnyObject | ArrayBuffer;
  header?: Record<string, string>;
}

/** 通用请求方法 */
async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 调试日志：请求信息
  const requestUrl = `${getBaseUrl()}${path}`;
  console.log('[API Request] ===== START =====');
  console.log('[API Request] URL:', requestUrl);
  console.log('[API Request] Method:', options.method || 'GET');
  console.log('[API Request] Data:', options.data);
  console.log('[API Request] Data Type:', typeof options.data);
  console.log('[API Request] Headers:', headers);
  console.log('[API Request] ===== END =====');

  return new Promise((resolve, reject) => {
    wx.request({
      url: requestUrl,
      method: options.method as any || 'GET',
      data: options.data,
      header: headers,
      success: (res) => {
        console.log('[API Response] Status:', res.statusCode);
        console.log('[API Response] Data:', res.data);

        const json = res.data as ApiResponse<T>;

        if (!json.success) {
          console.error('[API Error] Code:', json.code, 'Message:', json.message);
          reject(new ApiError(json.code, json.message, res.statusCode));
          return;
        }

        console.log('[API Success] Data:', json.data);
        resolve(json.data);
      },
      fail: (err) => {
        console.error('[API Fail] Error:', err.errMsg);
        reject(new ApiError('NETWORK_ERROR', err.errMsg));
      },
    });
  });
}

// ── Auth ──

export function guestLogin(nickname: string): Promise<AuthResponse> {
  console.log('[Guest Login] ===== START =====');
  console.log('[Guest Login] Input nickname:', nickname);
  console.log('[Guest Login] Nickname type:', typeof nickname);
  console.log('[Guest Login] Nickname length:', nickname.length);
  console.log('[Guest Login] Nickname charCodes:', Array.from(nickname).map(c => c.charCodeAt(0)));
  console.log('[Guest Login] ===== END =====');

  return request<AuthResponse>('/auth/guest', {
    method: 'POST',
    data: { nickname },
  });
}

export function wechatLogin(code: string): Promise<AuthResponse> {
  // TODO: 实现微信登录逻辑
  return request<AuthResponse>('/auth/wechat', {
    method: 'POST',
    data: { code },
  });
}

// ── Gatherings ──

export function createGathering(params: CreateGatheringParams): Promise<Gathering> {
  return request<Gathering>('/gatherings', {
    method: 'POST',
    data: params,
  });
}

export function getGatheringByCode(code: string): Promise<GatheringDetail> {
  return request<GatheringDetail>(`/gatherings/${code}`);
}

export function getMyGatherings(): Promise<GatheringDetail[]> {
  return request<GatheringDetail[]>('/gatherings/mine');
}

export function joinGathering(code: string, params: Omit<JoinGatheringParams, 'code'>): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/join`, {
    method: 'POST',
    data: params,
  });
}

export function updateLocation(
  code: string,
  location: { lat: number; lng: number },
  locationName?: string
): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/location`, {
    method: 'PATCH',
    data: {
      lat: location.lat,
      lng: location.lng,
      location_name: locationName,
    },
  });
}

// ── Restaurants ──

export function recommend(code: string): Promise<Restaurant[]> {
  return request<Restaurant[]>(`/gatherings/${code}/recommend`, {
    method: 'POST',
  });
}

// ── Votes ──

export function startVote(code: string, restaurantIndex: number): Promise<Vote> {
  return request<Vote>(`/gatherings/${code}/vote`, {
    method: 'POST',
    data: { restaurant_index: restaurantIndex },
  });
}

export function castVote(code: string, voteId: string, agree: boolean): Promise<VoteDetail> {
  return request<VoteDetail>(`/gatherings/${code}/vote/${voteId}`, {
    method: 'POST',
    data: { agree },
  });
}

// ── Actions ──

export function depart(code: string): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/depart`, {
    method: 'POST',
  });
}

export function arrive(code: string): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/arrive`, {
    method: 'POST',
  });
}

// ── Polling ──

export interface PollResponse {
  changed: boolean;
  version: number;
  gathering?: GatheringDetail;
  participants?: Participant[];
  restaurants?: Restaurant[];
  active_vote?: VoteDetail | null;
  messages?: Message[];
}

export function poll(code: string, version: number): Promise<PollResponse> {
  return request<PollResponse>(`/gatherings/${code}/poll?version=${version}`);
}
