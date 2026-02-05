import { MilestoneItem, formatDateKorean, getDayOfWeek } from '../hooks/useDdayState';

interface AnniversarySuggestionsProps {
  milestones: MilestoneItem[];
  onAddMilestone: (title: string, date: string, category?: string) => void;
}

export function AnniversarySuggestions({ milestones, onAddMilestone }: AnniversarySuggestionsProps) {
  if (milestones.length === 0) return null;

  return (
    <div className="suggestions-section">
      <div className="suggestions-header">
        <i className="ri-sparkle-line"></i>
        <span>다가오는 기념일</span>
      </div>
      <div className="suggestions-scroll">
        {milestones.slice(0, 10).map((milestone, index) => (
          <div key={`${milestone.sourceItem.id}-${milestone.milestoneName}-${index}`} className="suggestion-card">
            <div className="suggestion-badge">{milestone.milestoneName}</div>
            <p className="suggestion-source">{milestone.sourceItem.title}</p>
            <p className="suggestion-date">
              {formatDateKorean(milestone.milestoneDate)} ({getDayOfWeek(milestone.milestoneDate)})
            </p>
            <p className="suggestion-until">
              <strong>{milestone.daysUntil}일</strong> 남음
            </p>
            <button
              className="suggestion-add-btn"
              onClick={() =>
                onAddMilestone(
                  `${milestone.sourceItem.title} ${milestone.milestoneName}`,
                  milestone.milestoneDate,
                  milestone.sourceItem.category
                )
              }
            >
              <i className="ri-add-line"></i> 추가
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
