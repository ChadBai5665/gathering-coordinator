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
    gathering: store.gathering,
    participants: store.participants,
    nominations: store.nominations,
    activeVote: store.activeVote,
    messages: store.messages,
    version: store.version,
    searchResults: store.searchResults,
    aiSuggestions: store.aiSuggestions,
    isLoading: store.isLoading,
    error: store.error,
    joinGathering: store.joinGathering,
    startNominating: store.startNominating,
    searchRestaurants: store.searchRestaurants,
    aiSuggest: store.aiSuggest,
    nominate: store.nominate,
    withdrawNomination: store.withdrawNomination,
    startVoting: store.startVoting,
    castVote: store.castVote,
    depart: store.depart,
    arrive: store.arrive,
    reset: store.reset,
  };
}
