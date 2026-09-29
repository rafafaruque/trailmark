import { timestampSchema } from "../sources/normalize";

export interface DeadlineCalculation {
  triggerTime: string;
  periodHours: number;
  deadline: string;
  timezone: string;
  deadlineLabel: string;
  triggerLabel: string;
  hoursRemaining: number;
  overdue: boolean;
}

export function formatProjectTime(iso: string, timezone = "America/New_York") {
  timestampSchema.parse(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace("Sep ", "Sept ")
    .replace(" at ", ", ");
}

/** Elapsed hours: no hidden business-day or weekend extension, and no model arithmetic. */
export function calculateDeadline(
  triggerTime: string,
  periodHours: number,
  timezone: string,
  asOf: string,
): DeadlineCalculation {
  timestampSchema.parse(triggerTime);
  timestampSchema.parse(asOf);
  if (
    !Number.isSafeInteger(periodHours) ||
    periodHours <= 0 ||
    periodHours > 8760
  )
    throw new Error(
      "Notice period must be positive whole elapsed hours, at most one year",
    );
  const deadline = new Date(
    Date.parse(triggerTime) + periodHours * 60 * 60 * 1000,
  ).toISOString();
  const remaining = (Date.parse(deadline) - Date.parse(asOf)) / 3600000;
  return {
    triggerTime,
    periodHours,
    deadline,
    timezone,
    deadlineLabel: formatProjectTime(deadline, timezone),
    triggerLabel: formatProjectTime(triggerTime, timezone),
    hoursRemaining: Math.ceil(remaining),
    overdue: remaining < 0,
  };
}
