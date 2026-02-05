import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface DdayItem {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  category?: string;
  goalAmount?: number;
  savedAmount?: number;
  createdAt: string;
}

export interface SavingsInfo {
  goalAmount: number;
  savedAmount: number;
  remainingAmount: number;
  daysLeft: number;
  dailySuggestion: number;
  weeklySuggestion: number;
  monthlySuggestion: number;
  progressPercent: number;
}

export const calculateSavings = (item: DdayItem): SavingsInfo | null => {
  if (!item.goalAmount || item.goalAmount <= 0) return null;

  const dday = calculateDday(item.targetDate);
  const daysLeft = dday < 0 ? Math.abs(dday) : 0;
  const savedAmount = item.savedAmount || 0;
  const remainingAmount = Math.max(0, item.goalAmount - savedAmount);
  const progressPercent = Math.min(100, Math.round((savedAmount / item.goalAmount) * 100));

  return {
    goalAmount: item.goalAmount,
    savedAmount,
    remainingAmount,
    daysLeft,
    dailySuggestion: daysLeft > 0 ? Math.ceil(remainingAmount / daysLeft) : 0,
    weeklySuggestion: daysLeft > 7 ? Math.ceil(remainingAmount / Math.ceil(daysLeft / 7)) : remainingAmount,
    monthlySuggestion: daysLeft > 30 ? Math.ceil(remainingAmount / Math.ceil(daysLeft / 30)) : remainingAmount,
    progressPercent,
  };
};

export interface DdayStats {
  totalDdays: number;
  upcomingDdays: number;
  pastDdays: number;
  todayDdays: number;
  categoryBreakdown: Record<string, number>;
  nearestDday: DdayItem | null;
  longestRunning: DdayItem | null;
}

export interface MilestoneItem {
  sourceItem: DdayItem;
  milestoneName: string;
  milestoneDate: string;
  daysUntil: number;
}

const STORAGE_KEY = 'DDAY_MATE_ITEMS';

const loadItems = (): DdayItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveItems = (items: DdayItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('D-Day 저장 실패:', error);
  }
};

/**
 * D-Day 계산 (오늘 기준)
 * 양수: D+N (지난 날짜)
 * 음수: D-N (다가오는 날짜)
 * 0: D-Day
 */
export const calculateDday = (targetDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return 0;
  target.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * D-Day 문자열 포맷
 */
export const formatDday = (days: number): string => {
  if (days === 0) {
    return 'D-Day';
  } else if (days > 0) {
    return `D+${days}`;
  } else {
    return `D${days}`;
  }
};

/**
 * 두 날짜 사이의 일수 계산
 */
export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * 날짜를 한국어 형식으로 포맷
 */
export const formatDateKorean = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'yyyy년 M월 d일', { locale: ko });
  } catch {
    return dateString;
  }
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export const formatDateISO = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getTodayISO = (): string => {
  return formatDateISO(new Date());
};

/**
 * 요일 반환
 */
export const getDayOfWeek = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return format(date, 'E', { locale: ko });
  } catch {
    return '';
  }
};

