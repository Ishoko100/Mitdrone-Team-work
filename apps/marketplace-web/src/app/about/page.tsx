import { makeContentIndex } from '@/components/content/content-route';

const index = makeContentIndex('company');

export const metadata = index.metadata;
export const revalidate = 300;
export default index.Page;
