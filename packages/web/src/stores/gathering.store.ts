import { create } from 'zustand';
import type {
  ActiveVote,
  Gathering,
  GatheringState,
  Message,
  Nomination,
  Participant,
  SearchRestaurantResult,
  AiSuggestion,
} from '@ontheway/shared';
import * as api from '@/services/api';

interface StoreState {
  gathering: Gathering | null;
  participants: Participant[];
  nominations: Nomination[];
  activeVote: ActiveVote | null;
  messages: Message[];
  version: number;

  searchResults: SearchRestaurantResult[];
  aiSuggestions: AiSuggestion[];

  isLoading: boolean;
  error: string | null;
  _pollingTimer: ReturnType<typeof setInterval> | null;
}

interface StoreActions {
  fetchGathering: (code: string) => Promise<void>;
  joinGathering: (code: string, nickname: string) => Promise<void>;
  startNominating: (code: string) => Promise<void>;
  searchRestaurants: (code: string, keyword: string, page?: number) => Promise<void>;
  aiSuggest: (code: string, tastes: string[]) => Promise<void>;
  nominate: (code: string, params: Parameters<typeof api.nominate>[1]) => Promise<void>;
  withdrawNomination: (code: string, nominationId: string) => Promise<void>;
  startVoting: (code: string) => Promise<void>;
  castVote: (code: string, voteId: string, nominationId: string) => Promise<void>;
  depart: (code: string) => Promise<void>;
  arrive: (code: string) => Promise<void>;
  startPolling: (code: string) => void;
  stopPolling: () => void;
  reset: () => void;
}

const initialState: StoreState = {
  gathering: null,
  participants: [],
  nominations: [],
  activeVote: null,
  messages: [],
  version: 0,
  searchResults: [],
  aiSuggestions: [],
  isLoading: false,
  error: null,
  _pollingTimer: null,
};

function applyGatheringState(set: (partial: Partial<StoreState>) => void, data: GatheringState): void {
  set({
    gathering: data.gathering,
    participants: data.participants,
    nominations: data.nominations,
    activeVote: data.active_vote,
    messages: data.messages,
  });
}

export const useGatheringStore = create<StoreState & StoreActions>()((set, get) => ({
  ...initialState,

  fetchGathering: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getGatheringState(code);
      applyGatheringState(set, data);
      set({ isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : '加载失败',
      });
    }
  },

  joinGathering: async (code, nickname) => {
    set({ isLoading: true, error: null });
    try {
      await api.joinGathering(code, { nickname });
      await get().fetchGathering(code);
      set({ isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : '加入失败',
      });
      throw e;
    }
  },

  startNominating: async (code) => {
    try {
      await api.startNominating(code);
      await get().fetchGathering(code);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '开始提名失败' });
      throw e;
    }
  },

  searchRestaurants: async (code, keyword, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.searchRestaurants(code, keyword, page);
      set({ searchResults: data.restaurants, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : '搜索失败' });
      throw e;
    }
  },

  aiSuggest: async (code, tastes) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.aiSuggest(code, tastes);
      set({ aiSuggestions: data.suggestions, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : '推荐失败' });
      throw e;
    }
  },

  nominate: async (code, params) => {
    set({ isLoading: true, error: null });
    try {
      await api.nominate(code, params);
      await get().fetchGathering(code);
      set({ isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : '提名失败' });
      throw e;
    }
  },

  withdrawNomination: async (code, nominationId) => {
    set({ isLoading: true, error: null });
    try {
      await api.withdrawNomination(code, nominationId);
      await get().fetchGathering(code);
      set({ isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : '撤回失败' });
      throw e;
    }
  },

  startVoting: async (code) => {
    try {
      await api.startVoting(code);
      await get().fetchGathering(code);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '开始投票失败' });
      throw e;
    }
  },

  castVote: async (code, voteId, nominationId) => {
    try {
      await api.castVote(code, voteId, nominationId);
      await get().fetchGathering(code);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '投票失败' });
      throw e;
    }
  },

  depart: async (code) => {
    try {
      await api.depart(code);
      await get().fetchGathering(code);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '出发失败' });
      throw e;
    }
  },

  arrive: async (code) => {
    try {
      await api.arrive(code);
      await get().fetchGathering(code);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '到达失败' });
      throw e;
    }
  },

  startPolling: (code) => {
    get().stopPolling();
    const timer = setInterval(async () => {
      try {
        const { version } = get();
        const data = await api.poll(code, version);
        if (!data.changed) {
          if (typeof data.version === 'number' && data.version !== version) {
            set({ version: data.version });
          }
          return;
        }

        // changed=true: server returns full state
        const g = data.gathering;
        if (g) {
          set({ version: data.version });
          applyGatheringState(set, {
            gathering: g,
            participants: data.participants || [],
            nominations: data.nominations || [],
            active_vote: data.active_vote || null,
            messages: data.messages || [],
          });
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
    set({ _pollingTimer: timer });
  },

  stopPolling: () => {
    const { _pollingTimer } = get();
    if (_pollingTimer) {
      clearInterval(_pollingTimer);
      set({ _pollingTimer: null });
    }
  },

  reset: () => {
    get().stopPolling();
    set(initialState);
  },
}));

