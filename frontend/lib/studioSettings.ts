export interface StudioSettings {
  studio_name: string | null;
  address: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  hours_monday_start: string | null;
  hours_monday_end: string | null;
  hours_tuesday_start: string | null;
  hours_tuesday_end: string | null;
  hours_wednesday_start: string | null;
  hours_wednesday_end: string | null;
  hours_thursday_start: string | null;
  hours_thursday_end: string | null;
  hours_friday_start: string | null;
  hours_friday_end: string | null;
  hours_saturday_start: string | null;
  hours_saturday_end: string | null;
  hours_sunday_start: string | null;
  hours_sunday_end: string | null;
  deposit_amount_fixed: string | null;
  cancellation_policy_hours: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  tiktok_handle: string | null;
  about_section: string | null;
}

export async function getStudioSettings(): Promise<StudioSettings | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
    const res = await fetch(`${base}/api/studio-settings`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<StudioSettings>;
  } catch {
    return null;
  }
}
