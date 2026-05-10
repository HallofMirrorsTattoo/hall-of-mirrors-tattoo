import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createArtistTable() {
  try {
    console.log('🔄 Creating Artist table directly...');

    // Create the table directly with raw SQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Artist" (
        id TEXT PRIMARY KEY,
        studio_id TEXT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        specialties TEXT,
        years_experience INTEGER,
        bio TEXT,
        instagram_handle TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        role TEXT NOT NULL DEFAULT 'artist',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Artist table created successfully');

    // Now add Robyn
    console.log('🔄 Adding artist Robyn...');
    const artist = await prisma.artist.create({
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

    console.log('✅ Artist Robyn created successfully!');
    console.log(`   ID: ${artist.id}`);
    console.log(`   Name: ${artist.full_name}`);
    console.log(`   Email: ${artist.email}`);

  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Artist table or artist already exists');
    } else if (error.code === 'P2002') {
      console.log('⚠️ Artist with that email already exists');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createArtistTable();
