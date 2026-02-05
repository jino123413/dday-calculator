import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useDdayState,
  calculateDday,
  calculateSavings,
  formatDday,
  formatDateKorean,
  getDayOfWeek,
  getTodayISO,
  calculateDaysBetween,
  CATEGORIES,
  DdayItem,
} from './hooks/useDdayState';
import { useInterstitialAd } from './hooks/useInterstitialAd';
import { Calendar } from './components/Calendar';
import { AnniversarySuggestions } from './components/AnniversarySuggestions';
import { DdayAnalytics } from './components/DdayAnalytics';
import { DailyEncouragement } from './components/DailyEncouragement';
import { DdayDetailModal } from './components/DdayDetailModal';

type Tab = 'list' | 'add' | 'between' | 'calendar' | 'analytics';

const UNLOCK_KEYS = {
  analytics: 'DDAY_UNLOCK_ANALYTICS',
  encouragement: 'DDAY_UNLOCK_ENCOURAGEMENT',
};

function isUnlockedToday(key: string): boolean {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return false;
    return stored === getTodayISO();
  } catch {
    return false;
  }
}

function setUnlockedToday(key: string): void {
  try {
    localStorage.setItem(key, getTodayISO());
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const {
    items,
    isLoaded,
    addItem,
    updateItem,
    deleteItem,
    getSortedItems,
    getItemsForMonth,
    getMilestones,
    calculateStats,
  } = useDdayState();

  const { showInterstitialAd } = useInterstitialAd();

  // Add form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(getTodayISO());
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [goalAmount, setGoalAmount] = useState('');

  // Between dates state
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getTodayISO());
  const [betweenResult, setBetweenResult] = useState<number | null>(null);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(getTodayISO());

  // Detail modal state
  const [detailItem, setDetailItem] = useState<DdayItem | null>(null);

  // Delete dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unlock state (daily reset via localStorage)
  const [analyticsUnlocked, setAnalyticsUnlocked] = useState(() => isUnlockedToday(UNLOCK_KEYS.analytics));
  const [encouragementUnlocked, setEncouragementUnlocked] = useState(() => isUnlockedToday(UNLOCK_KEYS.encouragement));

  const sortedItems = getSortedItems();
  const stats = calculateStats();
  const milestones = getMilestones();

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const handleAddDday = useCallback(() => {
    if (!newTitle.trim()) {
      showToast('제목을 입력해주세요');
      return;
    }

    const parsedGoal = goalAmount ? parseInt(goalAmount.replace(/,/g, ''), 10) : undefined;
    addItem(newTitle, newDate, selectedCategory, parsedGoal);
    setNewTitle('');
    setNewDate(getTodayISO());
    setSelectedCategory(undefined);
    setGoalAmount('');
    showToast('D-Day가 추가되었습니다');
    setActiveTab('list');
  }, [newTitle, newDate, selectedCategory, goalAmount, addItem, showToast]);

  const handleAddMilestone = useCallback((title: string, date: string, category?: string) => {
    addItem(title, date, category);
    showToast('기념일이 추가되었습니다');
  }, [addItem, showToast]);

  const handleCardTap = useCallback((item: DdayItem) => {
    setDetailItem(item);
  }, []);

  const handleDeleteConfirm = useCallback((id: string) => {
    setDeleteTargetId(id);
    setDialogOpen(true);
    setDetailItem(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (deleteTargetId) {
      deleteItem(deleteTargetId);
      showToast('삭제되었습니다');
    }
    setDialogOpen(false);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteItem, showToast]);

  const handleCalculateBetween = useCallback(() => {
    const days = calculateDaysBetween(startDate, endDate);
    setBetweenResult(days);
  }, [startDate, endDate]);

  // 날짜 변경 시 기간계산 결과 초기화
  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
    setBetweenResult(null);
  }, []);
  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
    setBetweenResult(null);
  }, []);

  const handleCalendarDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setNewDate(date);
    setActiveTab('add');
  }, []);

  const handleUpdateSaved = useCallback((id: string, amount: number) => {
    updateItem(id, { savedAmount: amount });
    // Refresh detail modal with updated item
    const updated = items.find(i => i.id === id);
    if (updated) {
      setDetailItem({ ...updated, savedAmount: amount });
    }
    showToast('저축 현황이 업데이트되었습니다');
  }, [updateItem, items, showToast]);

  // AD handlers for premium features
  const handleExportCard = useCallback((item: DdayItem) => {
    showInterstitialAd({
      onDismiss: () => {
        const dday = calculateDday(item.targetDate);
        const text = `${item.title}\n${formatDday(dday)}\n${formatDateKorean(item.targetDate)}\n\n하루모아`;
        if (!navigator.clipboard) {
          showToast('클립보드 기능을 사용할 수 없습니다');
          return;
        }
        navigator.clipboard.writeText(text).then(() => {
          showToast('D-Day 정보가 복사되었습니다');
        }).catch(() => {
          showToast('복사에 실패했습니다');
        });
      },
    });
  }, [showInterstitialAd, showToast]);

  const handleUnlockAnalytics = useCallback(() => {
    showInterstitialAd({
      onDismiss: () => {
        setAnalyticsUnlocked(true);
        setUnlockedToday(UNLOCK_KEYS.analytics);
        showToast('상세 분석이 잠금 해제되었습니다');
      },
    });
  }, [showInterstitialAd, showToast]);

  const handleUnlockEncouragement = useCallback(() => {
    showInterstitialAd({
      onDismiss: () => {
        setEncouragementUnlocked(true);
        setUnlockedToday(UNLOCK_KEYS.encouragement);
        showToast('오늘의 응원이 공개되었습니다');
      },
    });
  }, [showInterstitialAd, showToast]);

  // Preview D-Day
  const previewDday = useMemo(() => {
    try {
      return formatDday(calculateDday(newDate));
    } catch {
      return 'D-?';
    }
  }, [newDate]);

  if (!isLoaded) {
    return (
      <div className="app-container">
        <div className="loading">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="header-title">하루모아</h1>
          <p className="header-subtitle">
            {format(new Date(), 'M월 d일 EEEE', { locale: ko })}
          </p>
        </div>
        {stats.totalDdays > 0 && (
          <div className="stat-badge">
            <span>{stats.totalDdays}개의 D-Day</span>
          </div>
        )}
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        <button
          className={`tab-item ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          내 D-Day
        </button>
        <button
          className={`tab-item ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          추가하기
        </button>
        <button
          className={`tab-item ${activeTab === 'between' ? 'active' : ''}`}
          onClick={() => setActiveTab('between')}
        >
          기간 계산
        </button>
        <button
          className={`tab-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          캘린더
        </button>
        <button
          className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          분석
        </button>
      </nav>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
          {/* Daily Encouragement */}
          <DailyEncouragement
            items={items}
            unlocked={encouragementUnlocked}
            onUnlock={handleUnlockEncouragement}
          />

          {/* Anniversary Suggestions */}
          {milestones.length > 0 && (
            <AnniversarySuggestions
              milestones={milestones}
              onAddMilestone={handleAddMilestone}
            />
          )}

          <div className="list-section">
            {sortedItems.length === 0 ? (
              <div className="empty-container">
                <i className="ri-calendar-event-line empty-icon"></i>
                <p className="empty-text">등록된 D-Day가 없습니다</p>
                <p className="empty-subtext">
                  상단의 '추가하기' 탭에서<br />새로운 D-Day를 추가해보세요
                </p>
              </div>
            ) : (
              <>
                {sortedItems.map(item => {
                  const dday = calculateDday(item.targetDate);
                  const ddayText = formatDday(dday);
                  const isDday = dday === 0;
                  const isPast = dday > 0;
                  const savings = calculateSavings(item);

                  return (
                    <div
                      key={item.id}
                      className="dday-card"
                      onClick={() => handleCardTap(item)}
                    >
                      <div className="dday-card-left">
                        <p className="dday-title">{item.title}</p>
                        <p className="dday-date">
                          {formatDateKorean(item.targetDate)} ({getDayOfWeek(item.targetDate)})
                        </p>
                        {savings && (
                          <div className="dday-card-savings">
                            <div className="dday-card-savings-bar">
                              <div
                                className="dday-card-savings-fill"
                                style={{ width: `${savings.progressPercent}%` }}
                              />
                            </div>
                            <span className="dday-card-savings-text">
                              {savings.progressPercent}%{savings.daysLeft > 0 ? ` · 하루 ${savings.dailySuggestion.toLocaleString()}원` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`dday-badge ${isDday ? 'today' : ''} ${isPast ? 'past' : ''}`}>
                        <span className="dday-badge-text">{ddayText}</span>
                      </div>
                    </div>
                  );
                })}
                <p className="hint-text">카드를 탭하면 상세 정보를 볼 수 있습니다</p>
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'add' && (
        <div className="add-section">
          <div className="input-group">
            <label className="label">D-Day 제목</label>
            <input
              type="text"
              className="text-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예: 시험일, 생일, 기념일"
              maxLength={30}
            />
          </div>

          <div className="input-group">
            <label className="label">날짜 선택</label>
            <input
              type="date"
              className="text-input"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label">카테고리 (선택)</label>
            <div className="category-list">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-chip ${selectedCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === cat.id ? undefined : cat.id
                  )}
                  style={{
                    background: selectedCategory === cat.id ? 'var(--primary-light)' : undefined,
                    border: `1px solid ${selectedCategory === cat.id ? 'var(--primary-color)' : 'var(--border)'}`,
                  }}
                >
                  <i className={cat.icon}></i>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="label">목표 금액 (선택)</label>
            <div className="goal-input-wrapper">
              <input
                type="number"
                className="text-input"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="예: 1000000"
                min="0"
              />
              <span className="goal-input-suffix">원</span>
            </div>
            <p className="helper-text">목표 금액을 설정하면 하루 저축 권장 금액을 알려드려요</p>
          </div>

          <div className="preview-card">
            <p className="preview-label">미리보기</p>
            <p className="preview-title">{newTitle || '제목 없음'}</p>
            <p className="preview-date">
              {formatDateKorean(newDate)} ({getDayOfWeek(newDate)})
            </p>
            <p className="preview-dday">{previewDday}</p>
            {goalAmount && parseInt(goalAmount) > 0 && (
              <p className="preview-goal">
                <i className="ri-money-won-circle-line"></i>
                {' '}목표: {parseInt(goalAmount).toLocaleString()}원
              </p>
            )}
          </div>

          <button className="primary-btn" onClick={handleAddDday}>
            D-Day 추가하기
          </button>
        </div>
      )}

      {activeTab === 'between' && (
        <div className="between-section">
          <h2 className="section-title">두 날짜 사이 일수 계산</h2>

          <div className="input-group">
            <label className="label">시작일</label>
            <input
              type="date"
              className="text-input"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label">종료일</label>
            <input
              type="date"
              className="text-input"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>

          <button className="primary-btn" onClick={handleCalculateBetween}>
            계산하기
          </button>

          {betweenResult !== null && (
            <div className="result-card">
              <p className="result-label">계산 결과</p>
              <p className="result-value">{betweenResult.toLocaleString()}일</p>
              <p className="result-sub">
                {formatDateKorean(startDate)} ~ {formatDateKorean(endDate)}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={handleCalendarDateSelect}
          getItemsForMonth={getItemsForMonth}
        />
      )}

      {activeTab === 'analytics' && (
        <DdayAnalytics
          stats={stats}
          items={items}
          unlocked={analyticsUnlocked}
          onUnlock={handleUnlockAnalytics}
        />
      )}

      {/* Bottom Spacer */}
      <div className="bottom-spacer"></div>

      {/* Detail Modal */}
      {detailItem && (
        <DdayDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onDelete={handleDeleteConfirm}
          onExportCard={handleExportCard}
          onUpdateSaved={handleUpdateSaved}
        />
      )}

      {/* Delete Dialog */}
      {dialogOpen && (
        <div className="dialog-overlay" onClick={() => setDialogOpen(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <h3 className="dialog-title">삭제 확인</h3>
            <p className="dialog-description">이 D-Day를 삭제하시겠습니까?</p>
            <div className="dialog-buttons">
              <button className="dialog-btn cancel" onClick={() => setDialogOpen(false)}>
                취소
              </button>
              <button className="dialog-btn confirm" onClick={handleDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="toast">{toastMessage}</div>
      )}
    </div>
  );
}

export default App;
