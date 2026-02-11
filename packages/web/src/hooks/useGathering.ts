import { useEffect } from 'react';
import { useGatheringStore } from '@/stores/gathering.store';

/**
 * 聚会 Hook
 * 包装 gathering store，自动管理 polling 生命周期
 */
export function useGathering(code?: string) {
  const store = useGatheringStore();

  useEffect(() => {
    if (!code) return;

    store.fetchGathering(code);
    store.startPolling(code);

    return () => {
      store.stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return {
    gathering: store.currentGathering,
    participants: store.participants,
    restaurants: store.restaurants,
    activeVote: store.activeVote,
    messages: store.messages,
    version: store.version,
    isLoading: store.isLoading,
    error: store.error,
    joinGathering: store.joinGathering,
    recommend: store.recommend,
    startVote: store.startVote,
    castVote: store.castVote,
    depart: store.depart,
    arrive: store.arrive,
    reset: store.reset,
  };
}
