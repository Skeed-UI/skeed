import { HomeExperience } from '@/components/home-experience';
import {
  componentNameFromId,
  listDocsComponents,
  registryOverview,
} from '@/lib/registry';

export default function HomePage() {
  const components = listDocsComponents({ tier: 'flagship', demographic: 'health', limit: 6 });
  const overview = registryOverview() as { counts?: Record<string, number> };
  const metrics = [
    {
      label: 'Registry components',
      value: String(overview.counts?.components ?? '4,224'),
      detail: 'Indexed with context and install plans',
    },
    {
      label: 'Context documents',
      value: String(overview.counts?.contextDocuments ?? '25k+'),
      detail: 'Purpose, fit, examples, and rules',
    },
    {
      label: 'Default styling',
      value: 'Tailwind 3',
      detail: 'Fast CSS-first micro-interactions',
    },
  ];
  const cards = components.map((component) => ({
    demographic: component.demographics[0] ?? 'productivity',
    description: component.summary,
    href: component.href,
    meta: `${component.qualityTier} / ${component.demographics[0]}`,
    title: componentNameFromId(component.id),
  }));

  return <HomeExperience components={cards} metrics={metrics} />;
}
