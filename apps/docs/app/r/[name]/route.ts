import { registryItem } from '@/lib/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const item = registryItem(name);
  if (!item) {
    return Response.json({ error: `Registry item not found: ${name}` }, { status: 404 });
  }
  return Response.json(item, {
    headers: {
      'cache-control': 'public, max-age=300',
    },
  });
}
