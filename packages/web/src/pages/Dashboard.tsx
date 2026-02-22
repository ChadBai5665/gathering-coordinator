import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Nomination } from '@ontheway/shared';
import { GatheringStatus } from '@ontheway/shared';
import { useAuth } from '@/hooks/useAuth';
import { useGathering } from '@/hooks/useGathering';
import { Button, Card, Input, Tag } from '@/components/ui';

export default function DashboardPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const g = useGathering(code);

  const [keyword, setKeyword] = useState('');
  const [tasteInput, setTasteInput] = useState('');

  const me = useMemo(() => {
    if (!user) return null;
    return g.participants.find((p) => p.user_id === user.id) || null;
  }, [g.participants, user]);

  const isCreator = !!(user && g.gathering && g.gathering.creator_id === user.id);

  const confirmedNomination = useMemo(() => {
    return g.nominations.find((n) => n.is_confirmed) || null;
  }, [g.nominations]);

  const myNominations = useMemo(() => {
    if (!me) return [];
    return g.nominations.filter((n) => n.nominated_by === me.id);
  }, [g.nominations, me]);

  const canStartVoting = isCreator && g.nominations.length >= 2 && g.gathering?.status === GatheringStatus.NOMINATING;

  const voteCountsById = useMemo(() => {
    const map = new Map<string, number>();
    const active = g.activeVote;
    if (!active) return map;
    for (const item of active.vote_counts) {
      map.set(item.nomination_id, item.count);
    }
    return map;
  }, [g.activeVote]);

  if (!code) return null;

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-lg font-semibold">聚会仪表盘</div>
            <div className="text-sm opacity-75">邀请码：{code}</div>
          </div>
          <Tag>{g.gathering?.status || 'loading'}</Tag>
        </div>
        {g.error ? <div className="text-sm text-red-600">{g.error}</div> : null}
      </Card>

      <Card className="p-4 space-y-2">
        <div className="font-semibold">参与者</div>
        <div className="flex flex-wrap gap-2">
          {g.participants.map((p) => (
            <Tag key={p.id}>
              {p.nickname}
              {p.is_creator ? '（发起人）' : ''}
              {p.status !== 'joined' ? ` · ${p.status}` : ''}
            </Tag>
          ))}
        </div>
      </Card>

      {g.gathering?.status === GatheringStatus.WAITING ? (
        <Card className="p-4 space-y-3">
          <div className="font-semibold">等待阶段</div>
          <div className="text-sm opacity-75">等待参与者加入，发起人可开始提名。</div>
          <div className="flex gap-2">
            <Button
              disabled={!isCreator || g.participants.length < 2}
              onClick={() => g.startNominating(code)}
            >
              开始提名
            </Button>
          </div>
        </Card>
      ) : null}

      {g.gathering?.status === GatheringStatus.NOMINATING ? (
        <Card className="p-4 space-y-4">
          <div className="font-semibold">提名阶段</div>

          <div className="space-y-2">
            <div className="font-medium">手动搜索</div>
            <div className="flex gap-2">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="输入关键词，例如 火锅" />
              <Button disabled={!keyword.trim()} onClick={() => g.searchRestaurants(code, keyword.trim(), 1)}>
                搜索
              </Button>
            </div>
            <div className="space-y-2">
              {g.searchResults.map((r) => (
                <Card key={r.amap_id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-xs opacity-75 truncate">{r.address}</div>
                  </div>
                  <Button
                    disabled={myNominations.length >= 2}
                    onClick={() =>
                      g.nominate(code, {
                        amap_id: r.amap_id,
                        name: r.name,
                        type: r.type,
                        address: r.address,
                        location: r.location,
                        rating: r.rating ?? undefined,
                        cost: r.cost ?? undefined,
                        source: 'manual',
                      })
                    }
                  >
                    提名
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">AI 推荐（规则算法）</div>
            <div className="flex gap-2">
              <Input
                value={tasteInput}
                onChange={(e) => setTasteInput(e.target.value)}
                placeholder="口味（用逗号分隔），例如 火锅,川菜"
              />
              <Button
                disabled={!tasteInput.trim()}
                onClick={() => {
                  const tastes = tasteInput
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  return g.aiSuggest(code, tastes);
                }}
              >
                获取推荐
              </Button>
            </div>
            <div className="space-y-2">
              {g.aiSuggestions.map((s) => (
                <Card key={s.amap_id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs opacity-75 truncate">{s.reason}</div>
                  </div>
                  <Button
                    disabled={myNominations.length >= 2}
                    onClick={() =>
                      g.nominate(code, {
                        amap_id: s.amap_id,
                        name: s.name,
                        type: s.type,
                        address: s.address,
                        location: s.location,
                        rating: s.rating ?? undefined,
                        cost: s.cost ?? undefined,
                        source: 'ai',
                        reason: s.reason,
                      })
                    }
                  >
                    提名
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">提名列表</div>
              <Button disabled={!canStartVoting} onClick={() => g.startVoting(code)}>
                开始投票
              </Button>
            </div>
            <div className="space-y-2">
              {g.nominations.map((n: Nomination) => (
                <Card key={n.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{n.name}</div>
                    <div className="text-xs opacity-75 truncate">
                      {n.source === 'ai' ? 'AI 推荐' : '手动'} · score {n.score}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {me && n.nominated_by === me.id ? (
                      <Button variant="secondary" onClick={() => g.withdrawNomination(code, n.id)}>
                        撤回
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {g.gathering?.status === GatheringStatus.VOTING ? (
        <Card className="p-4 space-y-3">
          <div className="font-semibold">投票阶段</div>
          {g.activeVote ? (
            <div className="text-sm opacity-75">
              超时：{new Date(g.activeVote.timeout_at).toLocaleTimeString()} · 已投 {g.activeVote.total_voted}/{g.activeVote.total_participants}
            </div>
          ) : (
            <div className="text-sm opacity-75">等待投票创建...</div>
          )}
          <div className="space-y-2">
            {g.nominations.map((n) => {
              const count = voteCountsById.get(n.id) || 0;
              return (
                <Card key={n.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{n.name}</div>
                    <div className="text-xs opacity-75">票数：{count}</div>
                  </div>
                  <Button
                    disabled={!g.activeVote || g.activeVote.has_voted}
                    onClick={() => g.castVote(code, g.activeVote!.id, n.id)}
                  >
                    投这家
                  </Button>
                </Card>
              );
            })}
          </div>
        </Card>
      ) : null}

      {g.gathering?.status === GatheringStatus.CONFIRMED || g.gathering?.status === GatheringStatus.DEPARTING || g.gathering?.status === GatheringStatus.COMPLETED ? (
        <Card className="p-4 space-y-3">
          <div className="font-semibold">确认与出发</div>
          {confirmedNomination ? (
            <div className="text-sm">
              已确认：<span className="font-medium">{confirmedNomination.name}</span>
            </div>
          ) : (
            <div className="text-sm opacity-75">未找到确认餐厅</div>
          )}
          <div className="flex gap-2">
            <Button disabled={!me || me.status !== 'joined'} onClick={() => g.depart(code)}>
              我已出发
            </Button>
            <Button disabled={!me || me.status !== 'departed'} onClick={() => g.arrive(code)}>
              我已到达
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-4 space-y-2">
        <div className="font-semibold">消息</div>
        <div className="space-y-1 text-sm">
          {g.messages.map((m) => (
            <div key={m.id} className="opacity-80">
              [{m.type}] {m.content}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

