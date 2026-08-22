import { apiPost } from './axiosInstance';

/** OTP send responses include `otpMock` while no mail/SMS transport is live. */
export interface OtpDispatchResult {
  message: string;
  otpMock?: string;
}

export const verificationService = {
  async sendEmailOtp(email: string) {
    return apiPost<OtpDispatchResult>('/verification/email/send-otp', { email });
  },

  /** The field is `otp` — Swagger's `code` is rejected by the validator. */
  async verifyEmailOtp(email: string, otp: string) {
    return apiPost<null>('/verification/email/verify-otp', { email, otp });
  },

  async sendPhoneOtp(phoneNumber: string) {
    return apiPost<OtpDispatchResult>('/verification/phone/send-otp', { phoneNumber });
  },

  async verifyPhoneOtp(phoneNumber: string, otp: string) {
    return apiPost<null>('/verification/phone/verify-otp', { phoneNumber, otp });
  },
};
