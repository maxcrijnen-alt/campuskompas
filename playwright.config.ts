import {defineConfig,devices} from '@playwright/test';
import {loadTestEnv} from './scripts/test-env';
loadTestEnv();
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,workers:1,timeout:60000,expect:{timeout:12000},use:{baseURL:'http://127.0.0.1:3000',trace:'retain-on-failure',screenshot:'only-on-failure'},projects:[{name:'chromium',use:{...devices['Desktop Chrome'],channel:process.env.PLAYWRIGHT_CHANNEL}}],reporter:[['list'],['html',{open:'never'}]]});
