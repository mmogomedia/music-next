/**
 * GA4 custom events.
 *
 * Until this existed the property only ever received automatic page_view hits,
 * so there was no way to tell whether search traffic actually converted —
 * signups, plays and tool completions were all invisible.
 *
 * Every event goes through `trackEvent` so that:
 *  - it no-ops safely when the GA tag isn't loaded (local dev, previews, or an
 *    ad blocker), instead of throwing inside a click handler;
 *  - event names stay in one place and can be diffed against the GA4 config.
 *
 * GA4 reserves some names and treats others specially — `sign_up`, `login` and
 * `search` are recommended events and are deliberately spelled Google's way so
 * they light up the standard reports.
 */
import { sendGAEvent } from '@next/third-parties/google';

export type AnalyticsEvent =
  | { name: 'sign_up'; params: { method: 'credentials' | 'google' } }
  | { name: 'login'; params: { method: 'credentials' | 'google' } }
  | { name: 'track_play'; params: { track_id: string; track_title: string } }
  | { name: 'tool_used'; params: { tool_slug: string; action: string } }
  | { name: 'guide_cta_click'; params: { guide_slug: string; cta: string } };

/** True when the GA tag is present on the page. */
function gaReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    Array.isArray((window as { dataLayer?: unknown[] }).dataLayer)
  );
}

export function trackEvent(event: AnalyticsEvent): void {
  if (!gaReady()) return;
  try {
    sendGAEvent('event', event.name, event.params);
  } catch {
    // Analytics must never break a user interaction.
  }
}
