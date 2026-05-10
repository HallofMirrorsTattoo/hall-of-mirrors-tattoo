import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if default studio exists
  const existingStudio = await prisma.studio.findUnique({
    where: { id: 'default-studio' },
  });

  if (!existingStudio) {
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
        hours_sunday_start: null,
        hours_sunday_end: null,
      },
    });
    console.log('✅ Default studio created');
  } else {
    console.log('✅ Default studio already exists');
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
