/**
 * Official university grading scale — keep in sync with backend GradingScale.
 *
 * CGPA | Grade | Percentage
 * 4.00 | A+    | 90 and Above
 * 4.00 | A     | 86 and < 90
 * 3.67 | A-    | 82 and < 86
 * 3.33 | B+    | 78 and < 82
 * 3.00 | B     | 74 and < 78
 * 2.67 | B-    | 70 and < 74
 * 2.33 | C+    | 66 and < 70
 * 2.00 | C     | 62 and < 66
 * 1.67 | C-    | 58 and < 62
 * 1.33 | D+    | 54 and < 58
 * 1.00 | D     | 50 and < 54
 * 0.00 | F     | < 50
 */

export const GRADE_RANGES = [
  { grade: "A+", minPercentage: 90, gradePoints: 4.0 },
  { grade: "A", minPercentage: 86, gradePoints: 4.0 },
  { grade: "A-", minPercentage: 82, gradePoints: 3.67 },
  { grade: "B+", minPercentage: 78, gradePoints: 3.33 },
  { grade: "B", minPercentage: 74, gradePoints: 3.0 },
  { grade: "B-", minPercentage: 70, gradePoints: 2.67 },
  { grade: "C+", minPercentage: 66, gradePoints: 2.33 },
  { grade: "C", minPercentage: 62, gradePoints: 2.0 },
  { grade: "C-", minPercentage: 58, gradePoints: 1.67 },
  { grade: "D+", minPercentage: 54, gradePoints: 1.33 },
  { grade: "D", minPercentage: 50, gradePoints: 1.0 },
  { grade: "F", minPercentage: 0, gradePoints: 0.0 },
];

export function getGradeFromPercentage(percentage) {
  if (percentage === null || percentage === undefined || Number.isNaN(Number(percentage))) {
    return { grade: "F", gradePoints: 0 };
  }

  const numeric = Number(percentage);
  for (const range of GRADE_RANGES) {
    if (numeric >= range.minPercentage) {
      return { grade: range.grade, gradePoints: range.gradePoints };
    }
  }

  return { grade: "F", gradePoints: 0 };
}

export function getEstimatedGrade(percentage) {
  return getGradeFromPercentage(percentage).grade;
}
