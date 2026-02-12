/**
 * 聚会状态管理
 */

import type {
  GatheringDetail,
  Participant,
  Restaurant,
  VoteDetail,
  Message,
} from '../services/types';
import * as api from '../services/api';

type GatheringListener = (state: GatheringState) => void;

export interface GatheringState {
  gathering: GatheringDetail | null;
  participants: Participant[];
  restaurants: Restaurant[];
  activeVote: VoteDetail | null;
  messages: Message[];
  version: number;
  loading: boolean;
}

class GatheringStore {
  private state: GatheringState = {
    gathering: null,
    participants: [],
    restaurants: [],
    activeVote: null,
    messages: [],
    version: 0,
    loading: false,
  };

  private listeners: GatheringListener[] = [];
  private pollTimer: number | null = null;

  getState(): GatheringState {
    return { ...this.state };
  }

  async loadGathering(code: string): Promise<void> {
    try {
      this.state.loading = true;
      this.notify();

      const response = await api.poll(code, 0);
      if (response.changed) {
        this.state = {
          gathering: response.gathering || null,
          participants: response.participants || [],
          restaurants: response.restaurants || [],
          activeVote: response.active_vote || null,
          messages: response.messages || [],
          version: response.version,
          loading: false,
        };
      } else {
        this.state = {
          ...this.state,
          version: response.version,
          loading: false,
        };
      }
      this.notify();
    } catch (error) {
      this.state.loading = false;
      this.notify();
      throw error;
    }
  }

  startPolling(code: string): void {
    this.stopPolling();

    const doPoll = async () => {
      try {
        const response = await api.poll(code, this.state.version);
        if (response.changed) {
          this.state = {
            gathering: response.gathering || null,
            participants: response.participants || [],
            restaurants: response.restaurants || [],
            activeVote: response.active_vote || null,
            messages: response.messages || [],
            version: response.version,
            loading: false,
          };
        } else if (response.version !== this.state.version) {
          this.state = {
            ...this.state,
            version: response.version,
          };
        }
        this.notify();
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // 每 3 秒轮询一次
    this.pollTimer = setInterval(doPoll, 3000) as any;
  }

  stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  subscribe(listener: GatheringListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  reset(): void {
    this.stopPolling();
    this.state = {
      gathering: null,
      participants: [],
      restaurants: [],
      activeVote: null,
      messages: [],
      version: 0,
      loading: false,
    };
    this.notify();
  }
}

export const gatheringStore = new GatheringStore();
