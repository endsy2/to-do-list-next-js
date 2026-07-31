"use client";

import { useHydrated } from "@/shared/hooks/useHydrated";
import { formatAbsoluteTime, formatRelativeTime } from "@/shared/format";

type RelativeTimeProps = {
  isoDate: string;
  className?: string;
};

export function RelativeTime({ isoDate, className }: RelativeTimeProps) {
  const isHydrated = useHydrated();

  return (
    <time
      dateTime={isoDate}
      title={isHydrated ? formatAbsoluteTime(isoDate) : undefined}
      className={className}
    >
      {isHydrated ? formatRelativeTime(isoDate) : ""}
    </time>
  );
}
