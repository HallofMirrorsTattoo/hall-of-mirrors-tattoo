// Canonical artist display order: Robyn first, then everyone else in API order.
// Used wherever the public-facing artist list is rendered.
export function sortArtists<T extends { full_name: string }>(artists: T[]): T[] {
  return [...artists].sort((a, b) => {
    const aRobyn = a.full_name.toLowerCase().includes('robyn');
    const bRobyn = b.full_name.toLowerCase().includes('robyn');
    if (aRobyn && !bRobyn) return -1;
    if (bRobyn && !aRobyn) return 1;
    return 0;
  });
}
