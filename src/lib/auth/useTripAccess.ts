"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { canAccessBus, getAssignedBusIds, getBusGroupTag, isTripSuperLead } from "@/types/role";

export function useTripAccess(tripId: string) {
  const { role, user } = useAuth();

  return useMemo(
    () => ({
      uid: user?.uid ?? null,
      isSuperLead: isTripSuperLead(role, tripId),
      assignedBusIds: getAssignedBusIds(role, tripId),
      canAccessBus: (busId: string) => canAccessBus(role, tripId, busId),
      /** undefined = 整台車都看得到;有值表示只負責該組別(例如小客車車號) */
      getBusGroupTag: (busId: string) => getBusGroupTag(role, tripId, busId),
    }),
    [role, tripId, user?.uid],
  );
}
