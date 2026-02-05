import { DdayStats, DdayItem, calculateDday, formatDday, CATEGORIES } from '../hooks/useDdayState';

interface DdayAnalyticsProps {
  stats: DdayStats;
  items: DdayItem[];
  unlocked: boolean;
  onUnlock: () => void;
}

export function DdayAnalytics({ stats, items, unlocked, onUnlock }: DdayAnalyticsProps) {
  const pastItems = items.filter(item => calculateDday(item.targetDate) > 0);
  const monthCounts: Record<string, number> = {};
  items.forEach(item => {
    const month = item.targetDate.substring(0, 7); // YYYY-MM
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  return (
    <div className="analytics-section">
      <h2 className="section-title">D-Day 분석</h2>

      {/* Free Section */}
      <div className="analytics-free">
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
      </div>

      {/* Locked Section */}
      <div className={`analytics-locked ${unlocked ? 'unlocked' : ''}`}>
        <h3 className="analytics-subtitle">
          상세 분석
          {!unlocked && <span className="locked-badge"><i className="ri-lock-line"></i></span>}
        </h3>

        <div className={!unlocked ? 'blurred-content' : ''}>
          {/* Past D-Day Analysis */}
          <div className="analytics-past">
            <h4 className="analytics-label">지난 D-Day 분석</h4>
            {pastItems.length > 0 ? (
              <div className="past-list">
                {pastItems.slice(0, 5).map(item => (
                  <div key={item.id} className="past-item">
                    <span className="past-item-title">{item.title}</span>
                    <span className="past-item-dday">{formatDday(calculateDday(item.targetDate))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="analytics-empty">지난 D-Day가 없습니다</p>
            )}
          </div>

          {/* D-Day Heatmap */}
          <div className="analytics-heatmap">
            <h4 className="analytics-label">월별 D-Day 히트맵</h4>
            <div className="heatmap-grid">
              {Object.entries(monthCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-6)
                .map(([month, count]) => (
                  <div key={month} className="heatmap-cell">
                    <div
                      className="heatmap-block"
                      style={{ opacity: Math.min(0.3 + count * 0.2, 1) }}
                    />
                    <span className="heatmap-label">{month.substring(5)}월</span>
                    <span className="heatmap-count">{count}개</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {!unlocked && (
          <div className="unlock-section">
            <button className="unlock-btn" onClick={onUnlock}>
              <i className="ri-lock-unlock-line"></i>
              상세 분석 보기
              <span className="ad-badge">AD</span>
            </button>
            <p className="ad-notice">광고 시청 후 자세한 D-Day 분석을 확인할 수 있어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
