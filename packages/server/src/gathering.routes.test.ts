import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { ErrorCode } from '@ontheway/shared';

type MockResult = {
  data?: any;
  error?: any;
  count?: number | null;
};

type MockCall = {
  table?: string;
  op: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  result: MockResult;
};

const callQueue: MockCall[] = [];

function enqueueCalls(...calls: MockCall[]): void {
  callQueue.push(...calls);
}

function dequeueCall(table: string | undefined, op: MockCall['op']): MockResult {
  const next = callQueue.shift();
  if (!next) {
    throw new Error(`No mock call queued for table=${table || 'rpc'} op=${op}`);
  }
  if (next.op !== op) {
    throw new Error(`Expected op=${next.op}, got op=${op}`);
  }
  if (typeof next.table !== 'undefined' && next.table !== table) {
    throw new Error(`Expected table=${next.table}, got table=${table}`);
  }
  return next.result;
}

class QueryBuilder {
  private op: MockCall['op'] = 'select';

  constructor(private readonly table: string) {}

  select(): this {
    this.op = 'select';
    return this;
  }

  insert(): this {
    this.op = 'insert';
    return this;
  }

  update(): this {
    this.op = 'update';
    return this;
  }

  delete(): this {
    this.op = 'delete';
    return this;
  }

  eq(): this {
    return this;
  }

  in(): this {
    return this;
  }

  order(): this {
    return this;
  }

  range(): this {
    return this;
  }

  limit(): this {
    return this;
  }

  single(): this {
    return this;
  }

  then<TResult1 = MockResult, TResult2 = never>(
    onfulfilled?: ((value: MockResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(dequeueCall(this.table, this.op)).then(onfulfilled, onrejected);
  }
}

const supabaseAdminMock = {
  from: vi.fn((table: string) => new QueryBuilder(table)),
  rpc: vi.fn(() => Promise.resolve(dequeueCall(undefined, 'rpc'))),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('./lib/supabase.js', () => ({
  supabaseAdmin: supabaseAdminMock,
  createSupabaseClient: vi.fn(() => supabaseAdminMock),
}));

vi.mock('./middleware/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: '11111111-1111-1111-1111-111111111111' };
    req.supabase = supabaseAdminMock;
    next();
  },
  optionalAuth: (req: any, _res: any, next: any) => {
    req.user = { id: '11111111-1111-1111-1111-111111111111' };
    req.supabase = supabaseAdminMock;
    next();
  },
}));

const { default: app } = await import('./app.js');
const VALID_INVITE_CODE = 'ABC234';

