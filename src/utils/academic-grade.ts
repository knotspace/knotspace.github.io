/**
 * 2026年度を中学3年生として、毎年4月1日に進級させる。
 * 高校卒業後の進路は推測しない。
 */
export function getAcademicGrade(date = new Date()) {
  const year = date.getFullYear();
  const academicYear = date.getMonth() >= 3 ? year : year - 1;
  const elapsed = academicYear - 2026;
  const stages = [
    { level: '中学', grade: 3 },
    { level: '高校', grade: 1 },
    { level: '高校', grade: 2 },
    { level: '高校', grade: 3 },
  ];
  const current = stages[elapsed];
  if (!current) return { label: elapsed > 3 ? '高校卒業後' : '中学3年生', academicYear };
  return { label: current.level + current.grade + '年生', academicYear };
}
