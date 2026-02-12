import { create } from 'zustand';
import type {
  GatheringDetail,
  Participant,
  Restaurant,
  VoteDetail,
  Message,
} from '@ontheway/shared';
import * as api from '@/services/api';

interface GatheringState {
  currentGathering: GatheringDetail | null;
  participants: Participant[];
  restaurants: Restaurant[];
  activeVote: VoteDetail | null;
  messages: Message[];
  version: number;
  isLoading: boolean;
  error: string | null;
  _pollingTimer: ReturnType<typeof setInterval> | null;
}

interface GatheringActions {
  fetchGathering: (code: string) => Promise<void>;
  joinGathering: (code: string, nickname: string, tastes?: string[]) => Promise<void>;
  recommend: (code: string) => Promise<void>;
  startVote: (code: string, restaurantIndex: number) => Promise<void>;
  castVote: (code: string, voteId: string, agree: boolean) => Promise<void>;
  depart: (code: string) => Promise<void>;
  arrive: (code: string) => Promise<void>;
  startPolling: (code: string) => void;
  stopPolling: () => void;
  reset: () => void;
}

const initialState: GatheringState = {
  currentGathering: null,
  participants: [],
  restaurants: [],
  activeVote: null,
  messages: [],
  version: 0,
  isLoading: false,
  error: null,
  _pollingTimer: null,
};

export const useGatheringStore = create<GatheringState & GatheringActions>()(
  (set, get) => ({
    ...initialState,

    fetchGathering: async (code) => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.poll(code, 0);
        if (data.changed) {
          set({
            currentGathering: data.gathering ?? null,
            participants: data.participants ?? [],
            restaurants: data.restaurants ?? [],
            activeVote: data.active_vote ?? null,
            messages: data.messages ?? [],
            version: data.version,
            isLoading: false,
          });
        } else {
          set({ version: data.version, isLoading: false });
        }
      } catch (e) {
        set({
          isLoading: false,
          error: e instanceof Error ? e.message : '加载失败',
        });
      }
    },

    joinGathering: async (code, nickname, tastes) => {
      set({ isLoading: true, error: null });
      try {
        await api.joinGathering(code, { nickname, tastes });
        await get().fetchGathering(code);
      } catch (e) {
        set({
          isLoading: false,
          error: e instanceof Error ? e.message : '加入失败',
        });
        throw e;
      }
    },

    recommend: async (code) => {
      set({ isLoading: true, error: null });
      try {
        const restaurants = await api.recommend(code);
        set({ restaurants, isLoading: false });
      } catch (e) {
        set({
          isLoading: false,
          error: e instanceof Error ? e.message : '推荐失败',
        });
      }
    },

    startVote: async (code, restaurantIndex) => {
      try {
        await api.startVote(code, restaurantIndex);
        await get().fetchGathering(code);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '发起投票失败' });
      }
    },

    castVote: async (code, voteId, agree) => {
      try {
        await api.castVote(code, voteId, agree);
        await get().fetchGathering(code);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '投票失败' });
      }
    },

    depart: async (code) => {
      try {
        await api.depart(code);
        await get().fetchGathering(code);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '出发失败' });
      }
    },

    arrive: async (code) => {
      try {
        await api.arrive(code);
        await get().fetchGathering(code);
      } catch (e) {
        set({ error: e instanceof Error ? e.message : '到达失败' });
      }
    },

    startPolling: (code) => {
      get().stopPolling();
      const timer = setInterval(async () => {
        try {
          const { version } = get();
          const data = await api.poll(code, version);
          if (data.changed) {
            set({
              currentGathering: data.gathering ?? null,
              participants: data.participants ?? [],
              restaurants: data.restaurants ?? [],
              activeVote: data.active_vote ?? null,
              messages: data.messages ?? [],
              version: data.version,
            });
          } else if (data.version !== version) {
            set({ version: data.version });
          }
        } catch {
          // Silently ignore polling errors
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
  }),
);
