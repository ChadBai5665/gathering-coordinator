/**
 * 聚会状态管理（v2）
 */

import type {
  Gathering,
  Participant,
  Nomination,
  ActiveVote,
  Message,
} from '../services/types';
import * as api from '../services/api';

type GatheringListener = (state: GatheringState) => void;

export interface GatheringState {
  gathering: Gathering | null;
  participants: Participant[];
  nominations: Nomination[];
  activeVote: ActiveVote | null;
  messages: Message[];
  version: number;
  loading: boolean;
}

class GatheringStore {
  private state: GatheringState = {
    gathering: null,
    participants: [],
    nominations: [],
    activeVote: null,
    messages: [],
    version: 0,
    loading: false,
  };

  private listeners: GatheringListener[] = [];
  private pollTimer: number | null = null;

  private normalizeVersion(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

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
          nominations: response.nominations || [],
          activeVote: response.active_vote || null,
          messages: response.messages || [],
          version: this.normalizeVersion(response.version, this.state.version),
          loading: false,
        };
      } else {
        this.state = {
          ...this.state,
          version: this.normalizeVersion(response.version, this.state.version),
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
            nominations: response.nominations || [],
            activeVote: response.active_vote || null,
            messages: response.messages || [],
            version: this.normalizeVersion(response.version, this.state.version),
            loading: false,
          };
        } else if (response.version !== this.state.version) {
          this.state = {
            ...this.state,
            version: this.normalizeVersion(response.version, this.state.version),
          };
        }
        this.notify();
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

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
      nominations: [],
      activeVote: null,
      messages: [],
      version: 0,
      loading: false,
    };
    this.notify();
  }
}

export const gatheringStore = new GatheringStore();