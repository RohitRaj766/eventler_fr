import type { PhysicalResource, Venue } from '@/types';
import { apiGet, apiPost } from './axiosInstance';

export interface CreateVenuePayload {
  name: string;
  building?: string;
  capacity?: number;
}

export interface CreateResourcePayload {
  name: string;
  type: string;
  quantity: number;
  venueId?: string | null;
}

export const venueService = {
  async listVenues() {
    return apiGet<Venue[]>('/venues');
  },

  async createVenue(payload: CreateVenuePayload) {
    return apiPost<Venue>('/venues', payload);
  },

  async listResources() {
    return apiGet<PhysicalResource[]>('/venues/resources');
  },

  async createResource(payload: CreateResourcePayload) {
    return apiPost<PhysicalResource>('/venues/resources', payload);
  },
};
