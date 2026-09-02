import { z } from "zod";

export const createBusSchema = z.object({
  busNumber: z.string().trim().min(1, "車次編號為必填"),
  driverName: z.string().trim().optional(),
  driverPhone: z.string().trim().optional(),
  seatCapacity: z.number().int().min(1, "座位上限至少為 1"),
});

export const updateBusSchema = z.object({
  busNumber: z.string().trim().min(1).optional(),
  driverName: z.string().trim().optional(),
  driverPhone: z.string().trim().optional(),
  seatCapacity: z.number().int().min(1).optional(),
});

export const assignBusLeaderSchema = z.object({
  email: z.string().trim().email("Email 格式錯誤"),
  role: z.enum(["leader", "coLeader", "groupLeader"]),
  password: z.string().min(6, "密碼至少 6 碼").optional(),
  /** 只負責這個組別(例如小客車車號);留空表示整台車都看得到 */
  groupTag: z.string().trim().max(50).optional(),
});

export const removeBusLeaderSchema = z.object({
  uid: z.string().trim().min(1),
});
