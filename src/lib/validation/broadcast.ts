import { z } from "zod";

export const createBroadcastSchema = z.object({
  message: z.string().trim().min(1, "訊息不可為空").max(500, "訊息過長(上限 500 字)"),
});
