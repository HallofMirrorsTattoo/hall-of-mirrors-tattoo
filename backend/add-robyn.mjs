import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  console.log('Adding artist Robyn...');

  const artist = await prisma.artist.create({
    data: {
      full_name: 'Robyn',
      email: 'robyn@hallofmirrorstattoo.com',
      password_hash: '$2b$10$Y4qE2Mzj8Y3ZH5L4KQ9sJewQqV9C4mZ2H8K6D2X9L5Y8O1P2Q3R4',
      studio_id: 'default-studio',
      specialties: 'Fine line, geometric, custom designs',
      years_experience: 8,
      bio: 'Experienced tattoo artist specializing in fine line and geometric designs.',
      instagram_handle: 'robyn.tattoos',
      is_active: true,
    }
  });

  console.log('✅ Artist created:');
  console.log(`   Name: ${artist.full_name}`);
  console.log(`   Email: ${artist.email}`);
  console.log(`   ID: ${artist.id}`);
  process.exit(0);
} catch (error) {
  if (error.code === 'P2002') {
    console.log('⚠️ Artist already exists');
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
