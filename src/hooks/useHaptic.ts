/**
 * 햅틱 피드백 유틸리티
 */

import { generateHapticFeedback } from '@apps-in-toss/framework';

export const haptic = {
  tap: () => {
    try {
      generateHapticFeedback({ type: 'light' });
    } catch {}
  },
  medium: () => {
    try {
      generateHapticFeedback({ type: 'medium' });
    } catch {}
  },
  heavy: () => {
    try {
      generateHapticFeedback({ type: 'heavy' });
    } catch {}
  },
  success: () => {
    try {
      generateHapticFeedback({ type: 'success' });
    } catch {}
  },
  warning: () => {
    try {
      generateHapticFeedback({ type: 'warning' });
    } catch {}
  },
  error: () => {
    try {
      generateHapticFeedback({ type: 'error' });
    } catch {}
  },
};