function createGathering(status: string, creatorId: string = '11111111-1111-1111-1111-111111111111') {
  return {
    id: 'g-1',
    code: VALID_INVITE_CODE,
    name: 'test',
    status,
    target_time: new Date(Date.now() + 3_600_000).toISOString(),
    creator_id: creatorId,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function createParticipant(status: string = 'joined') {
  return {
    id: 'p-1',
    gathering_id: 'g-1',
    user_id: '11111111-1111-1111-1111-111111111111',
    nickname: 'tester',
    status,
    is_creator: false,
  };
}

describe('Gathering routes error guards', () => {
  beforeEach(() => {
    callQueue.length = 0;
    vi.clearAllMocks();
  });

  it('rejects start-nominating when caller is not creator', async () => {
    enqueueCalls({
      table: 'gatherings',
      op: 'select',
      result: { data: createGathering('waiting', '22222222-2222-2222-2222-222222222222'), error: null },
    });

    const res = await request(app).post(`/api/gatherings/${VALID_INVITE_CODE}/start-nominating`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('rejects start-nominating when participants are fewer than 2', async () => {
    enqueueCalls(
      {
        table: 'gatherings',
        op: 'select',
        result: { data: createGathering('waiting'), error: null },
      },
      {
        table: 'participants',
        op: 'select',
        result: { data: [{ id: 'p-1' }], error: null },
      },
    );

    const res = await request(app).post(`/api/gatherings/${VALID_INVITE_CODE}/start-nominating`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.TOO_FEW_PARTICIPANTS);
  });

  it('rejects start-voting when nominations are fewer than 2', async () => {
    enqueueCalls(
      {
        table: 'gatherings',
        op: 'select',
        result: { data: createGathering('nominating'), error: null },
      },
      {
        table: 'nominations',
        op: 'select',
        result: { data: [{ id: 'n-1' }], error: null },
      },
    );

    const res = await request(app).post(`/api/gatherings/${VALID_INVITE_CODE}/start-voting`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.TOO_FEW_NOMINATIONS);
  });

  it('rejects nominate when user already has 2 nominations', async () => {
    enqueueCalls(
      {
        table: 'gatherings',
        op: 'select',
        result: { data: createGathering('nominating'), error: null },
      },
      {
        table: 'participants',
        op: 'select',
        result: { data: createParticipant(), error: null },
      },
      {
        table: 'nominations',
        op: 'select',
        result: {
          data: [
            { id: 'n-1', amap_id: 'poi-1' },
            { id: 'n-2', amap_id: 'poi-2' },
          ],
          error: null,
        },
      },
    );

    const res = await request(app)
      .post(`/api/gatherings/${VALID_INVITE_CODE}/nominate`)
      .send({
        amap_id: 'poi-3',
        name: 'restaurant',
        location: { lng: 116.4, lat: 39.9 },
        source: 'manual',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.NOMINATION_LIMIT);
  });

  it('rejects duplicate nomination in same gathering by same user', async () => {
    enqueueCalls(
      {
        table: 'gatherings',
        op: 'select',
        result: { data: createGathering('nominating'), error: null },
      },
      {
        table: 'participants',
        op: 'select',
        result: { data: createParticipant(), error: null },
      },
      {
        table: 'nominations',
        op: 'select',
        result: { data: [{ id: 'n-1', amap_id: 'poi-1' }], error: null },
      },
    );

    const res = await request(app)
      .post(`/api/gatherings/${VALID_INVITE_CODE}/nominate`)
      .send({
        amap_id: 'poi-1',
        name: 'restaurant',
        location: { lng: 116.4, lat: 39.9 },
        source: 'manual',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.DUPLICATE_NOMINATION);
  });

  it('rejects duplicate voting by same user', async () => {
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    enqueueCalls(
      {
        table: 'gatherings',
        op: 'select',
        result: { data: createGathering('voting'), error: null },
      },
      {
        table: 'participants',
        op: 'select',
        result: { data: createParticipant(), error: null },
      },
      {
        table: 'votes',
        op: 'select',
        result: {
          data: {
            id: '33333333-3333-4333-8333-333333333333',
            gathering_id: 'g-1',
            status: 'active',
            timeout_at: future,
            total_participants: 3,
            result: null,
            created_at: new Date().toISOString(),
            resolved_at: null,
          },
          error: null,
        },
      },
      {
        table: 'nominations',
        op: 'select',
        result: { data: { id: '44444444-4444-4444-8444-444444444444' }, error: null },
      },
      {
        table: 'vote_records',
        op: 'select',
        result: { data: { id: 'vr-1' }, error: null },
      },
    );

    const res = await request(app)
      .post(`/api/gatherings/${VALID_INVITE_CODE}/vote/33333333-3333-4333-8333-333333333333`)
      .send({ nomination_id: '44444444-4444-4444-8444-444444444444' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.ALREADY_VOTED);
  });

  it('rejects depart when gathering is not confirmed/departing', async () => {
    enqueueCalls({
      table: 'gatherings',
      op: 'select',
      result: { data: createGathering('waiting'), error: null },
    });

    const res = await request(app).post(`/api/gatherings/${VALID_INVITE_CODE}/depart`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.INVALID_STATE);
  });

  it('rejects arrive when participant has not departed', async () => {
    enqueueCalls(
      {
        table: 'gatherings',
        op: 'select',
        result: { data: createGathering('confirmed'), error: null },
      },
      {
        table: 'participants',
        op: 'select',
        result: { data: createParticipant('joined'), error: null },
      },
    );

    const res = await request(app).post(`/api/gatherings/${VALID_INVITE_CODE}/arrive`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ErrorCode.INVALID_STATE);
  });
});
