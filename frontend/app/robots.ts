import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/client/', '/artist/'],
      },
    ],
    sitemap: 'https://hall-of-mirrors-tattoo.vercel.app/sitemap.xml',
  };
}
