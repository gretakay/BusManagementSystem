import { z } from "zod";

export const createTripSchema = z.object({
  name: z.string().trim().min(1, "活動名稱為必填"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式需為 YYYY-MM-DD"),
  busCount: z.number().int().min(1, "車輛數量至少為 1"),
});

const plannedSessionListSchema = z.array(z.string().trim().min(1)).max(20, "點名場次最多 20 個");

export const updateTripSchema = z.object({
  name: z.string().trim().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式需為 YYYY-MM-DD")
    .optional(),
  busCount: z.number().int().min(1).optional(),
  status: z.enum(["notStarted", "inProgress", "ended"]).optional(),
  plannedSessions: z
    .object({
      outbound: plannedSessionListSchema,
      return: plannedSessionListSchema,
    })
    .optional(),
});

export const assignTripSuperLeadSchema = z.object({
  email: z.string().trim().email("Email 格式錯誤"),
});

export const removeTripSuperLeadSchema = z.object({
  uid: z.string().trim().min(1),
});
