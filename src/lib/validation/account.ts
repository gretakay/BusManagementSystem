import { z } from "zod";

export const createAccountSchema = z.object({
  email: z.string().trim().email("Email 格式錯誤"),
  password: z.string().min(6, "密碼至少 6 碼"),
});

export const resetAccountPasswordSchema = z.object({
  password: z.string().min(6, "密碼至少 6 碼"),
});
