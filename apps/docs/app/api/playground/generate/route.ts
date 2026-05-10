import { generatePlaygroundApp, PlaygroundGenerateInput } from '@/lib/playground';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const input = PlaygroundGenerateInput.parse(await request.json());
    const result = await generatePlaygroundApp(input, {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Playground generation failed.' },
      { status: 400 },
    );
  }
}
