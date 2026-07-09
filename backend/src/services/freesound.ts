import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY  = process.env.FREESOUND_API_KEY!;
const BASE_URL = 'https://freesound.org/apiv2';

export interface FreesoundResult {
  id: number;
  name: string;
  duration: number;
  preview_url: string;
}

export async function searchSounds(
  query: string,
  minDuration = 5,
  maxDuration = 600
): Promise<FreesoundResult[]> {
  const params = new URLSearchParams({
    query,
    filter:   `duration:[${minDuration}.0 TO ${maxDuration}.0]`,
    fields:   'id,name,duration,previews',
    page_size: '5',
    sort:     'rating_desc',
  });

  const res = await fetch(`${BASE_URL}/search/text/?${params}`, {
    headers: { Authorization: `Token ${API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Freesound search error ${res.status}`);
  }

  const data = await res.json() as any;
  return (data.results ?? []).map((r: any) => ({
    id:          r.id,
    name:        r.name,
    duration:    r.duration,
    preview_url: r.previews['preview-hq-mp3'] ?? r.previews['preview-lq-mp3'],
  }));
}

export async function downloadSound(previewUrl: string): Promise<Buffer> {
  const res = await fetch(previewUrl, {
    headers: { Authorization: `Token ${API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Freesound download error ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
