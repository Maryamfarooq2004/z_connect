import { z } from "zod";

// Base validation rules
export const emailSchema = z.string().email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Password must contain at least one number",
  });

export const nameSchema = z.string().min(2, "Must be at least 2 characters long");

/**
 * Known Gap #1: SignupDto is undocumented (empty schema).
 * Based on InviteManagerDto and UpdateManagerDto convention, we assume:
 * - first_name: string (required)
 * - last_name: string (required)
 * - email: string (required)
 * - password: string (required)
 *
 * Notice: We use confirmPassword for client-side matching, but do not send it to the API.
 */
export const signupSchema = z
  .object({
    first_name: nameSchema,
    last_name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

// Login Schema: LoginWithPasswordRequestDto is documented as { username, password }
export const loginSchema = z.object({
  username: z.string().min(1, "Username/Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Forgot Password Schema: { email }
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Known Gap #2: VerifyResetOtpDto is empty.
 * We assume it accepts { email, otp }.
 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().min(4, "OTP must be at least 4 digits"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// Reset Password Schema: { email, otp, newPassword }
export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: z.string().min(1, "OTP is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Change Password Schema: { oldPassword, newPassword }
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Known Gap #3: UpdateProfileDto is empty.
 * Convention suggests { first_name, last_name }.
 */
export const updateProfileSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
