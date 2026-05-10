import { readFileSync } from 'fs';
import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;

// Load environment variables
dotenv.config();

async function executeMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    // Read the migration SQL
    const migrationSql = readFileSync(
      '/Users/willbangura/hall-of-mirrors-tattoo/backend/prisma/migrations/20260510120000_init/migration.sql',
      'utf-8'
    );

    // Split by semicolon and execute each statement
    const statements = migrationSql
      .split(';')
      .map((stmt) => {
        // Remove comments and trim
        return stmt
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      })
      .filter((stmt) => stmt.length > 0);

    console.log(`🔄 Executing ${statements.length} statements from migration...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.query(statement);
        console.log(`  ✓ Statement ${i + 1} executed`);
      } catch (err) {
        // Ignore "already exists" errors
        if (
          !err.message.includes('already exists') &&
          !err.message.includes('duplicate key value')
        ) {
          console.warn(`  ⚠️ Statement ${i + 1} failed:`, err.message);
        } else {
          console.log(`  ✓ Statement ${i + 1} skipped (already exists)`);
        }
      }
    }

    console.log('✅ Migration executed');

    // Now try to add Robyn
    console.log('🔄 Adding artist Robyn...');
    const result = await client.query(
      `INSERT INTO "Artist" (id, studio_id, full_name, email, password_hash, specialties, years_experience, bio, instagram_handle, is_active, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [
        'artist-robyn-001',
        'default-studio',
        'Robyn',
        'robyn@hallofmirrorstattoo.com',
        '$2b$10$Y4qE2Mzj8Y3ZH5L4KQ9sJewQqV9C4mZ2H8K6D2X9L5Y8O1P2Q3R4',
        'Fine line, geometric, custom designs',
        8,
        'Experienced tattoo artist specializing in fine line and geometric designs.',
        'robyn.tattoos',
        true,
        'artist',
      ]
    );

    if (result.rowCount > 0) {
      console.log('✅ Artist Robyn created successfully!');
    } else {
      console.log('✅ Artist Robyn already exists');
    }

    // Verify
    const artistResult = await client.query(
      `SELECT id, full_name, email, is_active FROM "Artist" WHERE email = $1`,
      ['robyn@hallofmirrorstattoo.com']
    );

    if (artistResult.rows.length > 0) {
      const artist = artistResult.rows[0];
      console.log(`\n✅ Verified Robyn in database:`);
      console.log(`   ID: ${artist.id}`);
      console.log(`   Name: ${artist.full_name}`);
      console.log(`   Email: ${artist.email}`);
      console.log(`   Active: ${artist.is_active}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

executeMigration();
