# Flemoji Music Streaming Platform - Development Rules

This folder contains the development rules and guidelines for building the Next.js music streaming platform. Each markdown file focuses on a specific development phase or feature module.

## 📁 Rules Structure

### 🎨 Phase 0: Design System
- [**00-ui-design-system.md**](./00-ui-design-system.md) - Comprehensive UI/UX guidelines and design system

### 🚀 Phase 1: Foundation & Setup
- [**01-project-setup.md**](./01-project-setup.md) - Initial project setup, dependencies, and basic structure
- [**02-authentication-setup.md**](./02-authentication-setup.md) - NextAuth configuration and user management
- [**03-database-schema.md**](./03-database-schema.md) - Database models and Prisma setup

### 🎧 Phase 2: Core Music Features
- [**04-music-upload.md**](./04-music-upload.md) - File upload system and storage integration
- [**05-music-streaming.md**](./05-music-streaming.md) - Audio player and streaming interface
- [**06-user-interface.md**](./06-user-interface.md) - User-facing music browsing and streaming

### 🏷️ Phase 3: Artist Features
- [**07-artist-dashboard.md**](./07-artist-dashboard.md) - Artist management interface
- [**08-analytics-system.md**](./08-analytics-system.md) - Play statistics and analytics
- [**09-smart-links.md**](./09-smart-links.md) - Smart link generation and management

### 💎 Phase 4: Premium Features
- [**10-subscription-system.md**](./10-subscription-system.md) - Stripe integration and premium access
- [**11-premium-analytics.md**](./11-premium-analytics.md) - Advanced analytics for premium users

### 🔧 Phase 5: Admin & Management
- [**12-admin-dashboard.md**](./12-admin-dashboard.md) - Admin interface and user management
- [**13-content-moderation.md**](./13-content-moderation.md) - Content review and moderation tools

### 🚀 Phase 6: Deployment & Optimization
- [**14-testing-qa.md**](./14-testing-qa.md) - Testing strategy and quality assurance
- [**15-deployment.md**](./15-deployment.md) - Production deployment and monitoring

## 🎯 Development Approach

### Sequential Development
- **Follow the phases in order** - Each phase builds upon the previous one
- **Complete one feature at a time** - Don't move to the next until current is working
- **Test thoroughly** - Each phase includes testing requirements

### Technology Stack
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **NextAuth.js** for authentication
- **Prisma** with PostgreSQL/MySQL
- **AWS S3** for file storage
- **Stripe** for payments
- **Tailwind CSS** for styling

### Code Standards
- **TypeScript strict mode** enabled
- **ESLint + Prettier** for code quality
- **Component-based architecture** with React hooks
- **Server-side rendering** where appropriate
- **API routes** for backend functionality

## 📋 Before Starting

1. **Read the current phase rules** completely
2. **Understand dependencies** from previous phases
3. **Set up environment** as specified in the rules
4. **Follow testing requirements** before moving forward

## 🔄 Iteration Process

1. **Implement** the feature according to rules
2. **Test** using the specified testing approach
3. **Review** code quality and performance
4. **Document** any deviations or learnings
5. **Move to next phase** only when current is complete

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Remember**: Quality over speed. Each phase should be fully functional before proceeding to the next.
