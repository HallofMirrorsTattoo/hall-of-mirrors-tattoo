import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function initializeDatabase() {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');

    // Check if default studio exists
    console.log('🔄 Checking for default studio...');
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
      console.log('✅ Default studio already exists');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    // Don't crash the server, just log the error
    // The tables might not exist yet if migrations haven't run
    console.log('⚠️  Continuing without database initialization...');
  }
}
