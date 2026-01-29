/**
 * 디데이메이트 메인 페이지
 */

import { createRoute } from '@granite-js/react-native';
import { DdayCalculator } from '../src/components';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: DdayCalculatorPage,
});

export function DdayCalculatorPage() {
  return <DdayCalculator />;
}
