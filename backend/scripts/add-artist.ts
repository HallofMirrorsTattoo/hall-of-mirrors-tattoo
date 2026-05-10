import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash a temporary password
    const hashedPassword = await bcrypt.hash('temppassword123', 10);

    // Create Robyn as an artist
    const artist = await prisma.artist.create({
      data: {
        email: 'robyn@hallofmirrorstattoo.com',
        full_name: 'Robyn',
        password_hash: hashedPassword,
        is_active: true,
        specialties: 'Fine line, geometric, custom designs',
        years_experience: 8,
        bio: 'Experienced tattoo artist specializing in fine line and geometric designs.',
        instagram_handle: 'robyn.tattoos',
      },
    });

    console.log('✅ Artist created successfully:');
    console.log(`   Name: ${artist.full_name}`);
    console.log(`   Email: ${artist.email}`);
    console.log(`   ID: ${artist.id}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️ Artist already exists with that email');
    } else {
      console.error('❌ Error creating artist:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
