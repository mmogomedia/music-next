# TikTok Integration Setup Guide

This guide explains how to set up TikTok OAuth integration for PULSE³.

## Prerequisites

1. **TikTok Developer Account**: Create an account at [developers.tiktok.com](https://developers.tiktok.com)
2. **Create a TikTok App**:
   - Go to [TikTok Developer Portal](https://developers.tiktok.com)
   - Create a new app
   - Enable "Login Kit" and "Display API" products
3. **Sandbox Setup** (for testing):
   - Create a sandbox environment
   - Add your test TikTok account as a "Target User"
   - Note: Sandbox allows up to 10 target users

## Environment Variables

Add the following to your `.env.local` file:

```bash
# TikTok OAuth Credentials
TIKTOK_CLIENT_KEY="your_tiktok_client_key"
TIKTOK_CLIENT_SECRET="your_tiktok_client_secret"

# Required for OAuth callback
NEXTAUTH_URL="http://localhost:3000"  # or your production URL
```

## Redirect URI Configuration

In your TikTok app settings, add the following redirect URI:

- **Development**: `http://localhost:3000/api/pulse/tiktok/callback`
- **Production**: `https://yourdomain.com/api/pulse/tiktok/callback`

## OAuth Flow

1. User clicks "Connect" on `/pulse/connect`
2. Redirects to `/api/pulse/tiktok/authorize`
3. User authorizes on TikTok
4. TikTok redirects to `/api/pulse/tiktok/callback`
5. System exchanges code for access token
6. Stores tokens and user info in database
7. Redirects back to `/pulse/connect?success=true`

## API Endpoints

### `GET /api/pulse/tiktok/authorize`

Initiates OAuth flow. Redirects user to TikTok authorization page.

### `GET /api/pulse/tiktok/callback`

Handles OAuth callback. Exchanges code for tokens and saves connection.

### `POST /api/pulse/tiktok/disconnect`

Disconnects TikTok account and removes stored tokens.

### `GET /api/pulse/tiktok/data`

Fetches current TikTok user info and video list.

## Data Storage

- **OAuth Tokens**: Stored in `Account` table (reusing NextAuth's model)
- **User Info**: Stored in `ArtistProfile.socialLinks` JSON field
- **Token Refresh**: Automatically handled when tokens expire

## Scopes

The integration requests the following scopes:

- `user.info.basic` - Basic user profile information
- `video.list` - List of user's videos

## Testing

1. Ensure your TikTok app is in Sandbox mode
2. Add your TikTok account as a Target User
3. Use the Connect button on `/pulse/connect`
4. Complete OAuth flow
5. Verify connection status updates

## Production Checklist

- [ ] Move app out of Sandbox mode
- [ ] Complete TikTok app review process
- [ ] Update redirect URIs in TikTok app settings
- [ ] Test token refresh flow
- [ ] Monitor API rate limits
- [ ] Set up error monitoring

## Troubleshooting

### "TikTok credentials not configured"

- Ensure `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` are set in environment variables

### "Invalid redirect URI"

- Verify redirect URI matches exactly in TikTok app settings
- Check `NEXTAUTH_URL` environment variable

### "Invalid state" error

- This is a CSRF protection error. Clear cookies and try again.

### Token expiration

- Tokens are automatically refreshed when expired
- Refresh tokens are stored and used automatically

## Rate Limits

TikTok API has rate limits. Monitor usage and implement caching where appropriate.

## Security Notes

- Never commit credentials to version control
- Use environment variables for all sensitive data
- State parameter is used for CSRF protection
- Tokens are stored securely in the database
- HTTPS is required in production
