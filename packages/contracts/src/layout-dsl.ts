import { z } from 'zod';

const Align = z.enum(['start', 'center', 'end', 'stretch', 'baseline']);

const NodeBase = z.object({
  id: z.string(),
});

type LayoutNodeShape =
  | (z.infer<typeof NodeBase> & {
      type: 'row' | 'col' | 'stack';
      props: { gap: number; align: z.infer<typeof Align> };
      children: LayoutNodeShape[];
    })
  | (z.infer<typeof NodeBase> & {
      type: 'grid';
      props: { cols: number; gap: number };
      children: LayoutNodeShape[];
    })
  | (z.infer<typeof NodeBase> & {
      type: 'slot';
      componentId: string;
      bindings: Record<string, string>;
    });

/**
 * The layout DSL is intentionally tiny: 8 node types max so an LLM cannot drift.
 * Stage 7a outputs trees of these; Stage 7b deterministically emits TSX.
 */
export const LayoutNode: z.ZodType<LayoutNodeShape> = z.lazy(() =>
  z.discriminatedUnion('type', [
    NodeBase.extend({
      type: z.literal('row'),
      props: z.object({ gap: z.number(), align: Align }),
      children: z.array(LayoutNode),
    }),
    NodeBase.extend({
      type: z.literal('col'),
      props: z.object({ gap: z.number(), align: Align }),
      children: z.array(LayoutNode),
    }),
    NodeBase.extend({
      type: z.literal('stack'),
      props: z.object({ gap: z.number(), align: Align }),
      children: z.array(LayoutNode),
    }),
    NodeBase.extend({
      type: z.literal('grid'),
      props: z.object({ cols: z.number().int().min(1).max(12), gap: z.number() }),
      children: z.array(LayoutNode),
    }),
    NodeBase.extend({
      type: z.literal('slot'),
      componentId: z.string(),
      bindings: z.record(z.string(), z.string()),
    }),
  ]),
);
export type LayoutNode = LayoutNodeShape;
