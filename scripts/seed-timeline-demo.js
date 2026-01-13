#!/usr/bin/env node
/* eslint-env node */

/**
 * Seed Timeline Demo Data
 *
 * Creates demo timeline posts for each post type to test renderers
 *
 * Usage:
 *   node scripts/seed-timeline-demo.js
 */

/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTimelineDemo() {
  console.log('🌱 Seeding timeline demo data...\n');

  try {
    // Get or create a demo user
    let demoUser = await prisma.user.findFirst({
      where: { email: 'demo@flemoji.com' },
    });

    if (!demoUser) {
      console.log('Creating demo user...');
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@flemoji.com',
          name: 'Demo Artist',
          emailVerified: new Date(),
          role: 'ARTIST',
        },
      });
    }

    // Get or create an admin user for news articles
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { email: { contains: 'admin' } },
      });
    }

    if (!adminUser) {
      adminUser = demoUser; // Fallback to demo user
    }

    // Clear existing demo posts (optional - comment out if you want to keep them)
    const existingDemoPosts = await prisma.timelinePost.findMany({
      where: {
        OR: [
          { title: { contains: '[DEMO]' } },
          { description: { contains: '[DEMO]' } },
        ],
      },
    });

    if (existingDemoPosts.length > 0) {
      console.log(
        `Deleting ${existingDemoPosts.length} existing demo posts...`
      );
      await prisma.timelinePost.deleteMany({
        where: {
          id: { in: existingDemoPosts.map(p => p.id) },
        },
      });
    }

    const now = new Date();
    const posts = [];

    // 1. MUSIC_POST
    posts.push({
      postType: 'MUSIC_POST',
      authorId: demoUser.id,
      authorType: 'ARTIST',
      title: '[DEMO] New Amapiano Track - "Summer Vibes"',
      description:
        'Just dropped my latest Amapiano track! Perfect for those summer evenings. Let me know what you think! 🎵',
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop',
      content: {
        trackId: 'demo-track-1',
        artist: 'Demo Artist',
        genre: 'Amapiano',
        duration: '03:45',
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      likeCount: 42,
      commentCount: 8,
      shareCount: 12,
      viewCount: 156,
      relevanceScore: 85.5,
    });

    // 2. SONG (External link)
    posts.push({
      postType: 'SONG',
      authorId: demoUser.id,
      authorType: 'ARTIST',
      title: '[DEMO] Check out my track on Spotify',
      description:
        'My latest single is now available on Spotify! Give it a listen and add it to your playlists. 🎧',
      coverImageUrl:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop',
      songUrl: 'https://open.spotify.com/track/demo',
      content: {
        artist: 'Demo Artist',
        platform: 'Spotify',
        duration: '04:12',
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      likeCount: 28,
      commentCount: 5,
      shareCount: 9,
      viewCount: 203,
      relevanceScore: 78.2,
    });

    // 3. NEWS_ARTICLE
    posts.push({
      postType: 'NEWS_ARTICLE',
      authorId: adminUser.id,
      authorType: 'ADMIN',
      title: '[DEMO] How Amapiano Took Over the World',
      description:
        'From the streets of Soweto to global charts, Amapiano has become one of the most influential music genres of the decade. Discover its journey and impact on the international music scene.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=600&fit=crop',
      content: {
        url: 'https://example.com/article/amapiano',
        readTime: '8 min read',
        category: 'Music News',
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      likeCount: 156,
      commentCount: 23,
      shareCount: 45,
      viewCount: 892,
      relevanceScore: 92.1,
    });

    // 4. VIDEO_CONTENT
    posts.push({
      postType: 'VIDEO_CONTENT',
      authorId: demoUser.id,
      authorType: 'ARTIST',
      title: '[DEMO] Live Performance - Jazz Night Session',
      description:
        'Check out this amazing live performance from our recent jazz night! The energy was incredible. 🎷',
      coverImageUrl: 'https://img.youtube.com/vi/UNWbmiwIzkY/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=UNWbmiwIzkY',
      content: {
        platform: 'YouTube',
        duration: '32:15',
        views: 1250,
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      likeCount: 89,
      commentCount: 15,
      shareCount: 34,
      viewCount: 1250,
      relevanceScore: 88.7,
    });

    // 5. ADVERTISEMENT
    posts.push({
      postType: 'ADVERTISEMENT',
      authorId: adminUser.id,
      authorType: 'ADMIN',
      title: '[DEMO] Discover New Music Every Week',
      description:
        'Join thousands of music lovers discovering the best South African music. Premium members get early access to new releases!',
      coverImageUrl:
        'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=600&fit=crop',
      content: {
        url: 'https://flemoji.com/premium',
        ctaText: 'Get Premium',
        campaign: 'premium-signup',
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      isFeatured: true,
      featuredUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      likeCount: 12,
      commentCount: 2,
      shareCount: 5,
      viewCount: 456,
      relevanceScore: 75.0,
      priority: 10,
    });

    // 6. RELEASE_PROMO
    posts.push({
      postType: 'RELEASE_PROMO',
      authorId: demoUser.id,
      authorType: 'ARTIST',
      title: '[DEMO] New Album Coming Soon - "Midnight Grooves"',
      description:
        'Excited to announce my new album "Midnight Grooves" dropping next month! Pre-save now and get exclusive early access. 🎵',
      coverImageUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=800&fit=crop',
      content: {
        artist: 'Demo Artist',
        releaseDate: new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days from now
        trackCount: 12,
        genre: 'Amapiano',
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      likeCount: 67,
      commentCount: 12,
      shareCount: 28,
      viewCount: 312,
      relevanceScore: 81.3,
    });

    // 7. FEATURED_CONTENT
    posts.push({
      postType: 'FEATURED_CONTENT',
      authorId: adminUser.id,
      authorType: 'ADMIN',
      title: '[DEMO] Artist Spotlight: Rising Stars of 2024',
      description:
        'Discover the most exciting new artists making waves in the South African music scene this year.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop',
      content: {
        url: 'https://flemoji.com/spotlight/2024',
        type: 'editorial',
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      isFeatured: true,
      featuredUntil: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      likeCount: 134,
      commentCount: 19,
      shareCount: 56,
      viewCount: 678,
      relevanceScore: 90.5,
      priority: 8,
    });

    // 8. EVENT_ANNOUNCEMENT
    posts.push({
      postType: 'EVENT_ANNOUNCEMENT',
      authorId: demoUser.id,
      authorType: 'ARTIST',
      title: '[DEMO] Live Concert - Johannesburg Music Festival',
      description:
        'Join us for an unforgettable night of music! Featuring top South African artists. Tickets on sale now! 🎤',
      coverImageUrl:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=600&fit=crop',
      content: {
        eventDate: new Date(
          now.getTime() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(), // 14 days from now
        location: 'Johannesburg, South Africa',
        venue: 'Convention Centre',
        ticketUrl: 'https://example.com/tickets',
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
      likeCount: 203,
      commentCount: 34,
      shareCount: 78,
      viewCount: 1245,
      relevanceScore: 87.9,
    });

    // 9. POLL
    posts.push({
      postType: 'POLL',
      authorId: demoUser.id,
      authorType: 'ARTIST',
      title: '[DEMO] What genre should I explore next?',
      description:
        'I want to try something new! Which genre should I experiment with for my next track?',
      content: {
        options: [
          { id: '1', text: 'Afrobeat', votes: 45 },
          { id: '2', text: 'Gqom', votes: 32 },
          { id: '3', text: 'House', votes: 28 },
          { id: '4', text: 'Jazz Fusion', votes: 19 },
        ],
        totalVotes: 124,
        expiresAt: new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      status: 'PUBLISHED',
      publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      likeCount: 56,
      commentCount: 18,
      shareCount: 23,
      viewCount: 445,
      relevanceScore: 79.6,
    });

    // Create all posts
    console.log(`Creating ${posts.length} demo posts...\n`);

    for (const postData of posts) {
      const post = await prisma.timelinePost.create({
        data: postData,
      });
      console.log(`✅ Created ${post.postType}: "${post.title}"`);
    }

    console.log(
      `\n✨ Successfully created ${posts.length} demo timeline posts!`
    );
    console.log('\n📊 Post Types Created:');
    const typeCounts = {};
    posts.forEach(p => {
      typeCounts[p.postType] = (typeCounts[p.postType] || 0) + 1;
    });
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    console.log('\n💡 Tips:');
    console.log('   - All posts are marked with [DEMO] in the title');
    console.log(
      '   - Posts are published and should appear in your timeline feed'
    );
    console.log('   - Featured posts will appear in the featured section');
    console.log('   - Run this script again to refresh demo data');
  } catch (error) {
    console.error('❌ Error seeding timeline demo data:', error);
    throw error;
  }
}

seedTimelineDemo()
  .catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
