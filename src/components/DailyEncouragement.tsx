import { DdayItem, calculateDday } from '../hooks/useDdayState';

interface DailyEncouragementProps {
  items: DdayItem[];
  unlocked: boolean;
  onUnlock: () => void;
}

type DdayRange = 'far' | 'mid' | 'near' | 'soon' | 'today' | 'past' | 'none';

const MESSAGES: Record<DdayRange, string[]> = {
  far: [
    '아직 시간이 넉넉해 보이지만, 오늘의 한 걸음이 그날의 자신감이 됩니다.',
    '100일 뒤의 나는 지금의 나에게 고마워할 거예요.',
    '먼 미래처럼 느껴져도, 하루하루가 쌓이면 어느새 도착해 있어요.',
    '큰 목표는 작은 습관에서 시작돼요. 오늘의 작은 실천부터.',
    '마라톤의 초반이에요. 페이스 조절하며 꾸준히 가봐요.',
    '오늘 쉬어도 괜찮아요. 내일 다시 시작하면 되니까.',
    '지금은 씨앗을 심는 시간이에요. 열매는 반드시 맺힙니다.',
    '조급해하지 마세요. 꾸준함이 천재를 이깁니다.',
    '먼 길도 한 걸음부터. 오늘 그 한 걸음을 내디뎠나요?',
    '지금 이 순간에도 목표를 향해 가고 있다는 걸 기억하세요.',
  ],
  mid: [
    '한 달 안쪽으로 들어왔어요. 이제부터가 진짜입니다.',
    '절반을 넘겼어요. 여기서 멈추기엔 너무 아깝잖아요.',
    '남은 기간이 줄어들수록 집중력은 올라가요. 지금이 가속할 때!',
    '오늘의 노력이 그날의 여유가 됩니다.',
    '슬럼프가 올 수 있는 시기예요. 쉬어도 돼요, 멈추지만 마세요.',
    '불안한 건 그만큼 중요한 일이라는 뜻이에요.',
    '남들은 모르는 당신만의 노력을 저는 알고 있어요.',
    '속도가 느려도 괜찮아요. 방향이 맞으면 결국 도착해요.',
    '지금 힘든 만큼, 끝나고 나면 그만큼 뿌듯할 거예요.',
    '작은 성취를 쌓아가는 중이에요. 스스로를 칭찬해주세요.',
  ],
  near: [
    '카운트다운이 시작됐어요. 하루하루가 소중합니다.',
    '긴장되는 만큼 기대도 되지 않나요? 좋은 결과가 기다리고 있어요.',
    '마지막 스퍼트! 끝까지 달려봐요.',
    '지금까지 잘 해왔어요. 마지막까지 믿어보세요.',
    '곧 끝나요. 조금만 더 버텨보면 좋은 일이 있을 거예요.',
    '오늘의 집중이 내일의 성과를 만듭니다.',
    '거의 다 왔어요! 힘 빼지 말고 끝까지!',
    '지금 하고 있는 것들, 다 의미 있는 일이에요.',
    '눈앞에 보여요. 조금만 더 손을 뻗으면 닿아요.',
    '이 시간이 지나면, 해냈다는 기쁨만 남을 거예요.',
  ],
  soon: [
    '심호흡하고, 지금까지의 노력을 믿으세요.',
    '내일이면… 아니, 곧이에요! 떨리겠지만 분명 잘 해낼 거예요.',
    '마지막까지 최선을 다하는 당신, 이미 충분히 멋져요.',
    '긴장은 준비된 사람만 느끼는 감정이에요.',
    '컨디션 관리가 가장 중요한 시기입니다. 무리하지 마세요.',
    '이 순간이 지나면 해냈다는 뿌듯함만 남아요.',
    '지금 느끼는 설렘, 그게 바로 살아있다는 증거예요.',
    '오늘은 쉬면서 마음의 준비를 해보는 건 어때요?',
  ],
  today: [
    '드디어 오늘이에요! 그동안 고생 많았어요.',
    'D-Day! 지금까지 달려온 당신에게 박수를 보냅니다.',
    '오늘은 당신의 날이에요. 자신감 가지고 빛나세요!',
    '기다리던 그날이 왔어요! 후회 없이 즐기세요.',
    '모든 준비는 끝났어요. 이제 결과를 만들 시간입니다.',
    '오늘을 위해 달려왔잖아요. 최고의 하루 보내세요!',
  ],
  past: [
    '지나간 시간도 소중한 경험이에요. 다음 목표를 세워볼까요?',
    '하루하루가 쌓여 지금의 당신을 만들었어요.',
    '돌이켜보면 잘 해냈죠? 스스로를 칭찬해주세요.',
    '끝이 아니라 새로운 시작이에요. 다음 D-Day를 기대해봐요.',
    '지나고 나면 별거 아니었죠? 다음에도 분명 잘 해낼 거예요.',
    '경험이 쌓일수록 단단해져요. 다음엔 더 잘할 수 있어요.',
    '오늘의 추억이 내일의 원동력이 됩니다.',
    '한 챕터를 마무리했어요. 다음 이야기가 기다리고 있어요.',
  ],
  none: [
    '소중한 날을 기록하면 하루가 더 특별해져요.',
    '기대되는 날짜가 있으면 하루하루가 설레요.',
    '새로운 목표를 세워보세요. 매일이 달라질 거예요.',
    '특별한 날을 추가하고, 함께 카운트다운 해봐요.',
  ],
};

