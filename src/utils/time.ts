export function now(): Date {
  return new Date();
}

export function parseStamp(stamp: string): Date {
  const parts = stamp.split(/[-_:]/).map(Number);
  if (parts.length !== 6 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid timestamp: ${stamp}`);
  }
  const [year, month, day, hour, min, sec] = parts;
  const d = new Date(year, month - 1, day, hour, min, sec);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid timestamp: ${stamp}`);
  }
  return d;
}

export function parseDate(value: string): Date {
  if (value.includes("_")) {
    return parseStamp(value);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date string: ${value}`);
  }
  return d;
}

export function backupStamp(d: Date = now()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
}

const backupStampPattern = /^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}$/;

export function isBackupStamp(value: string): boolean {
  return backupStampPattern.test(value);
}
