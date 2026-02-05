import { useMemo } from 'react';
import {
  DdayStats,
  DdayItem,
  calculateDday,
  formatDday,
  formatDateKorean,
  CATEGORIES,
  generateInsights,
  getMonthlyDistribution,
  aggregateSavings,
} from '../hooks/useDdayState';

interface DdayAnalyticsProps {
  stats: DdayStats;
  items: DdayItem[];
  unlocked: boolean;
  onUnlock: () => void;
}

export function DdayAnalytics({ stats, items, unlocked, onUnlock }: DdayAnalyticsProps) {
  const insights = useMemo(() => generateInsights(items, stats), [items, stats]);
  const monthlyDist = useMemo(() => getMonthlyDistribution(items), [items]);
  const savingsAgg = useMemo(() => aggregateSavings(items), [items]);
  const maxMonthCount = useMemo(() => Math.max(...monthlyDist.map(m => m.count), 1), [monthlyDist]);

  const pastItems = items.filter(item => calculateDday(item.targetDate) > 0);

  // Timeline: sorted by date (past → future)
  const timelineItems = useMemo(() => {
    return [...items]
      .map(item => ({ ...item, dday: calculateDday(item.targetDate) }))
      .sort((a, b) => a.dday - b.dday)
      .slice(0, 8);
  }, [items]);

  return (
    <div className="analytics-section">
      <h2 className="section-title">D-Day 분석</h2>

      {/* ===== FREE SECTION ===== */}
      <div className="analytics-free">
        {/* Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-value">{stats.totalDdays}</p>
            <p className="stat-label">전체 D-Day</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.upcomingDdays}</p>
            <p className="stat-label">다가오는</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.pastDdays}</p>
            <p className="stat-label">지난</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.todayDdays}</p>
            <p className="stat-label">오늘 D-Day</p>
          </div>
        </div>

        {/* Category Distribution */}
        {Object.keys(stats.categoryBreakdown).length > 0 && (
          <div className="analytics-category">
            <h3 className="analytics-subtitle">카테고리 분포</h3>
            <div className="category-bars">
              {CATEGORIES.map(cat => {
                const count = stats.categoryBreakdown[cat.id] || 0;
                if (count === 0) return null;
                const percentage = stats.totalDdays > 0 ? (count / stats.totalDdays) * 100 : 0;
                return (
                  <div key={cat.id} className="category-bar-item">
                    <div className="category-bar-label">
                      <i className={cat.icon}></i>
                      <span>{cat.name}</span>
                      <span className="category-bar-count">{count}개</span>
                    </div>
                    <div className="category-bar-track">
                      <div
                        className="category-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nearest D-Day */}
        {stats.nearestDday && (
          <div className="analytics-nearest">
            <h3 className="analytics-subtitle">가장 가까운 D-Day</h3>
            <div className="nearest-card">
              <p className="nearest-title">{stats.nearestDday.title}</p>
              <p className="nearest-dday">{formatDday(calculateDday(stats.nearestDday.targetDate))}</p>
            </div>
          </div>
        )}

        {/* Insight preview (1개만 무료) */}
        {insights.length > 0 && (
          <div className="analytics-insight-preview">
            <h3 className="analytics-subtitle">
              <i className="ri-lightbulb-line"></i>
              인사이트
            </h3>
            <div className="insight-card">
              <i className={insights[0].icon}></i>
              <div className="insight-card-text">
                <span className="insight-label">{insights[0].label}</span>
                <span className="insight-value">{insights[0].value}</span>
              </div>
            </div>
            {insights.length > 1 && (
              <p className="insight-more-hint">
                +{insights.length - 1}개의 인사이트 더보기 <i className="ri-lock-line"></i>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ===== LOCKED SECTION ===== */}
      <div className={`analytics-locked ${unlocked ? 'unlocked' : ''}`}>
        <h3 className="analytics-subtitle">
          상세 분석
          {!unlocked && <span className="locked-badge"><i className="ri-lock-line"></i></span>}
        </h3>

        <div className={!unlocked ? 'blurred-content' : ''}>

          {/* Full Insights */}
          {insights.length > 1 && (
            <div className="analytics-insights-full">
              <h4 className="analytics-label">
                <i className="ri-lightbulb-line"></i>
                스마트 인사이트
              </h4>
              <div className="insights-grid">
                {insights.slice(1).map((ins, idx) => (
                  <div key={idx} className="insight-card">
                    <i className={ins.icon}></i>
                    <div className="insight-card-text">
                      <span className="insight-label">{ins.label}</span>
                      <span className="insight-value">{ins.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D-Day Timeline */}
          {timelineItems.length > 0 && (
            <div className="analytics-timeline">
              <h4 className="analytics-label">
                <i className="ri-git-commit-line"></i>
                D-Day 타임라인
              </h4>
              <div className="timeline-vertical">
                {timelineItems.map((item, idx) => {
                  const isPast = item.dday > 0;
                  const isToday = item.dday === 0;
                  return (
                    <div key={item.id} className={`timeline-row ${isPast ? 'past' : ''} ${isToday ? 'today' : ''}`}>
                      <div className="timeline-left">
                        <span className="timeline-dday-text">{formatDday(item.dday)}</span>
                      </div>
                      <div className="timeline-center">
                        <div className={`timeline-dot ${isPast ? 'past' : ''} ${isToday ? 'today' : ''}`} />
                        {idx < timelineItems.length - 1 && <div className="timeline-line" />}
                      </div>
                      <div className="timeline-right">
                        <span className="timeline-item-title">{item.title}</span>
                        <span className="timeline-item-date">{formatDateKorean(item.targetDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly Distribution Bar Chart */}
          <div className="analytics-monthly">
            <h4 className="analytics-label">
              <i className="ri-bar-chart-grouped-line"></i>
              월별 D-Day 분포
            </h4>
            <div className="monthly-chart">
              {monthlyDist.map(m => {
                const heightPct = m.count > 0 ? Math.max((m.count / maxMonthCount) * 100, 12) : 0;
                return (
                  <div key={m.month} className="monthly-bar-col">
                    <div className="monthly-bar-area">
                      {m.count > 0 && (
                        <div
                          className={`monthly-bar ${m.isCurrent ? 'current' : ''}`}
                          style={{ height: `${heightPct}%` }}
                        >
                          <span className="monthly-bar-count">{m.count}</span>
                        </div>
                      )}
                    </div>
                    <span className={`monthly-bar-label ${m.isCurrent ? 'current' : ''}`}>
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Savings Aggregation */}
          {savingsAgg && (
            <div className="analytics-savings">
              <h4 className="analytics-label">
                <i className="ri-money-won-circle-line"></i>
                저축 현황 종합
              </h4>
              <div className="savings-agg-card">
                <div className="savings-ring-wrap">
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="var(--border)" strokeWidth="8" />
                    <circle
                      cx="44" cy="44" r="36" fill="none"
                      stroke="var(--primary-color)" strokeWidth="8"
                      strokeDasharray={`${(savingsAgg.averageProgress / 100) * 226.2} 226.2`}
                      strokeLinecap="round"
                      transform="rotate(-90 44 44)"
                    />
                  </svg>
                  <span className="savings-ring-text">{savingsAgg.averageProgress}%</span>
                </div>
                <div className="savings-agg-details">
                  <div className="savings-agg-row">
                    <span className="savings-agg-label">목표 금액</span>
                    <span className="savings-agg-value">{savingsAgg.totalGoal.toLocaleString()}원</span>
                  </div>
                  <div className="savings-agg-row">
                    <span className="savings-agg-label">저축 금액</span>
                    <span className="savings-agg-value success">{savingsAgg.totalSaved.toLocaleString()}원</span>
                  </div>
                  <div className="savings-agg-row">
                    <span className="savings-agg-label">남은 금액</span>
                    <span className="savings-agg-value muted">{savingsAgg.totalRemaining.toLocaleString()}원</span>
                  </div>
                  <div className="savings-agg-row">
                    <span className="savings-agg-label">저축 목표</span>
                    <span className="savings-agg-value">{savingsAgg.itemsWithGoals}개</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Past D-Day Analysis */}
          <div className="analytics-past">
            <h4 className="analytics-label">
              <i className="ri-history-line"></i>
              지난 D-Day 기록
            </h4>
            {pastItems.length > 0 ? (
              <div className="past-list">
                {pastItems.slice(0, 10).map(item => (
                  <div key={item.id} className="past-item">
                    <div className="past-item-info">
                      <span className="past-item-title">{item.title}</span>
                      <span className="past-item-date">{formatDateKorean(item.targetDate)}</span>
                    </div>
                    <span className="past-item-dday">{formatDday(calculateDday(item.targetDate))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="analytics-empty">지난 D-Day가 없습니다</p>
            )}
          </div>
        </div>

        {/* Unlock Button */}
        {!unlocked && (
          <div className="unlock-section">
            <button className="unlock-btn" onClick={onUnlock}>
              <i className="ri-lock-unlock-line"></i>
              상세 분석 보기
              <span className="ad-badge">AD</span>
            </button>
            <p className="ad-notice">광고 시청 후 타임라인, 인사이트, 저축 분석을 확인할 수 있어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
