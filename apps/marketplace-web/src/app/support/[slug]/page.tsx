import { makeContentRoute } from '@/components/content/content-route';

const route = makeContentRoute('support');

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export const revalidate = 300;
export default route.Page;
