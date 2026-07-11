/**
 * MCP site-profile tools — `get_site_profile` / `set_site_profile`.
 *
 * The editable site-level identity (homepage <title>, <meta description>,
 * tagline). Lets a connected AI client (the Pic-A-Site CMS) read + update how
 * the site presents itself; a set takes effect on the live homepage metadata
 * immediately (generateMetadata reads the same store).
 *
 * Scopes: `articles:read` (get) / `articles:write` (set) — reused so an
 * existing article-capable client can manage site meta without a new scope
 * grant. Registered only under contract v2.
 */
import { McpError } from '../auth';
import {
  GetSiteProfileInputSchema,
  SetSiteProfileInputSchema,
  type SetSiteProfileInput,
  type SiteProfileShape,
} from '../contract';
import { wrapTool, type ToolRegistrar } from './types';
import {
  getSiteProfile,
  updateSiteProfile,
} from '@/lib/services/site-profile-service';

export const registerSiteProfileTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'get_site_profile',
    {
      description:
        "Return the site's editable identity: `title` (the homepage <title>), `description` (the <meta description>), `tagline`, and `updatedAt`. Call this before set_site_profile to see the current values.",
      inputSchema: GetSiteProfileInputSchema.shape,
    },
    wrapTool(
      { name: 'get_site_profile', scopes: ['articles:read'], ctx },
      async (): Promise<SiteProfileShape> => getSiteProfile()
    )
  );

  server.registerTool(
    'set_site_profile',
    {
      description:
        "Update the site's identity. Partial patch — send ONLY the fields to change (`title`, `description`, and/or `tagline`); at least one is required. Takes effect on the live homepage metadata immediately. Returns the full updated profile.",
      inputSchema: SetSiteProfileInputSchema.shape,
    },
    wrapTool(
      { name: 'set_site_profile', scopes: ['articles:write'], ctx },
      async (args: SetSiteProfileInput): Promise<SiteProfileShape> => {
        if (
          args.title === undefined &&
          args.description === undefined &&
          args.tagline === undefined
        ) {
          throw new McpError(
            'bad_request',
            'Provide at least one of title, description, tagline.',
            400
          );
        }
        return updateSiteProfile(args);
      }
    )
  );
};
