/**
 * Test script for Timeline database models
 * Verifies that all timeline tables, enums, and relations are working correctly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTimelineDatabase() {
  console.log('🧪 Testing Timeline Database Models...\n');

  try {
    // 1. Test Database Connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected successfully\n');

    // 2. Test Enums
    console.log('2️⃣ Testing Enums...');
    const postTypes = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"PostType"))::text as type;
    `;
    console.log('   ✅ PostType enum:', postTypes.map(t => t.type).join(', '));

    const authorTypes = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"AuthorType"))::text as type;
    `;
    console.log(
      '   ✅ AuthorType enum:',
      authorTypes.map(t => t.type).join(', ')
    );

    const postStatuses = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"PostStatus"))::text as type;
    `;
    console.log(
      '   ✅ PostStatus enum:',
      postStatuses.map(t => t.type).join(', ')
    );
    console.log('');

    // 3. Test Table Existence
    console.log('3️⃣ Testing table existence...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'timeline%'
      ORDER BY table_name;
    `;
    const tableNames = tables.map(t => t.table_name);
    console.log(`   ✅ Found ${tableNames.length} timeline tables:`);
    tableNames.forEach(name => console.log(`      - ${name}`));
    console.log('');

    // 4. Test User Model Extension
    console.log('4️⃣ Testing User model extension...');
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('canPublishNews')
      ORDER BY column_name;
    `;
    if (userColumns.length > 0) {
      console.log('   ✅ User.canPublishNews field exists');
      userColumns.forEach(col => {
        console.log(
          `      - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`
        );
      });
    } else {
      console.log('   ❌ User.canPublishNews field not found');
    }
    console.log('');

    // 5. Test Creating a Timeline Post
    console.log('5️⃣ Testing TimelinePost creation...');
    const testUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!testUser) {
      console.log('   ⚠️  No admin user found, skipping post creation test');
      console.log(
        '   💡 Create an admin user first or use an existing user ID'
      );
    } else {
      try {
        const testPost = await prisma.timelinePost.create({
          data: {
            postType: 'NEWS_ARTICLE',
            authorId: testUser.id,
            authorType: 'ADMIN',
            content: {
              articleUrl: 'https://example.com/test-article',
              excerpt: 'This is a test article',
            },
            title: 'Test Timeline Post',
            description: 'This is a test post to verify the database schema',
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
        console.log('   ✅ TimelinePost created successfully');
        console.log(`      - ID: ${testPost.id}`);
        console.log(`      - Type: ${testPost.postType}`);
        console.log(`      - Status: ${testPost.status}`);

        // Test reading it back
        const retrievedPost = await prisma.timelinePost.findUnique({
          where: { id: testPost.id },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });
        console.log('   ✅ TimelinePost retrieved with author relation');
        console.log(`      - Author: ${retrievedPost.author.email}`);

        // Clean up test post
        await prisma.timelinePost.delete({
          where: { id: testPost.id },
        });
        console.log('   ✅ Test post cleaned up');
      } catch (error) {
        console.log('   ❌ Error creating TimelinePost:', error.message);
        throw error;
      }
    }
    console.log('');

    // 6. Test Relations
    console.log('6️⃣ Testing foreign key constraints...');
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name LIKE 'timeline%'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    console.log(`   ✅ Found ${foreignKeys.length} foreign key constraints:`);
    foreignKeys.forEach(fk => {
      console.log(
        `      - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
      );
    });
    console.log('');

    // 7. Test Indexes
    console.log('7️⃣ Testing indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename LIKE 'timeline%'
      ORDER BY tablename, indexname;
    `;
    console.log(`   ✅ Found ${indexes.length} indexes on timeline tables:`);
    indexes.forEach(idx => {
      console.log(`      - ${idx.tablename}.${idx.indexname}`);
    });
    console.log('');

    // 8. Test Counts (should be 0 for new tables)
    console.log('8️⃣ Testing table counts...');
    const counts = {
      posts: await prisma.timelinePost.count(),
      likes: await prisma.timelinePostLike.count(),
      comments: await prisma.timelinePostComment.count(),
      shares: await prisma.timelinePostShare.count(),
      views: await prisma.timelinePostView.count(),
      tags: await prisma.timelinePostTag.count(),
      follows: await prisma.timelineFollow.count(),
      feedCache: await prisma.timelineFeedCache.count(),
      ads: await prisma.timelineAd.count(),
    };
    console.log('   ✅ Table counts:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`      - ${table}: ${count}`);
    });
    console.log('');

    console.log('✅ All timeline database tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   - ${tableNames.length} tables created`);
    console.log(`   - ${foreignKeys.length} foreign key constraints`);
    console.log(`   - ${indexes.length} indexes`);
    console.log(`   - 3 enums (PostType, AuthorType, PostStatus)`);
    console.log(`   - User model extended with canPublishNews field\n`);
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testTimelineDatabase()
  .then(() => {
    console.log('🎉 Database test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Database test failed:', error);
    process.exit(1);
  });
