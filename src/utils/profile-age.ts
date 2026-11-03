/**
 * 2026年11月時点で14歳・中学3年生。
 * 毎年12月1日（日本時間）に年齢と学年を1年進める。
 */
function getYearsSinceDecember2026(date = new Date()) {
  return date.getFullYear() - 2026 + (date.getMonth() >= 11 ? 1 : 0);
}

export function getAge(date = new Date()) {
  return 14 + getYearsSinceDecember2026(date);
}

export function getGrade(date = new Date()) {
  const step = getYearsSinceDecember2026(date);
  if (step === 0) return '中3';
  if (step <= 3) return `高${step}`;
  return `大学${step - 3}`;
}

export function getProfileStatus(date = new Date()) {
  return { age: getAge(date), grade: getGrade(date) };
}
