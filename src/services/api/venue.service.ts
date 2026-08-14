import { axiosInstance } from './axiosInstance';
import { CreateVenueInput, CreateResourceInput } from '@/utils/validationSchemas';

export const venueService = {
  async createVenue(data: CreateVenueInput) {
    const response = await axiosInstance.post('/venues', data);
    return response.data.data;
  },

  async getVenues() {
    const response = await axiosInstance.get('/venues');
    return response.data.data;
  },

  async createResource(data: CreateResourceInput) {
    const response = await axiosInstance.post('/venues/resources', data);
    return response.data.data;
  },

  async getResources() {
    const response = await axiosInstance.get('/venues/resources');
    return response.data.data;
  },
};
