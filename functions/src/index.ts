import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

initializeApp();

const ARCHIVE_AFTER_DAYS = 180;

/**
 * 規格書 §5.7:活動結束日起算 180 天後,自動將行程轉為封存狀態(唯讀,不刪除資料)。
 * 用行程的「活動日期」當作結束日基準(資料模型目前只有單一活動日期,無獨立結束日欄位)。
 * 每日執行一次,避免額外費用(排程頻率遠低於 Cloud Scheduler / Functions 免費額度)。
 */
export const archiveEndedTrips = onSchedule(
  { schedule: "every day 03:00", timeZone: "Asia/Taipei" },
  async () => {
    const db = getFirestore();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ARCHIVE_AFTER_DAYS);
    const cutoffDateStr = cutoff.toISOString().slice(0, 10);

    const snapshot = await db
      .collection("trips")
      .where("status", "==", "ended")
      .where("date", "<=", cutoffDateStr)
      .get();

    if (snapshot.empty) {
      logger.info("archiveEndedTrips: 無符合封存條件的行程");
      return;
    }

    const now = new Date().toISOString();
    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.update(doc.ref, { status: "archived", archivedAt: now });
      batch.create(db.collection("auditLogs").doc(), {
        actorUid: "system",
        actorEmail: null,
        action: "trip.archive",
        tripId: doc.id,
        targetType: "trip",
        targetId: doc.id,
        detail: { reason: "180 天自動封存排程" },
        timestamp: now,
      });
    }
    await batch.commit();
    logger.info(`archiveEndedTrips: 已封存 ${snapshot.size} 個行程`);
  },
);
