import { ProjectsView } from '@/components/account/projects-view';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My projects' };

export default function ProjectsPage() {
  return <ProjectsView />;
}
