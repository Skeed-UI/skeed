import { registryIndex } from '@/lib/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(registryIndex(), {
    headers: {
      'cache-control': 'public, max-age=300',
    },
  });
}
