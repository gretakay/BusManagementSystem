import { useState } from "react";
import {
  onSnapshot,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  type Query,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

export const DEFAULT_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

/**
 * 新裝置(尚未建立本地 IndexedDB 快取)第一次開啟 Firestore 監聽連線時偶爾會短暫失敗;
 * 沒有重試的話畫面會卡住或誤把「監聽失敗」當成「真的沒有資料」。
 * 這裡用跟 roles/{uid} 監聽(見 AuthProvider)一樣的指數退避重試,重試耗盡才呼叫 onGiveUp。
 */
export function onSnapshotWithRetry<T = DocumentData>(
  ref: DocumentReference<T>,
  onNext: (snap: DocumentSnapshot<T>) => void,
  onGiveUp?: (error: FirestoreError) => void,
  retryDelaysMs?: number[],
): Unsubscribe;
export function onSnapshotWithRetry<T = DocumentData>(
  ref: Query<T>,
  onNext: (snap: QuerySnapshot<T>) => void,
  onGiveUp?: (error: FirestoreError) => void,
  retryDelaysMs?: number[],
): Unsubscribe;
export function onSnapshotWithRetry(
  ref: DocumentReference<any> | Query<any>,
  onNext: (snap: any) => void,
  onGiveUp?: (error: FirestoreError) => void,
  retryDelaysMs: number[] = DEFAULT_RETRY_DELAYS_MS,
): Unsubscribe {
  let cancelled = false;
  let unsub: Unsubscribe | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  function subscribe(attempt: number) {
    unsub = onSnapshot(
      ref as any,
      (snap: any) => {
        if (cancelled) return;
        onNext(snap);
      },
      (err: FirestoreError) => {
        if (cancelled) return;
        console.error("onSnapshot listener failed", err);
        if (attempt < retryDelaysMs.length) {
          retryTimer = setTimeout(() => {
            if (cancelled) return;
            subscribe(attempt + 1);
          }, retryDelaysMs[attempt]);
        } else {
          onGiveUp?.(err);
        }
      },
    );
  }

  subscribe(0);

  return () => {
    cancelled = true;
    unsub?.();
    if (retryTimer) clearTimeout(retryTimer);
  };
}

/** 監聽重試耗盡後,提供一個「手動重試」的 token:token 變動會讓依賴它的 useEffect 重新訂閱。 */
export function useRetryToken(): [number, () => void] {
  const [token, setToken] = useState(0);
  return [token, () => setToken((n) => n + 1)];
}
