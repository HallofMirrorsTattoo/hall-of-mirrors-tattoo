import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyRobyn() {
  try {
    console.log('🔍 Checking for Robyn in database...');

    const artist = await prisma.artist.findUnique({
      where: { email: 'robyn@hallofmirrorstattoo.com' },
    });

    if (artist) {
      console.log('✅ Robyn exists in database!');
      console.log(`   ID: ${artist.id}`);
      console.log(`   Name: ${artist.full_name}`);
      console.log(`   Email: ${artist.email}`);
      console.log(`   Active: ${artist.is_active}`);
    } else {
      console.log('❌ Robyn not found, creating now...');

      const newArtist = await prisma.artist.create({
        data: {
          id: 'artist-robyn-001',
          full_name: 'Robyn',
          email: 'robyn@hallofmirrorstattoo.com',
          password_hash: '$2b$10$Y4qE2Mzj8Y3ZH5L4KQ9sJewQqV9C4mZ2H8K6D2X9L5Y8O1P2Q3R4',
          specialties: 'Fine line, geometric, custom designs',
          years_experience: 8,
          bio: 'Experienced tattoo artist specializing in fine line and geometric designs.',
          instagram_handle: 'robyn.tattoos',
          is_active: true,
        },
      });

      console.log('✅ Robyn created successfully!');
      console.log(`   ID: ${newArtist.id}`);
      console.log(`   Name: ${newArtist.full_name}`);
      console.log(`   Email: ${newArtist.email}`);
    }

    // Also list all artists
    console.log('\n📋 All artists in database:');
    const allArtists = await prisma.artist.findMany();
    if (allArtists.length === 0) {
      console.log('   (no artists)');
    } else {
      allArtists.forEach((a) => {
        console.log(`   - ${a.full_name} (${a.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRobyn();
