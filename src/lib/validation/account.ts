import { z } from "zod";
import { isValidTaiwanMobile, normalizeTaiwanMobile } from "@/lib/phone";

const loginPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeTaiwanMobile)
  .refine((v) => v === "" || isValidTaiwanMobile(v), "手機號碼格式錯誤(需為 09 開頭共 10 碼)")
  .optional();

export const createAccountSchema = z.object({
  email: z.string().trim().email("Email 格式錯誤"),
  password: z.string().min(6, "密碼至少 6 碼"),
  displayName: z.string().trim().max(50).optional(),
  loginPhone: loginPhoneSchema,
});

export const resetAccountPasswordSchema = z.object({
  password: z.string().min(6, "密碼至少 6 碼"),
});

export const updateAccountProfileSchema = z.object({
  displayName: z.string().trim().max(50).optional(),
  loginPhone: loginPhoneSchema,
});
