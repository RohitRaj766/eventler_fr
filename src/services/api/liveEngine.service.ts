import { axiosInstance } from './axiosInstance';
import { RecordActualTimeInput } from '@/utils/validationSchemas';

export const liveEngineService = {
  async recordActualTime(data: RecordActualTimeInput) {
    const response = await axiosInstance.post('/live/actual-time', data);
    return response.data.data;
  },

  async getScheduleChanges(programId: string) {
    const response = await axiosInstance.get(`/live/changes/${programId}`);
    return response.data.data;
  },
};
