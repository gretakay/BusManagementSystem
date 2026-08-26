"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { canAccessBus, getAssignedBusIds, isTripSuperLead } from "@/types/role";

export function useTripAccess(tripId: string) {
  const { role, user } = useAuth();

  return useMemo(
    () => ({
      uid: user?.uid ?? null,
      isSuperLead: isTripSuperLead(role, tripId),
      assignedBusIds: getAssignedBusIds(role, tripId),
      canAccessBus: (busId: string) => canAccessBus(role, tripId, busId),
    }),
    [role, tripId, user?.uid],
  );
}
