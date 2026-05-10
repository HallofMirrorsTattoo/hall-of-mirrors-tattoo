import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createArtist() {
  try {
    console.log('🔄 Creating artist Robyn...');

    const artist = await prisma.artist.create({
      data: {
        id: 'artist-robyn-001',
        email: 'robyn@hallofmirrorstattoo.com',
        password_hash: '$2b$10$Y4qE2Mzj8Y3ZH5L4KQ9sJewQqV9C4mZ2H8K6D2X9L5Y8O1P2Q3R4',
        full_name: 'Robyn',
        specialties: 'Fine line, geometric, custom designs',
        years_experience: 8,
        bio: 'Experienced tattoo artist specializing in fine line and geometric designs.',
        instagram_handle: 'robyn.tattoos',
        is_active: true,
      },
    });

    console.log('✅ Artist created successfully!');
    console.log(`   Name: ${artist.full_name}`);
    console.log(`   Email: ${artist.email}`);
    console.log(`   ID: ${artist.id}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️ Artist already exists with that email');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createArtist();
