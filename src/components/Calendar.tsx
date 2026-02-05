import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  getItemsForMonth: (year: number, month: number) => Set<number>;
}

export function Calendar({ selectedDate, onSelectDate, getItemsForMonth }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selected = parseISO(selectedDate);

  const daysWithDday = useMemo(() => {
    return getItemsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, getItemsForMonth]);

  const renderDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;
      const dayNum = parseInt(format(day, 'd'), 10);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isSelected = isSameDay(day, selected);
      const isTodayDate = isToday(day);
      const hasDday = isCurrentMonth && daysWithDday.has(dayNum);

      const classNames = [
        'calendar-day',
        !isCurrentMonth && 'other-month',
        isTodayDate && 'today',
        isSelected && 'selected',
        hasDday && 'has-dday',
      ].filter(Boolean).join(' ');

      days.push(
        <button
          key={day.toString()}
          className={classNames}
          onClick={() => {
            if (isCurrentMonth) {
              onSelectDate(format(currentDay, 'yyyy-MM-dd'));
            }
          }}
        >
          {format(day, 'd')}
        </button>
      );

      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth, selected, daysWithDday, onSelectDate]);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onSelectDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <span className="calendar-month">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        <div className="calendar-nav">
          <button onClick={goToPreviousMonth}>
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <button onClick={goToToday} style={{ fontSize: '14px', padding: '8px 12px' }}>
            오늘
          </button>
          <button onClick={goToNextMonth}>
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <span key={day} className="calendar-weekday">
            {day}
          </span>
        ))}
      </div>

      <div className="calendar-days">
        {renderDays}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          날짜를 선택하면 해당 날짜로 D-Day를 추가할 수 있습니다
        </p>
      </div>
    </div>
  );
}
