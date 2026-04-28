import { type IncomingMessage, type ServerResponse, createServer } from 'node:http';

export interface PreviewCandidate {
  id: string;
  label: string;
  /** HTML body to render in the gallery card (may include inline SVG, JSX-ish, etc). */
  html: string;
}

export interface PreviewOptions {
  title: string;
  description: string;
  candidates: PreviewCandidate[];
  /** When true, do NOT auto-open the browser; just return the URL. */
  silent?: boolean;
}

/**
 * Boot a tiny localhost server listing candidates side-by-side, await user pick,
 * shut down. Returns the chosen candidate id (or 'abort' if window closed).
 */
export async function pickFromPreview(opts: PreviewOptions): Promise<string> {
  return new Promise((resolveSelection, reject) => {
    let resolved = false;
    const server = createServer((req, res) => {
      if (!req.url) return notFound(res);
      if (req.method === 'GET' && req.url === '/') return galleryHtml(res, opts);
      if (req.method === 'POST' && req.url === '/select') return handleSelect(req, res, finish);
      if (req.method === 'GET' && req.url === '/abort') {
        finish('abort');
        return text(res, 200, 'closed; you may close this tab');
      }
      return notFound(res);
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', async () => {
      const addr = server.address();
      if (!addr || typeof addr !== 'object')
        return reject(new Error('unable to bind preview server'));
      const url = `http://127.0.0.1:${addr.port}`;
      process.stdout.write(`\n  preview: ${url}\n  (waiting for your pick — open the browser)\n`);
      if (!opts.silent) {
        try {
          const open = (await import('open')).default;
          await open(url);
        } catch {
          // open package optional
        }
      }
    });
    function finish(id: string): void {
      if (resolved) return;
      resolved = true;
      server.close(() => resolveSelection(id));
    }
  });
}

function galleryHtml(res: ServerResponse, opts: PreviewOptions): void {
  const cards = opts.candidates
    .map(
      (c) => `
        <label class="card">
          <input type="radio" name="pick" value="${escape(c.id)}" />
          <h3>${escape(c.label)}</h3>
          <div class="content">${c.html}</div>
        </label>`,
    )
    .join('');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${escape(opts.title)} — Skeed preview</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; }
  h1 { font-size: 1.75rem; margin-bottom: .25rem; }
  p.lead { opacity: .7; margin-top: 0; }
  .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: 2rem; }
  .card { display: block; border: 2px solid rgba(127,127,127,.2); border-radius: 16px; padding: 1rem; cursor: pointer; transition: border-color .15s; }
  .card:has(input:checked) { border-color: #4F46E5; }
  .card h3 { margin: .25rem 0 .75rem; font-size: 1rem; }
  .card .content { background: rgba(127,127,127,.05); padding: .5rem; border-radius: 8px; min-height: 120px; }
  .actions { margin-top: 2rem; display: flex; gap: .75rem; align-items: center; }
  button { padding: .75rem 1.5rem; border: 0; border-radius: 9999px; background: #4F46E5; color: white; font-weight: 600; cursor: pointer; }
  button.secondary { background: transparent; color: inherit; border: 1px solid rgba(127,127,127,.3); }
</style>
</head><body>
<h1>${escape(opts.title)}</h1>
<p class="lead">${escape(opts.description)}</p>
<form method="post" action="/select">
  <div class="grid">${cards}</div>
  <div class="actions">
    <button type="submit">Approve selection</button>
    <button type="button" class="secondary" onclick="fetch('/abort').then(()=>window.close())">Cancel</button>
  </div>
</form>
</body></html>`;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function handleSelect(
  req: IncomingMessage,
  res: ServerResponse,
  finish: (id: string) => void,
): void {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    const params = new URLSearchParams(raw);
    const pick = params.get('pick') ?? 'abort';
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<p>Selected: <strong>${escape(pick)}</strong>. You may close this tab.</p>`);
    finish(pick);
  });
}

function notFound(res: ServerResponse): void {
  text(res, 404, 'not found');
}

function text(res: ServerResponse, code: number, body: string): void {
  res.writeHead(code, { 'content-type': 'text/plain' });
  res.end(body);
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
