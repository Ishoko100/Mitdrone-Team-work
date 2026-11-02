import { makeContentIndex } from '@/components/content/content-route';

const index = makeContentIndex('support');

export const metadata = index.metadata;
export const revalidate = 300;
export default index.Page;
