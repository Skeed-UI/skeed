import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Catalog } from './catalog.js';

export interface CreateServerOptions {
  /** Absolute path to the registry SQLite file produced by @skeed/indexer. */
  registryPath: string;
  /** Server name reported via MCP. */
  name?: string;
  /** Server version reported via MCP. */
  version?: string;
}

export function createServer(opts: CreateServerOptions): {
  server: Server;
  catalog: Catalog;
} {
  const catalog = new Catalog(opts.registryPath);
  const server = new Server(
    {
      name: opts.name ?? 'skeed',
      version: opts.version ?? '0.1.0',
    },
    {
      capabilities: { tools: {} },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'search_components',
        description:
          'Search the Skeed component catalog. Returns ranked summaries — fetch full source via get_component.',
        inputSchema: {
          type: 'object',
          properties: {
            intent: { type: 'string', description: 'Free-text intent' },
            demographic: { type: 'string' },
            category: { type: 'string', enum: ['atom', 'molecule', 'organism', 'template', 'block', 'page'] },
            density: { type: 'string', enum: ['compact', 'cozy', 'comfy'] },
            framework: { type: 'string', enum: ['react', 'vue', 'svelte', 'web-components'] },
            limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
          },
          required: ['intent'],
        },
      },
      {
        name: 'get_component',
        description: 'Fetch full manifest + source for a component by id.',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
      {
        name: 'list_demographics',
        description: 'List all demographic ids available in the active registry.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_preset',
        description: 'Fetch the full DemographicPreset for a demographic id.',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
      {
        name: 'list_archetypes',
        description: 'List archetype ids + categories. Archetypes are the canonical token-only templates.',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  }));

  const SearchInput = z.object({
    intent: z.string(),
    demographic: z.string().optional(),
    category: z.string().optional(),
    density: z.string().optional(),
    framework: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  });
  const GetComponentInput = z.object({ id: z.string() });
  const GetPresetInput = z.object({ id: z.string() });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    switch (name) {
      case 'search_components': {
        const parsed = SearchInput.parse(args ?? {});
        const rows = catalog.searchComponents({
          intent: parsed.intent,
          ...(parsed.demographic !== undefined && { demographic: parsed.demographic }),
          ...(parsed.category !== undefined && { category: parsed.category }),
          ...(parsed.density !== undefined && { density: parsed.density }),
          ...(parsed.framework !== undefined && { framework: parsed.framework }),
          ...(parsed.limit !== undefined && { limit: parsed.limit }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
      }
      case 'get_component': {
        const { id } = GetComponentInput.parse(args ?? {});
        const result = catalog.getComponent(id);
        if (!result) {
          return {
            isError: true,
            content: [{ type: 'text', text: `component not found: ${id}` }],
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'list_demographics': {
        return {
          content: [{ type: 'text', text: JSON.stringify(catalog.listDemographics(), null, 2) }],
        };
      }
      case 'get_preset': {
        const { id } = GetPresetInput.parse(args ?? {});
        const preset = catalog.getPreset(id);
        if (!preset) {
          return {
            isError: true,
            content: [{ type: 'text', text: `preset not found: ${id}` }],
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(preset, null, 2) }] };
      }
      case 'list_archetypes': {
        return {
          content: [{ type: 'text', text: JSON.stringify(catalog.listArchetypes(), null, 2) }],
        };
      }
      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `unknown tool: ${name}` }],
        };
    }
  });

  return { server, catalog };
}
