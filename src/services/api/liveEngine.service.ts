import type { LivePropagationResult, ScheduleChange } from '@/types';
import { apiGet, apiPost } from './axiosInstance';

export interface RecordActualTimePayload {
  programId: string;
  nodeId: string;
  actualStartTime?: string;
  actualEndTime?: string;
  /** Required — every timing override is written to the audit trail. */
  reason: string;
  /** Optimistic lock against the node's current `version`. */
  expectedVersion: number;
}

export const liveEngineService = {
  /** Records a real timestamp and propagates the delta downstream. */
  async recordActualTime(payload: RecordActualTimePayload) {
    return apiPost<LivePropagationResult>('/live/actual-time', payload);
  },

  async getScheduleChanges(programId: string) {
    return apiGet<ScheduleChange[]>(`/live/changes/${programId}`);
  },
};
