/**
 * 날짜 계산 유틸리티
 */

export interface DdayItem {
  id: string;
  title: string;
  targetDate: string; // ISO string
  createdAt: string;
}

/**
 * D-Day 계산 (오늘 기준)
 * 양수: D+N (지난 날짜)
 * 음수: D-N (다가오는 날짜)
 * 0: D-Day
 */
export function calculateDday(targetDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * D-Day 문자열 포맷
 */
export function formatDday(days: number): string {
  if (days === 0) {
    return 'D-Day';
  } else if (days > 0) {
    return `D+${days}`;
  } else {
    return `D${days}`;
  }
}

/**
 * 두 날짜 사이의 일수 계산
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 날짜를 한국어 형식으로 포맷
 */
export function formatDateKorean(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

/**
 * 요일 반환
 */
export function getDayOfWeek(dateString: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateString);
  return days[date.getDay()];
}

/**
 * 고유 ID 생성
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
