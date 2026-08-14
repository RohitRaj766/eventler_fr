import { axiosInstance } from './axiosInstance';

export const verificationService = {
  async sendEmailOtp(email: string) {
    const response = await axiosInstance.post('/verification/email/send-otp', { email });
    return response.data.data;
  },

  async verifyEmailOtp(email: string, code: string) {
    const response = await axiosInstance.post('/verification/email/verify-otp', { email, code });
    return response.data.data;
  },

  async sendPhoneOtp(phoneNumber: string) {
    const response = await axiosInstance.post('/verification/phone/send-otp', { phoneNumber });
    return response.data.data;
  },

  async verifyPhoneOtp(phoneNumber: string, code: string) {
    const response = await axiosInstance.post('/verification/phone/verify-otp', { phoneNumber, code });
    return response.data.data;
  },
};
