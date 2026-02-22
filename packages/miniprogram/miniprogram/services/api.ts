import type {
  ApiResponse,
  AuthResponse,
  Gathering,
  Participant,
  CreateGatheringParams,
  JoinGatheringParams,
  MyGatheringsResponse,
  PollResponse,
  SearchRestaurantResult,
  AiSuggestion,
  Nomination,
  Vote,
  VoteCountItem,
  VoteWinnerResult,
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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: string | WechatMiniprogram.IAnyObject | ArrayBuffer;
  header?: Record<string, string>;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const pairs: string[] = [];
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return pairs.join('&');
}

/** 通用请求方法 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}${path}`,
      method: (options.method as any) || 'GET',
      data: options.data,
      header: headers,
      success: (res) => {
        const json = res.data as ApiResponse<T>;

        if (!json || typeof json !== 'object') {
          reject(new ApiError('INVALID_RESPONSE', '服务器返回格式异常', res.statusCode));
          return;
        }

        if (!json.success) {
          reject(new ApiError(json.error.code, json.error.message, res.statusCode));
          return;
        }

        resolve(json.data);
      },
      fail: (err) => {
        reject(new ApiError('NETWORK_ERROR', err.errMsg || '网络请求失败'));
      },
    });
  });
}

// ── Auth ──

export function guestLogin(nickname: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/guest', {
    method: 'POST',
    data: { nickname },
  });
}

export function wechatLogin(code: string): Promise<AuthResponse> {
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

export function getGatheringByCode(code: string) {
  return request<{
    gathering: Gathering;
    participants: Participant[];
    nominations: Nomination[];
    active_vote: (Vote & { vote_counts: VoteCountItem[]; total_voted: number; has_voted: boolean }) | null;
    messages: any[];
  }>(`/gatherings/${code}`);
}

export function getMyGatherings(params?: { status?: string; limit?: number; offset?: number }): Promise<MyGatheringsResponse> {
  const query = buildQuery({
    status: params?.status,
    limit: params?.limit,
    offset: params?.offset,
  });
  const suffix = query ? `?${query}` : '';
  return request<MyGatheringsResponse>(`/gatherings/mine${suffix}`);
}

export function joinGathering(code: string, params: JoinGatheringParams): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/join`, {
    method: 'POST',
    data: params,
  });
}

export function updateLocation(
  code: string,
  location: { lat: number; lng: number },
  locationName?: string,
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

export function startNominating(code: string): Promise<{ status: 'nominating' }> {
  return request<{ status: 'nominating' }>(`/gatherings/${code}/start-nominating`, {
    method: 'POST',
  });
}

export function searchRestaurants(code: string, keyword: string, page: number = 1): Promise<{ restaurants: SearchRestaurantResult[]; total: number; page: number }> {
  const query = buildQuery({ keyword, page });
  return request<{ restaurants: SearchRestaurantResult[]; total: number; page: number }>(
    `/gatherings/${code}/search-restaurants?${query}`,
  );
}

export function aiSuggest(code: string, tastes: string[]): Promise<{ suggestions: AiSuggestion[] }> {
  return request<{ suggestions: AiSuggestion[] }>(`/gatherings/${code}/ai-suggest`, {
    method: 'POST',
    data: { tastes },
  });
}

export function nominate(code: string, params: {
  amap_id: string;
  name: string;
  type?: string;
  address?: string;
  location: { lng: number; lat: number };
  rating?: number;
  cost?: number;
  source: 'manual' | 'ai';
  reason?: string;
}): Promise<Nomination & { nominator_nickname?: string }> {
  return request<Nomination & { nominator_nickname?: string }>(`/gatherings/${code}/nominate`, {
    method: 'POST',
    data: params,
  });
}

export function withdrawNomination(code: string, nominationId: string): Promise<{ deleted: true }> {
  return request<{ deleted: true }>(`/gatherings/${code}/nominate/${nominationId}`, {
    method: 'DELETE',
  });
}

// ── Voting ──

export function startVoting(code: string): Promise<{ vote: Vote & { nominations: string[] } }> {
  return request<{ vote: Vote & { nominations: string[] } }>(`/gatherings/${code}/start-voting`, {
    method: 'POST',
  });
}

export function castVote(
  code: string,
  voteId: string,
  nominationId: string,
): Promise<{
  vote_counts: VoteCountItem[];
  total_voted: number;
  total_participants: number;
  result: VoteWinnerResult | null;
}> {
  return request<{
    vote_counts: VoteCountItem[];
    total_voted: number;
    total_participants: number;
    result: VoteWinnerResult | null;
  }>(`/gatherings/${code}/vote/${voteId}`, {
    method: 'POST',
    data: { nomination_id: nominationId },
  });
}

// ── Actions ──

export function depart(code: string): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/depart`, {
    method: 'POST',
  });
}

export function arrive(code: string): Promise<{ participant: Participant; allArrived: boolean }> {
  return request<{ participant: Participant; allArrived: boolean }>(`/gatherings/${code}/arrive`, {
    method: 'POST',
  });
}

// ── Polling ──

export function poll(code: string, version: number): Promise<PollResponse> {
  const safeVersion = Number.isFinite(version) ? version : 0;
  return request<PollResponse>(`/gatherings/${code}/poll?version=${safeVersion}`);
}
