import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export type { Dayjs };

export function now(): Dayjs {
  return dayjs();
}

export function toDayJS(iso: string, format?: string): Dayjs {
  const d = format ? dayjs(iso, format, true) : dayjs(iso);
  if (!d.isValid()) {
    throw new Error(`Invalid date string: ${iso}`);
  }
  return d;
}

export function backupStamp(d: Dayjs = now()): string {
  return d.format("YYYY-MM-DD_HH:mm:ss");
}

const backupStampPattern = /^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}$/;

export function isBackupStamp(value: string): boolean {
  return backupStampPattern.test(value);
}
