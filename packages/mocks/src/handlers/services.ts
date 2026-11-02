import { routes, serviceRequestSchema, type ServiceRequest } from '@mitdrone/types';
import { makeMoney } from '@mitdrone/utils';

import { getDb, nextId } from '../db';
import {
  ApiError,
  created,
  includesText,
  notFound,
  paginate,
  readBody,
  requireUser,
  route,
} from '../http';
import { embedServiceVendor, sortNewest, summarize } from '../lib';

export const serviceHandlers = [
  route('get', routes.services.categories, () => getDb().serviceCategories),

  route('get', routes.services.list, ({ url }) => {
    const db = getDb();
    const q = url.searchParams;
    const category = q.get('category');
    const categoryId = category
      ? db.serviceCategories.find((c) => c.slug === category || c.id === category)?.id
      : undefined;
    const vendor = q.get('vendor');
    const vendorId = vendor
      ? db.vendors.find((v) => v.slug === vendor || v.id === vendor)?.id
      : undefined;
    const items = db.services.filter(
      (s) =>
        s.status === 'active' &&
        (!category || s.categoryId === categoryId) &&
        (!vendor || s.vendorId === vendorId) &&
        (!q.get('state') || s.coverageStates.includes(q.get('state') ?? '')) &&
        includesText([s.title, s.description], q.get('q')),
    );
    const page = paginate(
      [...items].sort((a, b) => b.rating - a.rating),
      url,
      12,
    );
    return { ...page, data: page.data.map((s) => embedServiceVendor(db, s)) };
  }),

  route('get', routes.services.detail, ({ params }) => {
    const db = getDb();
    const service = db.services.find(
      (s) => (s.slug === params['slug'] || s.id === params['slug']) && s.status === 'active',
    );
    if (!service) throw notFound('Service');
    return embedServiceVendor(db, service);
  }),

  route('post', routes.services.requests, async ({ request }) => {
    const user = requireUser(request, ['customer']);
    const input = await readBody(request, serviceRequestSchema);
    const now = new Date().toISOString();
    const record: ServiceRequest = {
      id: nextId('sreq'),
      customerId: user.id,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      state: input.state,
      ...(input.city ? { city: input.city } : {}),
      ...(input.areaHectares ? { areaHectares: input.areaHectares } : {}),
      ...(input.budgetMajor ? { budget: makeMoney(input.budgetMajor) } : {}),
      ...(input.neededBy ? { neededBy: input.neededBy } : {}),
      status: 'open',
      quoteCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    getDb().serviceRequests.unshift(record);
    return created(record);
  }),

  route('get', routes.services.requests, ({ request, url }) => {
    const user = requireUser(request, ['customer']);
    return paginate(
      sortNewest(getDb().serviceRequests.filter((r) => r.customerId === user.id)),
      url,
      10,
    );
  }),

  route('get', routes.services.requestQuotes, ({ request, params }) => {
    const user = requireUser(request);
    const db = getDb();
    const record = db.serviceRequests.find((r) => r.id === params['id']);
    if (!record) throw notFound('Project');
    if (record.customerId !== user.id && !['admin', 'super_admin', 'support'].includes(user.role)) {
      throw new ApiError(403, 'forbidden', 'This project belongs to another customer');
    }
    return db.serviceQuotes
      .filter((q) => q.requestId === record.id)
      .map((q) => {
        const vendor = db.vendors.find((v) => v.id === q.vendorId);
        return vendor ? { ...q, vendor: summarize(vendor) } : q;
      });
  }),
];
