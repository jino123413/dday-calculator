import { useState } from 'react';
import { DdayItem, calculateDday, formatDday, formatDateKorean, getDayOfWeek, calculateSavings, CATEGORIES } from '../hooks/useDdayState';

interface DdayDetailModalProps {
  item: DdayItem;
  onClose: () => void;
  onDelete: (id: string) => void;
  onExportCard: (item: DdayItem) => void;
  onUpdateSaved: (id: string, amount: number) => void;
}

const formatMoney = (n: number) => n.toLocaleString('ko-KR');

export function DdayDetailModal({ item, onClose, onDelete, onExportCard, onUpdateSaved }: DdayDetailModalProps) {
  const dday = calculateDday(item.targetDate);
  const ddayText = formatDday(dday);
  const absDays = Math.abs(dday);
  const years = Math.floor(absDays / 365);
  const months = Math.floor((absDays % 365) / 30);
  const weeks = Math.floor(absDays / 7);
  const category = CATEGORIES.find(c => c.id === item.category);
  const savings = calculateSavings(item);

  const [editingSaved, setEditingSaved] = useState(false);
  const [savedInput, setSavedInput] = useState(String(item.savedAmount || 0));

  const handleSaveSaved = () => {
    const val = parseInt(savedInput.replace(/,/g, ''), 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateSaved(item.id, val);
    }
    setEditingSaved(false);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header">
          <button className="detail-close" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Main Info */}
        <div className="detail-main">
          {category && (
            <div className="detail-category">
              <i className={category.icon}></i>
              <span>{category.name}</span>
            </div>
          )}
          <h2 className="detail-title">{item.title}</h2>
          <p className="detail-dday-text">{ddayText}</p>
          <p className="detail-date">
            {formatDateKorean(item.targetDate)} ({getDayOfWeek(item.targetDate)})
          </p>
        </div>

        {/* Savings Goal Section */}
        {savings && (
          <div className="savings-section">
            <h3 className="savings-title">
              <i className="ri-money-won-circle-line"></i>
              목표 금액
            </h3>

            {/* Progress Bar */}
            <div className="savings-progress">
              <div className="savings-progress-header">
                <span className="savings-saved">{formatMoney(savings.savedAmount)}원</span>
                <span className="savings-goal">{formatMoney(savings.goalAmount)}원</span>
              </div>
              <div className="savings-bar-track">
                <div
                  className="savings-bar-fill"
                  style={{ width: `${savings.progressPercent}%` }}
                />
              </div>
              <p className="savings-percent">{savings.progressPercent}% 달성</p>
            </div>

            {/* Remaining & Suggestion */}
            {savings.daysLeft > 0 && savings.remainingAmount > 0 && (
              <div className="savings-breakdown">
                <div className="savings-row">
                  <span>남은 금액</span>
                  <strong>{formatMoney(savings.remainingAmount)}원</strong>
                </div>
                <div className="savings-row highlight">
                  <span>하루 저축 권장</span>
                  <strong>{formatMoney(savings.dailySuggestion)}원</strong>
                </div>
                {savings.daysLeft > 7 && (
                  <div className="savings-row">
                    <span>주간 저축 권장</span>
                    <strong>{formatMoney(savings.weeklySuggestion)}원</strong>
                  </div>
                )}
                {savings.daysLeft > 30 && (
                  <div className="savings-row">
                    <span>월간 저축 권장</span>
                    <strong>{formatMoney(savings.monthlySuggestion)}원</strong>
                  </div>
                )}
              </div>
            )}

            {savings.daysLeft === 0 && savings.remainingAmount > 0 && (
              <div className="savings-breakdown">
                <div className="savings-row">
                  <span>남은 금액</span>
                  <strong>{formatMoney(savings.remainingAmount)}원</strong>
                </div>
                <div className="savings-row" style={{ color: 'var(--warning)' }}>
                  <span>목표 기한이 지났습니다</span>
                </div>
              </div>
            )}

            {savings.remainingAmount === 0 && (
              <div className="savings-complete">
                <i className="ri-check-double-line"></i>
                <span>목표 금액을 달성했어요!</span>
              </div>
            )}

            {/* Update Saved Amount */}
            <div className="savings-update">
              {editingSaved ? (
                <div className="savings-edit-row">
                  <input
                    type="number"
                    className="savings-input"
                    value={savedInput}
                    onChange={e => setSavedInput(e.target.value)}
                    placeholder="저축한 금액"
                    autoFocus
                  />
                  <button className="savings-save-btn" onClick={handleSaveSaved}>
                    저장
                  </button>
                </div>
              ) : (
                <button className="savings-update-btn" onClick={() => {
                  setSavedInput(String(item.savedAmount || 0));
                  setEditingSaved(true);
                }}>
                  <i className="ri-edit-line"></i>
                  저축 현황 업데이트
                </button>
              )}
            </div>
          </div>
        )}

        {/* Date Analysis */}
        <div className="detail-analysis">
          <h3 className="detail-analysis-title">날짜 분석</h3>
          <div className="detail-analysis-grid">
            <div className="detail-analysis-item">
              <span className="detail-analysis-value">{absDays}</span>
              <span className="detail-analysis-label">일</span>
            </div>
            <div className="detail-analysis-item">
              <span className="detail-analysis-value">{weeks}</span>
              <span className="detail-analysis-label">주</span>
            </div>
            <div className="detail-analysis-item">
              <span className="detail-analysis-value">{months}</span>
              <span className="detail-analysis-label">개월</span>
            </div>
            <div className="detail-analysis-item">
              <span className="detail-analysis-value">{years}</span>
              <span className="detail-analysis-label">년</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="detail-actions">
          <button className="detail-action-btn export" onClick={() => onExportCard(item)}>
            <i className="ri-clipboard-line"></i>
            D-Day 정보 복사
            <span className="ad-badge">AD</span>
          </button>
          <button className="detail-action-btn delete" onClick={() => onDelete(item.id)}>
            <i className="ri-delete-bin-line"></i>
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
