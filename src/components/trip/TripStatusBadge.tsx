import clsx from "clsx";
import type { TripStatus } from "@/types/trip";

const LABELS: Record<TripStatus, string> = {
  notStarted: "未開始",
  inProgress: "進行中",
  ended: "已結束",
  archived: "已封存",
};

const STYLES: Record<TripStatus, string> = {
  notStarted: "bg-gray-100 text-gray-600",
  inProgress: "bg-green-100 text-green-700",
  ended: "bg-amber-100 text-amber-700",
  archived: "bg-gray-200 text-gray-500",
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}