function getDdayRange(dday: number | null): DdayRange {
  if (dday === null) return 'none';
  if (dday === 0) return 'today';
  if (dday > 0) return 'past';
  const abs = Math.abs(dday);
  if (abs <= 6) return 'soon';
  if (abs <= 29) return 'near';
  if (abs <= 99) return 'mid';
  return 'far';
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function pickMessage(range: DdayRange): string {
  const messages = MESSAGES[range];
  const dayIndex = getDayOfYear();
  return messages[dayIndex % messages.length];
}

const RANGE_LABELS: Record<DdayRange, string> = {
  far: '아직 여유 있는 지금,',
  mid: '본격적으로 다가오는 중,',
  near: '카운트다운 시작,',
  soon: '거의 다 왔어요,',
  today: '바로 오늘!',
  past: '지나간 그날을 돌아보며,',
  none: '새로운 시작을 위해,',
};

export function DailyEncouragement({ items, unlocked, onUnlock }: DailyEncouragementProps) {
  // Find the most relevant D-Day
  const candidates = items
    .map(item => ({ item, dday: calculateDday(item.targetDate) }))
    .sort((a, b) => Math.abs(a.dday) - Math.abs(b.dday));

  const upcoming = candidates.find(c => c.dday <= 0);
  const target = upcoming || candidates[0] || null;

  const dday = target?.dday ?? null;
  const range = getDdayRange(dday);
  const message = pickMessage(range);
  const rangeLabel = RANGE_LABELS[range];

  return (
    <div className="encouragement-section">
      <div className="encouragement-header">
        <i className="ri-sparkling-2-line"></i>
        <span>오늘의 응원</span>
      </div>

      {target && (
        <p className="encouragement-context">
          <strong>{target.item.title}</strong> {rangeLabel}
        </p>
      )}

      {unlocked ? (
        <div className="encouragement-revealed">
          <p className="encouragement-message">{message}</p>
        </div>
      ) : (
        <>
          <div className="encouragement-blurred">
            <p className="encouragement-message-blur">{message}</p>
          </div>
          <button className="encouragement-unlock-btn" onClick={onUnlock}>
            <i className="ri-play-circle-line"></i>
            오늘의 응원 확인하기
            <span className="ad-badge">AD</span>
          </button>
          <p className="ad-notice">광고 시청 후 오늘의 응원 메시지를 확인할 수 있어요</p>
        </>
      )}
    </div>
  );
}
