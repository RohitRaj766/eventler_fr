import type { Program, ProgramStatus, ProgramTree } from '@/types';
import { apiGet, apiPatch, apiPost } from './axiosInstance';

export interface CreateProgramPayload {
  name: string;
  description?: string;
  plannedStartTime: string;
  plannedEndTime: string;
}

export const programService = {
  async list() {
    return apiGet<Program[]>('/programs');
  },

  async create(payload: CreateProgramPayload) {
    return apiPost<Program>('/programs', payload);
  },

  /**
   * Returns the program plus `nodes` (flat) and `tree` (nested).
   * Swagger documents `/programs/:id/tree`, which 404s — this is the real path.
   */
  async getTree(id: string) {
    return apiGet<ProgramTree>(`/programs/${id}`);
  },

  async updateStatus(id: string, status: ProgramStatus) {
    return apiPatch<Program>(`/programs/${id}/status`, { status });
  },
};
