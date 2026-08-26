import { z } from "zod";

export const upsertPassengerSchema = z.object({
  regNo: z.string().trim().min(1, "報名序號為必填"),
  name: z.string().trim().min(1, "姓名為必填"),
  dharmaName: z.string().trim().optional(),
  phone: z.string().trim().min(1, "手機號碼為必填"),
  identity: z.enum(["guest", "believer", "volunteer"]),
  volunteerGroup: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  busId: z.string().trim().nullable().optional(),
  lodgingInfo: z.string().trim().optional(),
});

export const importPassengersSchema = z.object({
  rows: z.array(upsertPassengerSchema).min(1, "匯入資料不可為空"),
});
