# TikTok API Verification Checklist

This document outlines the steps taken and remaining tasks for TikTok API verification and compliance.

## ✅ Completed

### 1. Privacy Policy Updates

- **Location**: `src/app/privacy/page.tsx`
- **Updates**:
  - Added detailed section on TikTok API data collection (Section 2.1)
  - Specified exactly what data is collected: username, user ID, profile info, follower count, engagement metrics, public video data
  - Clarified that data is used exclusively for Pulse³ eligibility scoring
  - Added note that users can disconnect TikTok account at any time
  - Added Spotify API data collection information
  - Updated data sharing section to clarify TikTok/Spotify data handling
  - Updated last modified date to 2025-01-24

### 2. Terms of Service

- **Location**: `src/app/terms/page.tsx`
- **Status**: Already includes reference to Privacy Policy
- **Updated**: Last modified date to 2025-01-24

### 3. Footer Component

- **Location**: `src/components/layout/Footer.tsx`
- **Features**:
  - Prominent Privacy Policy link
  - Prominent Terms of Service link
  - Contact email: tatenda@flemoji.com
  - Support email: support@flemoji.com
  - Responsive design with dark mode support

### 4. Contact Information

- **Email**: tatenda@flemoji.com (visible in Privacy Policy and Footer)
- **Support Email**: support@flemoji.com (visible in Footer)
- **Location**: Both emails are prominently displayed in:
  - Privacy Policy contact section
  - Footer component

## 🔲 Remaining Tasks

### 1. Add Footer to Key Pages

The Footer component has been created but needs to be added to pages. Consider adding it to:

- Landing page (if exists)
- Main layout wrapper
- Or specific pages that need it

**Recommended approach**: Add Footer to pages that don't have a custom layout, or create a layout wrapper.

### 2. Domain Verification

TikTok may require domain verification. Steps to complete:

1. **Check TikTok Developer Portal**:
   - Log into TikTok Developer Portal
   - Navigate to your app settings
   - Check if domain verification is required
   - If required, TikTok will provide either:
     - A meta tag to add to your website's `<head>`
     - A file to upload to your website's root directory

2. **If Meta Tag Required**:
   - Add the meta tag to `src/app/layout.tsx` in the `<head>` section
   - Example:
     ```tsx
     <head>
       <meta name='tiktok-verification' content='YOUR_VERIFICATION_CODE' />
     </head>
     ```

3. **If File Upload Required**:
   - Create the verification file in `public/` directory
   - Ensure it's accessible at `https://flemoji.com/verification-file.txt` (or similar)

### 3. Verify Privacy Policy & Terms Links Are Visible

- ✅ Links are in Footer component
- ✅ Links are in Register page
- ⚠️ Need to ensure Footer is displayed on main pages
- ⚠️ Consider adding links to Header component or navigation menu

### 4. Website URL Verification

- Ensure the website URL in TikTok Developer Portal matches your production domain
- Verify the URL is live and accessible
- Test that Privacy Policy and Terms pages are accessible:
  - `https://flemoji.com/privacy`
  - `https://flemoji.com/terms`

### 5. Additional Recommendations

#### A. Add Footer to Main Layout

Consider updating `src/app/layout.tsx` or creating a page wrapper to include the Footer on all pages:

```tsx
// Option 1: Add to layout.tsx
<main id='content'>
  {children}
  <Footer />
</main>

// Option 2: Create a wrapper component
```

#### B. Add Links to Header Navigation

Consider adding Privacy Policy and Terms links to the Header component's menu for better visibility.

#### C. Create a Support/Contact Page

Consider creating a dedicated contact page (`/contact`) that includes:

- Contact form
- Email addresses
- Support hours
- FAQ section

#### D. Test All Links

Before submitting to TikTok:

- ✅ Test Privacy Policy link: `/privacy`
- ✅ Test Terms link: `/terms`
- ✅ Test email links (mailto:)
- ✅ Verify all pages are accessible on production

## 📋 Pre-Submission Checklist

Before submitting your TikTok app for review:

- [ ] Privacy Policy updated with TikTok data collection details
- [ ] Terms of Service updated and linked
- [ ] Footer component added to main pages
- [ ] Contact email visible and accessible
- [ ] Domain verification completed (if required)
- [ ] All links tested and working
- [ ] Website URL in developer portal matches production domain
- [ ] Privacy Policy and Terms pages are publicly accessible
- [ ] No broken links or 404 errors
- [ ] Mobile responsiveness verified
- [ ] Dark mode compatibility checked

## 🔗 Key URLs to Verify

- Privacy Policy: `https://flemoji.com/privacy`
- Terms of Service: `https://flemoji.com/terms`
- Contact Email: `tatenda@flemoji.com`
- Support Email: `support@flemoji.com`

## 📝 Notes

- The Privacy Policy now explicitly mentions TikTok API data collection
- All data collection is opt-in (users must connect their TikTok account)
- Users can disconnect their TikTok account at any time
- No data is sold or shared with third parties for marketing purposes
- All data collection complies with POPIA (South Africa) and GDPR (EU)
