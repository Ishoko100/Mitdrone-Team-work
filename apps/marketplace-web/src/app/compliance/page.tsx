import { makeContentIndex } from '@/components/content/content-route';

const index = makeContentIndex('compliance');

export const metadata = index.metadata;
export const revalidate = 300;
export default index.Page;
