import { MetadataRoute } from 'next';

const BASE_URL = 'https://hall-of-mirrors-tattoo.vercel.app';

const STATIC_ROUTES: { url: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { url: '',           priority: 1.0,  changeFrequency: 'weekly' },
  { url: '/booking',   priority: 0.9,  changeFrequency: 'monthly' },
  { url: '/portfolio', priority: 0.85, changeFrequency: 'weekly' },
  { url: '/services',  priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/about',     priority: 0.7,  changeFrequency: 'monthly' },
  { url: '/contact',   priority: 0.7,  changeFrequency: 'monthly' },
  { url: '/aftercare', priority: 0.5,  changeFrequency: 'yearly' },
  { url: '/testimonials', priority: 0.6, changeFrequency: 'monthly' },
];

async function fetchArtistSlugs(): Promise<string[]> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://hall-of-mirrors-tattoo-production.up.railway.app';
    const res = await fetch(`${API}/api/artist`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.artists ?? []).map((a: { full_name: string }) =>
      a.full_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    );
  } catch {
    return ['robyn'];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchArtistSlugs();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE_URL}${url}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const artistEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/artists/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  return [...staticEntries, ...artistEntries];
}
