/**
 * 2026年11月時点で14歳。毎年12月1日（日本時間）に1歳加算する。
 */
export function getAge(date = new Date()) {
  const year = date.getFullYear();
  const hasReachedDecember = date.getMonth() >= 11;
  return 14 + (year - 2026) + (hasReachedDecember ? 1 : 0);
}
