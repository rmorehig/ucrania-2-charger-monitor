import { DurableObject } from 'cloudflare:workers';

const SITE_ORIGIN = 'https://ucrania-2-cargador.rafamoreno.chatgpt.site';
const INTERVAL_MS = 30_000;

function poller(env) {
  return env.POLLER.getByName('ucrania-2');
}

export class ChargerPoller extends DurableObject {
  async ensureStarted() {
    if (await this.ctx.storage.getAlarm() === null) {
      await this.ctx.storage.setAlarm(Date.now() + INTERVAL_MS);
    }
  }

  async alarm() {
    // Arm the next check first, so a failed source request cannot stop monitoring.
    await this.ctx.storage.setAlarm(Date.now() + INTERVAL_MS);
    const at = new Date().toISOString();
    try {
      if (!this.env.MONITOR_TOKEN) throw new Error('Monitor token is not configured');
      const response = await fetch(`${SITE_ORIGIN}/api/monitor`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.env.MONITOR_TOKEN}` },
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`Site monitor returned HTTP ${response.status}`);
      const result = await response.json();
      if (result.checked !== true) throw new Error('Site monitor did not confirm a check');
      await this.ctx.storage.put('lastSuccess', {
        at,
        changes: result.changes,
        delivered: result.delivered,
        failed: result.failed,
      });
      await this.ctx.storage.delete('lastError');
    } catch (error) {
      await this.ctx.storage.put('lastError', {
        at,
        message: error instanceof Error ? error.message : 'Unknown poll error',
      });
    }
  }

  async health() {
    const [nextAlarmAt, lastSuccess, lastError] = await Promise.all([
      this.ctx.storage.getAlarm(),
      this.ctx.storage.get('lastSuccess'),
      this.ctx.storage.get('lastError'),
    ]);
    return { intervalSeconds: 30, nextAlarmAt: nextAlarmAt ? new Date(nextAlarmAt).toISOString() : null, lastSuccess: lastSuccess || null, lastError: lastError || null };
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/health' || request.method !== 'GET') {
      return new Response('Not found', { status: 404 });
    }
    const state = await poller(env).health();
    return Response.json(state, { headers: { 'cache-control': 'no-store' } });
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(poller(env).ensureStarted());
  },
};
