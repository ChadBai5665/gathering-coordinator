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
} from '@ontheway/shared';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

/** 通用请求方法 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(json.code, json.message, res.status);
  }

  return json.data;
}

// ── Auth ──

export function guestLogin(nickname: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

export function wechatLogin(code: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/wechat', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ── Gatherings ──

export function createGathering(params: CreateGatheringParams): Promise<Gathering> {
  return request<Gathering>('/gatherings', {
    method: 'POST',
    body: JSON.stringify(params),
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
    body: JSON.stringify(params),
  });
}

export function updateLocation(
  code: string,
  location: { lng: number; lat: number },
  locationName?: string
): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/location`, {
    method: 'PATCH',
    body: JSON.stringify({
      lng: location.lng,
      lat: location.lat,
      location_name: locationName,
    }),
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
    body: JSON.stringify({ restaurant_index: restaurantIndex }),
  });
}

export function castVote(code: string, voteId: string, agree: boolean): Promise<VoteDetail> {
  return request<VoteDetail>(`/gatherings/${code}/vote/${voteId}`, {
    method: 'POST',
    body: JSON.stringify({ agree }),
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
