import type { HealthResponse } from '../types/health.js';

export const getHealthStatus = (): HealthResponse => ({
  status: 'ok',
  uptime: Number(process.uptime().toFixed(2)),
  timestamp: new Date().toISOString(),
});
