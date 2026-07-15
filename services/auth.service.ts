import { apiClient } from "@/lib/axios";
import { LoginFields, SignupFields } from "@/schemas/auth.schema";
import { ApiResponse, AuthResponse, UserProfile } from "@/types/auth.types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Login with username and password
   */
  async login(credentials: LoginFields): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post("/api/auth/login", credentials);
    // error to be rsolved
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Sign up a new user
   */
  async signup(data: Omit<SignupFields, "confirmPassword" | "terms">): Promise<ApiResponse<AuthResponse>> {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      username: data.username,
      password: data.password,
    };
    
    const response = await apiClient.post("/api/auth/signup", payload);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Verify email via GET endpoint
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ verified: boolean }>> {
    const response = await apiClient.get(`/api/auth/verify-email`, { params: { token } });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Resend the verification email link
   */
  async resendVerification(email: string): Promise<ApiResponse<{ sent: boolean }>> {
    const response = await apiClient.post("/api/auth/resend-verification", { email });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Sign in with Google provider
   */
  async loginWithGoogle(token: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post("/api/auth/login-with-google", { token });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Sign in with Apple provider
   */
  async loginWithApple(token: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post("/api/auth/login-with-apple", { token });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Initiate Forgot Password (send OTP)
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ otpSent: boolean }>> {
    const response = await apiClient.post("/api/auth/forgot-password", { email });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Verify the password reset OTP code
   */
  async verifyResetOtp(email: string, otp: string): Promise<ApiResponse<{ token: string }>> {
    const response = await apiClient.post("/api/auth/verify-reset-otp", { email, otp });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Reset password with the verified token
   */
  async resetPassword(password: string, token: string): Promise<ApiResponse<{ success: boolean }>> {
    // Note: client passes ResetPasswordFields values
    // Our route expects { email, otp, newPassword }
    // Let's pass the verification token/otp and password accordingly
    const response = await apiClient.post("/api/auth/reset-password", { newPassword: password, otp: token, email: "" });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Change password for logged-in user
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.post("/api/auth/change-password", { oldPassword, newPassword });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Update profile information
   */
  async updateProfile(fullName: string, username: string): Promise<ApiResponse<UserProfile>> {
    const names = fullName.trim().split(" ");
    const first_name = names[0] || "";
    const last_name = names.slice(1).join(" ") || "";
    const response = await apiClient.post("/api/auth/update-profile", { first_name, last_name, bio: username });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Refresh session tokens
   */
  async refresh(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post("/api/auth/refresh", { refreshToken });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },

  /**
   * Logout user session
   */
  async logout(): Promise<ApiResponse<{ loggedOut: boolean }>> {
    const response = await apiClient.post("/api/auth/logout");
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  },
};
