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
    sitemap: 'https://hallofmirrorstattoo.com/sitemap.xml',
  };
}