/**
 * 고유 ID 생성
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const MILESTONE_DAYS = [100, 200, 300, 365, 500, 730, 1000, 1095];
const MILESTONE_NAMES: Record<number, string> = {
  100: '100일',
  200: '200일',
  300: '300일',
  365: '1주년',
  500: '500일',
  730: '2주년',
  1000: '1000일',
  1095: '3주년',
};

export const calculateMilestones = (items: DdayItem[]): MilestoneItem[] => {
  const milestones: MilestoneItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  items.forEach(item => {
    const targetDate = new Date(item.targetDate);
    targetDate.setHours(0, 0, 0, 0);

    MILESTONE_DAYS.forEach(days => {
      const milestoneDate = addDays(targetDate, days);

      const daysUntil = Math.round(
        (milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only show upcoming milestones within 365 days
      if (daysUntil > 0 && daysUntil <= 365) {
        milestones.push({
          sourceItem: item,
          milestoneName: MILESTONE_NAMES[days],
          milestoneDate: formatDateISO(milestoneDate),
          daysUntil,
        });
      }
    });
  });

  milestones.sort((a, b) => a.daysUntil - b.daysUntil);
  return milestones;
};

export const useDdayState = () => {
  const [items, setItems] = useState<DdayItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveItems(items);
    }
  }, [items, isLoaded]);

  const addItem = useCallback((title: string, targetDate: string, category?: string, goalAmount?: number) => {
    const newItem: DdayItem = {
      id: generateId(),
      title: title.trim(),
      targetDate,
      category,
      goalAmount: goalAmount && goalAmount > 0 ? goalAmount : undefined,
      savedAmount: 0,
      createdAt: new Date().toISOString(),
    };

    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<DdayItem, 'id' | 'createdAt'>>) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, ...updates }
        : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const getItemById = useCallback((id: string): DdayItem | undefined => {
    return items.find(item => item.id === id);
  }, [items]);

  // D-Day 목록 정렬 (가까운 날짜순)
  const getSortedItems = useCallback((): DdayItem[] => {
    return [...items].sort((a, b) => {
      const ddayA = Math.abs(calculateDday(a.targetDate));
      const ddayB = Math.abs(calculateDday(b.targetDate));
      return ddayA - ddayB;
    });
  }, [items]);

  // 특정 월의 D-Day 목록
  const getItemsForMonth = useCallback((year: number, month: number): Set<number> => {
    const daysWithDday = new Set<number>();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    items.forEach(item => {
      if (item.targetDate.startsWith(monthStr)) {
        const day = parseInt(item.targetDate.split('-')[2], 10);
        daysWithDday.add(day);
      }
    });

    return daysWithDday;
  }, [items]);

  // 다가오는 D-Day 목록
  const getUpcomingItems = useCallback((): DdayItem[] => {
    return items
      .filter(item => calculateDday(item.targetDate) < 0)
      .sort((a, b) => Math.abs(calculateDday(a.targetDate)) - Math.abs(calculateDday(b.targetDate)));
  }, [items]);

  // 지난 D-Day 목록
  const getPastItems = useCallback((): DdayItem[] => {
    return items
      .filter(item => calculateDday(item.targetDate) > 0)
      .sort((a, b) => calculateDday(a.targetDate) - calculateDday(b.targetDate));
  }, [items]);

  // 기념일 마일스톤
  const getMilestones = useCallback((): MilestoneItem[] => {
    return calculateMilestones(items);
  }, [items]);

  // 통계 계산
  const calculateStats = useCallback((): DdayStats => {
    const categoryBreakdown: Record<string, number> = {};
    let nearestDday: DdayItem | null = null;
    let nearestDist = Infinity;
    let longestRunning: DdayItem | null = null;
    let longestDays = 0;

    const stats: DdayStats = {
      totalDdays: items.length,
      upcomingDdays: 0,
      pastDdays: 0,
      todayDdays: 0,
      categoryBreakdown,
      nearestDday: null,
      longestRunning: null,
    };

    items.forEach(item => {
      const dday = calculateDday(item.targetDate);
      if (dday === 0) {
        stats.todayDdays++;
      } else if (dday < 0) {
        stats.upcomingDdays++;
        const dist = Math.abs(dday);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestDday = item;
        }
      } else {
        stats.pastDdays++;
        if (dday > longestDays) {
          longestDays = dday;
          longestRunning = item;
        }
      }

      const cat = item.category || 'etc';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    stats.nearestDday = nearestDday;
    stats.longestRunning = longestRunning;

    return stats;
  }, [items]);

  return {
    items,
    isLoaded,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getSortedItems,
    getItemsForMonth,
    getUpcomingItems,
    getPastItems,
    getMilestones,
    calculateStats,
  };
};

// 카테고리 목록
export const CATEGORIES = [
  { id: 'anniversary', name: '기념일', icon: 'ri-heart-line' },
  { id: 'birthday', name: '생일', icon: 'ri-cake-2-line' },
  { id: 'exam', name: '시험', icon: 'ri-file-text-line' },
  { id: 'travel', name: '여행', icon: 'ri-plane-line' },
  { id: 'work', name: '업무', icon: 'ri-briefcase-line' },
  { id: 'etc', name: '기타', icon: 'ri-calendar-line' },
];
