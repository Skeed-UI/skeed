import { PageHeader } from '@/components/ui';
import { DEMOGRAPHIC_CHOICES } from '@/lib/registry';
import { PlaygroundClient } from './playground-client';

export default function PlaygroundPage() {
  return (
    <main>
      <PageHeader
        body="Generate a Skeed app from a chat prompt, inspect why components were selected, then copy the CLI command or export a full project."
        eyebrow="Online generator"
        title="Chat-first app playground"
      />
      <section className="mx-auto max-w-docs px-5 pb-16">
        <PlaygroundClient demographics={[...DEMOGRAPHIC_CHOICES]} />
      </section>
    </main>
  );
}
