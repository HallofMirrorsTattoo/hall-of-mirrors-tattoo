import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;

dotenv.config();

async function checkRobyn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking for Robyn in database...');
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query(
      `SELECT id, full_name, email, is_active FROM "Artist" WHERE email = $1`,
      ['robyn@hallofmirrorstattoo.com']
    );

    if (result.rows.length > 0) {
      const artist = result.rows[0];
      console.log('✅ Robyn found in database!');
      console.log(`   ID: ${artist.id}`);
      console.log(`   Name: ${artist.full_name}`);
      console.log(`   Email: ${artist.email}`);
      console.log(`   Active: ${artist.is_active}`);
    } else {
      console.log('❌ Robyn not found');
    }

    // Also list all artists
    const allResult = await client.query(
      `SELECT id, full_name, email, is_active FROM "Artist" ORDER BY full_name`
    );
    console.log(`\n📋 All artists (${allResult.rows.length}):`);
    allResult.rows.forEach((artist) => {
      console.log(`   - ${artist.full_name} (${artist.email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRobyn();
