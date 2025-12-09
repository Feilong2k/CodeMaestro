const { describe, test, expect, beforeEach } = require('@jest/globals');

// Integration-style: use real FSM to compute to-states, but mock DB layer used by the service
jest.mock('../../src/db/connection', () => ({
  query: jest.fn(),
}));

const db = require('../../src/db/connection');
const AgentFsmLogService = require('../../src/services/AgentFsmLogService');
const { STATES, EVENTS, transition } = require('../../src/machines/AgentFSM');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AgentFsmLogService integration-style tests', () => {
  test('success path: logs multiple transitions with correct SQL and params shape', async () => {
    const subtaskId = '6-1-int';
    const agent = 'Tara';

    // Always resolve with a mock row; service should return rows[0]
    const mockRow = {
      id: 42,
      subtask_id: subtaskId,
      agent,
      from_state: 'DUMMY',
      to_state: 'DUMMY',
      timestamp: '2025-01-01T00:00:00.000Z',
    };
    db.query.mockResolvedValue({ rows: [mockRow] });

    const sequence = [
      { from: STATES.OBSERVE, event: EVENTS.OBSERVE_COMPLETE }, // -> THINK
      { from: STATES.THINK, event: EVENTS.THINK_COMPLETE },      // -> ACT
      { from: STATES.ACT, event: EVENTS.ACTION_COMPLETE },       // -> WAIT
      { from: STATES.VERIFY, event: EVENTS.VERIFICATION_PASSED } // -> COMPLETE
    ];

    // Drive the service multiple times using FSM to compute next state
    for (const { from, event } of sequence) {
      const ctx = { subtaskId, agent, lastResult: `${from}-done` };
      const to = transition(from, event, ctx);
      // sanity: ensure FSM produced the expected non-null state
      expect(typeof to).toBe('string');

      const res = await AgentFsmLogService.logTransition(subtaskId, agent, from, to);

      // On success, service returns the DB row (we don't assert entire row shape, but type)
      expect(res).toBe(mockRow);
    }

    // Assert SQL text and parameter tuples for each call
    expect(db.query).toHaveBeenCalledTimes(sequence.length);
    for (let i = 0; i < sequence.length; i++) {
      const call = db.query.mock.calls[i];
      const sql = call[0];
      const params = call[1];
      expect(sql).toMatch(/INSERT\s+INTO\s+agent_fsm_log/i);
      expect(sql).toMatch(/\(subtask_id,\s*agent,\s*from_state,\s*to_state,\s*timestamp\)/i);
      expect(sql).toMatch(/VALUES\s*\(\$1,\s*\$2,\s*\$3,\s*\$4,\s*NOW\(\)\)/i);

      const { from, event } = sequence[i];
      const to = transition(from, event, {});
      expect(params).toEqual([subtaskId, agent, from, to]);
    }
  });

  test('error path: db.query rejects; service handles without throwing and returns stub', async () => {
    const subtaskId = '6-1-int';
    const agent = 'Tara';
    const from = STATES.THINK;
    const to = transition(from, EVENTS.ERROR_OCCURRED, {}); // -> ERROR

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.query.mockRejectedValue(new Error('db is down'));

    const res = await AgentFsmLogService.logTransition(subtaskId, agent, from, to);

    // Should not throw and should return a stub per implementation contract
    expect(res).toMatchObject({
      subtask_id: subtaskId,
      agent,
      from_state: from,
      to_state: to,
    });
    expect(typeof res.timestamp).toBe('string');

    // Ensure logging occurred and we attempted a single insert
    expect(consoleSpy).toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  test('getTransitionsBySubtask success: returns rows ordered by timestamp ASC', async () => {
    const subtaskId = '6-1-int';
    const rows = [
      { id: 1, subtask_id: subtaskId, agent: 'Tara', from_state: 'OBSERVE', to_state: 'THINK', timestamp: new Date() },
      { id: 2, subtask_id: subtaskId, agent: 'Tara', from_state: 'THINK', to_state: 'ACT', timestamp: new Date() },
    ];
    db.query.mockResolvedValue({ rows });

    const result = await AgentFsmLogService.getTransitionsBySubtask(subtaskId);

    expect(db.query).toHaveBeenCalledTimes(1);
    const sql = db.query.mock.calls[0][0];
    const params = db.query.mock.calls[0][1];
    expect(sql).toMatch(/SELECT[\s\S]*FROM\s+agent_fsm_log/i);
    expect(sql).toMatch(/WHERE\s+subtask_id\s*=\s*\$1/i);
    expect(sql).toMatch(/ORDER BY\s+timestamp\s+ASC/i);
    expect(params).toEqual([subtaskId]);
    expect(result).toEqual(rows);
  });

  test('getTransitionsBySubtask error: returns [] when query fails', async () => {
    db.query.mockRejectedValue(new Error('db read error'));

    const result = await AgentFsmLogService.getTransitionsBySubtask('6-1-int');

    expect(result).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('getLatestTransition success: returns most recent row', async () => {
    const subtaskId = '6-1-int';
    const latest = { id: 99, subtask_id: subtaskId, agent: 'Tara', from_state: 'VERIFY', to_state: 'COMPLETE', timestamp: new Date() };
    db.query.mockResolvedValue({ rows: [latest] });

    const result = await AgentFsmLogService.getLatestTransition(subtaskId);

    expect(db.query).toHaveBeenCalledTimes(1);
    const sql = db.query.mock.calls[0][0];
    const params = db.query.mock.calls[0][1];
    expect(sql).toMatch(/ORDER BY\s+timestamp\s+DESC\s+LIMIT\s+1/i);
    expect(params).toEqual([subtaskId]);
    expect(result).toEqual(latest);
  });

  test('getLatestTransition error: returns null when query fails', async () => {
    db.query.mockRejectedValue(new Error('db latest error'));

    const result = await AgentFsmLogService.getLatestTransition('6-1-int');

    expect(result).toBeNull();
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
