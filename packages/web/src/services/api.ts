import type {
  ApiResponse,
  AuthResponse,
  Gathering,
  Participant,
  CreateGatheringParams,
  JoinGatheringParams,
  GatheringState,
  PollState,
  SearchRestaurantResult,
  AiSuggestion,
  Nomination,
  Vote,
  VoteCountItem,
  VoteWinnerResult,
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
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, res.status);
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

export function getGatheringState(code: string): Promise<GatheringState> {
  return request<GatheringState>(`/gatherings/${code}`);
}

export interface MyGatheringsResponse {
  gatherings: Gathering[];
  total: number;
}

export function getMyGatherings(params?: { status?: string; limit?: number; offset?: number }): Promise<MyGatheringsResponse> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (typeof params?.limit === 'number') q.set('limit', String(params.limit));
  if (typeof params?.offset === 'number') q.set('offset', String(params.offset));
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return request<MyGatheringsResponse>(`/gatherings/mine${suffix}`);
}

export function joinGathering(code: string, params: JoinGatheringParams): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/join`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function updateLocation(
  code: string,
  location: { lng: number; lat: number },
  locationName?: string,
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

export function startNominating(code: string): Promise<{ status: 'nominating' }> {
  return request<{ status: 'nominating' }>(`/gatherings/${code}/start-nominating`, {
    method: 'POST',
  });
}

export function searchRestaurants(code: string, keyword: string, page: number = 1): Promise<{ restaurants: SearchRestaurantResult[]; total: number; page: number }> {
  const q = new URLSearchParams({ keyword, page: String(page) });
  return request<{ restaurants: SearchRestaurantResult[]; total: number; page: number }>(
    `/gatherings/${code}/search-restaurants?${q.toString()}`,
  );
}

export function aiSuggest(code: string, tastes: string[]): Promise<{ suggestions: AiSuggestion[] }> {
  return request<{ suggestions: AiSuggestion[] }>(`/gatherings/${code}/ai-suggest`, {
    method: 'POST',
    body: JSON.stringify({ tastes }),
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
    body: JSON.stringify(params),
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
    body: JSON.stringify({ nomination_id: nominationId }),
  });
}

// ── Actions ──

export function depart(code: string): Promise<Participant> {
  return request<Participant>(`/gatherings/${code}/depart`, { method: 'POST' });
}

export function arrive(code: string): Promise<{ participant: Participant; allArrived: boolean }> {
  return request<{ participant: Participant; allArrived: boolean }>(`/gatherings/${code}/arrive`, {
    method: 'POST',
  });
}

// ── Polling ──

export function poll(code: string, version: number): Promise<PollState> {
  return request<PollState>(`/gatherings/${code}/poll?version=${version}`);
}

