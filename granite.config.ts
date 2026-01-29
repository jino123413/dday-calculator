import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'dday-calculator',
  plugins: [
    appsInToss({
      brand: {
        displayName: '디데이메이트',
        primaryColor: '#7C3AED',
        icon: 'https://raw.githubusercontent.com/jino123413/app-logos/master/dday-calculator.png',
        bridgeColorMode: 'basic',
      },
      permissions: [],
    }),
    router(),
    hermes(),
  ],
});
