import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5178',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    headless: true,
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run dev -- --host 127.0.0.1 --port 5178 --strictPort`,
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
  },
})
