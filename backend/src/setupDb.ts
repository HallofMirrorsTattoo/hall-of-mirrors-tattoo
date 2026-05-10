import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function setupDatabase() {
  try {
    console.log('🔄 Setting up database schema...');

    // Read and execute the schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = schemaSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (err: any) {
        // Ignore "already exists" errors
        if (err.message?.includes('already exists')) {
          continue;
        }
        throw err;
      }
    }

    console.log('✅ Database schema ready');

    // Create default studio if it doesn't exist
    const existingStudio = await prisma.studio.findUnique({
      where: { id: 'default-studio' },
    });

    if (!existingStudio) {
      console.log('🔄 Creating default studio...');
      await prisma.studio.create({
        data: {
          id: 'default-studio',
          studio_name: 'Hall of Mirrors Tattoo',
          address: '123 High Street',
          postcode: 'AB12 3CD',
          phone: '+44 123 456 7890',
          email: 'bookings@hallofmirrors.tattoo',
          hours_monday_start: '10:00',
          hours_monday_end: '18:00',
          hours_tuesday_start: '10:00',
          hours_tuesday_end: '18:00',
          hours_wednesday_start: '10:00',
          hours_wednesday_end: '18:00',
          hours_thursday_start: '10:00',
          hours_thursday_end: '18:00',
          hours_friday_start: '10:00',
          hours_friday_end: '18:00',
          hours_saturday_start: '10:00',
          hours_saturday_end: '16:00',
        },
      });
      console.log('✅ Default studio created');
    } else {
      console.log('✅ Default studio exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
