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

/**
 * 匯入時只先確認外層是「非空陣列」,每一列的欄位是否合法留給匯入路由逐列驗證。
 * 若在這裡就用 upsertPassengerSchema 驗證整個陣列,只要有一列有誤(例如缺手機號碼)
 * 整批都會被 Zod 直接拒絕,好的那些列也無法匯入,使用者只會看到一句籠統的錯誤訊息。
 */
export const importPassengersSchema = z.object({
  rows: z.array(z.unknown()).min(1, "匯入資料不可為空"),
});
