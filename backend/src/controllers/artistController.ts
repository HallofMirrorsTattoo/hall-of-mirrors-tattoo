import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllActiveArtists(req: Request, res: Response) {
  try {
    const artists = await prisma.artist.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        specialties: true,
        years_experience: true,
        bio: true,
        instagram_handle: true,
      },
      orderBy: {
        full_name: 'asc',
      },
    });

    res.json({
      success: true,
      artists,
    });
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artists',
    });
  }
}
