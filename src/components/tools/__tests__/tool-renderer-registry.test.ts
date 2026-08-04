import { getAllTools } from '@/lib/tools/registry';
import { RENDERABLE_TOOL_SLUGS } from '../ToolRenderer';

/**
 * Drift guard between the tool registry and the renderer's import map.
 *
 * Adding a tool takes two edits in two files. Only the registry feeds
 * `generateStaticParams` and `sitemap.ts`, so registering a tool without
 * wiring it into `ToolRenderer`'s `toolMap` publishes `/tools/<slug>` to
 * Google as a 200 page whose body renders nothing — a soft 404. The reverse
 * (implemented but unregistered) is dead code that no route can reach.
 *
 * If this test fails, you added a tool to one file and not the other.
 */
describe('tool registry ↔ renderer', () => {
  it('every registered tool can actually be rendered', () => {
    const registered = getAllTools().map(t => t.slug);
    const missing = registered.filter(
      slug => !RENDERABLE_TOOL_SLUGS.includes(slug)
    );

    expect(missing).toEqual([]);
  });

  it('every renderable tool is registered', () => {
    const registered = getAllTools().map(t => t.slug);
    const orphaned = RENDERABLE_TOOL_SLUGS.filter(
      slug => !registered.includes(slug)
    );

    expect(orphaned).toEqual([]);
  });
});
