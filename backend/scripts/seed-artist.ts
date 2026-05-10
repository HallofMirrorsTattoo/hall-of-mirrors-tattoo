import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedArtist() {
  try {
    console.log('🔄 Adding artist Robyn...');

    // Use raw SQL to insert the artist directly
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Artist" (id, email, password_hash, full_name, specialties, years_experience, bio, instagram_handle, is_active, created_at, updated_at)
      VALUES (
        'artist-robyn-001',
        'robyn@hallofmirrorstattoo.com',
        '$2b$10$placeholder.hash.will.be.replaced',
        'Robyn',
        'Fine line, geometric, custom designs',
        8,
        'Experienced tattoo artist specializing in fine line and geometric designs.',
        'robyn.tattoos',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('✅ Artist Robyn added successfully!');
    console.log('   Email: robyn@hallofmirrorstattoo.com');
  } catch (error: any) {
    console.error('❌ Error adding artist:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedArtist();
