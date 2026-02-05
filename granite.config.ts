import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ddaymate',
  web: {
    host: '0.0.0.0',
    port: 3001,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  brand: {
    displayName: '하루모아',
    icon: 'https://raw.githubusercontent.com/jino123413/app-logos/master/dday-calculator.png',
    primaryColor: '#7C3AED',
    bridgeColorMode: 'basic',
  },
  webViewProps: {
    type: 'partner',
  },
});
