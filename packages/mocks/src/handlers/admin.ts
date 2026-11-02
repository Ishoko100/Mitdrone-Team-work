import {
  ADMIN_ROLES,
  routes,
  type AdminDashboardData,
  type AdminOrderDetail,
  type AdminVendorDetail,
  type Dispute,
  type User,
  type Vendor,
} from '@mitdrone/types';
import { z } from 'zod';

import { getDb, nextId, writeAudit, type Db } from '../db';
import {
  ADMIN_WRITE,
  ApiError,
  created,
  includesText,
  notFound,
  paginate,
  readBody,
  requireUser,
  route,
} from '../http';
import { dailySeries, embedVendor, filterProducts, isCounted, sortNewest } from '../lib';

const reasonSchema = z.object({ reason: z.string().optional() });
const refundSchema = z.object({ reason: z.string().min(3, 'Give a reason for the refund') });
const resolveSchema = z.object({
  outcome: z.enum(['refund', 'no_refund']),
  resolution: z.string().min(3),
});
const messageSchema = z.object({ body: z.string().min(1) });
const userPatchSchema = z.object({
  role: z.enum(['customer', 'admin', 'super_admin', 'support']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});
const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'super_admin', 'support']),
});
const money = z.object({
  amount: z.number().int().min(0),
  currency: z.enum(['NGN', 'USD', 'GBP', 'EUR']),
});
const settingsSchema = z
  .object({
    defaultCommissionRate: z.number().min(0).max(0.5),
    taxRate: z.number().min(0).max(0.3),
    shippingFlatRate: money,
    minimumPayout: money,
    payoutSchedule: z.enum(['weekly', 'biweekly', 'monthly']),
    currencies: z.array(z.enum(['NGN', 'USD', 'GBP', 'EUR'])).min(1),
    defaultCurrency: z.enum(['NGN', 'USD', 'GBP', 'EUR']),
    referralRewardRate: z.number().min(0).max(0.2),
    maintenanceMode: z.boolean(),
    supportEmail: z.string().email(),
  })
  .partial();
const exportSchema = z.object({
  entity: z.string(),
  format: z.enum(['csv', 'pdf']),
  rowCount: z.number().int().min(0),
});

const admin = (request: Request, write = false): User =>
  requireUser(request, write ? ADMIN_WRITE : ADMIN_ROLES);

function findVendor(db: Db, id: string | undefined): Vendor {
  const vendor = db.vendors.find((v) => v.id === id);
  if (!vendor) throw notFound('Vendor');
  return vendor;
}

function refundOrder(db: Db, orderId: string, note: string): void {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) throw notFound('Order');
  if (order.status === 'refunded')
    throw new ApiError(409, 'already_refunded', 'This order was already refunded');
  if (!order.paymentId) throw new ApiError(409, 'not_paid', 'This order has no payment to refund');
  const now = new Date().toISOString();
  order.status = 'refunded';
  order.updatedAt = now;
  order.timeline.push({ status: 'refunded', at: now, note });
  const payment = db.payments.find((p) => p.id === order.paymentId);
  if (payment) payment.status = 'refunded';
}

function vendorAction(action: 'approve' | 'reject' | 'suspend') {
  return async ({ request, params }: { request: Request; params: Record<string, string> }) => {
    const user = admin(request, true);
    const db = getDb();
    const vendor = findVendor(db, params['id']);
    const { reason } = await readBody(request, reasonSchema);
    if (action !== 'approve' && !reason)
      throw new ApiError(422, 'validation_error', 'A reason is required', { reason: ['Required'] });
    const kyc = db.kyc.find((k) => k.vendorId === vendor.id);
    const owner = db.users.find((u) => u.id === vendor.ownerId);
    const now = new Date().toISOString();
    if (action === 'approve') {
      vendor.status = 'approved';
      vendor.verified = true;
      vendor.kycStatus = 'verified';
      if (owner) owner.status = 'active';
      if (kyc) Object.assign(kyc, { status: 'verified', reviewedBy: user.id, reviewedAt: now });
    } else if (action === 'reject') {
      vendor.status = 'rejected';
      vendor.kycStatus = 'rejected';
      if (kyc)
        Object.assign(kyc, {
          status: 'rejected',
          reviewedBy: user.id,
          reviewedAt: now,
          ...(reason ? { rejectionReason: reason } : {}),
        });
    } else {
      vendor.status = 'suspended';
      if (owner) owner.status = 'suspended';
    }
    vendor.updatedAt = now;
    writeAudit(
      user,
      `vendor.${action}`,
      'vendor',
      vendor.id,
      `${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Suspended'} vendor ${vendor.name}`,
      reason ? { reason } : undefined,
    );
    return vendor;
  };
}

export const adminHandlers = [
  route('get', routes.admin.dashboard, ({ request }) => {
    admin(request);
    const db = getDb();
    const counted = db.orders.filter(isCounted);
    const gmv = counted.reduce((s, o) => s + o.total.amount, 0);
    const body: AdminDashboardData = {
      gmv: { amount: gmv, currency: 'NGN' },
      activeVendors: db.vendors.filter((v) => v.status === 'approved').length,
      pendingVendors: db.vendors.filter((v) => v.status === 'pending_review').length,
      orders: db.orders.length,
      openDisputes: db.disputes.filter((d) => d.status === 'open' || d.status === 'under_review')
        .length,
      gmvSeries: dailySeries(30, (date) =>
        counted.filter((o) => o.createdAt.startsWith(date)).reduce((s, o) => s + o.total.amount, 0),
      ),
    };
    return body;
  }),

  /* ---- vendors */
  route('get', routes.admin.vendors, ({ request, url }) => {
    admin(request);
    const q = url.searchParams;
    const items = getDb().vendors.filter(
      (v) =>
        (!q.get('status') || v.status === q.get('status')) &&
        (!q.get('type') || v.type === q.get('type')) &&
        includesText([v.name, v.email, v.city], q.get('q')),
    );
    return paginate(sortNewest(items), url, 20);
  }),

  route('get', routes.admin.vendor, ({ request, params }) => {
    admin(request);
    const db = getDb();
    const vendor = findVendor(db, params['id']);
    const orders = db.orders.filter((o) => o.vendorIds.includes(vendor.id));
    const revenue = orders
      .filter(isCounted)
      .flatMap((o) => o.items)
      .filter((i) => i.vendorId === vendor.id)
      .reduce((s, i) => s + i.total.amount, 0);
    const owner = db.users.find((u) => u.id === vendor.ownerId);
    const kyc = db.kyc.find((k) => k.vendorId === vendor.id);
    const balance = db.balances.find((b) => b.vendorId === vendor.id);
    const body: AdminVendorDetail = {
      vendor,
      ...(owner ? { owner } : {}),
      ...(kyc ? { kyc } : {}),
      stats: {
        revenue: { amount: revenue, currency: 'NGN' },
        orders: orders.length,
        products: db.products.filter((p) => p.vendorId === vendor.id).length,
        conversionRate: 3.2,
        pendingPayout: balance?.pending ?? { amount: 0, currency: 'NGN' },
      },
      recentOrders: sortNewest(orders).slice(0, 5),
      payouts: sortNewest(db.payouts.filter((p) => p.vendorId === vendor.id)),
      products: sortNewest(db.products.filter((p) => p.vendorId === vendor.id)).slice(0, 10),
    };
    return body;
  }),

  route('post', routes.admin.vendorApprove, vendorAction('approve')),
  route('post', routes.admin.vendorReject, vendorAction('reject')),
  route('post', routes.admin.vendorSuspend, vendorAction('suspend')),

  /* ---- products */
  route('get', routes.admin.products, ({ request, url }) => {
    admin(request);
    const db = getDb();
    const status = url.searchParams.get('status');
    const filtered = filterProducts(
      db,
      db.products.filter((p) => !status || p.status === status),
      url.searchParams,
    );
    const page = paginate(sortNewest(filtered), url, 20);
    return { ...page, data: page.data.map((p) => embedVendor(db, p)) };
  }),

  route('post', routes.admin.productApprove, ({ request, params }) => {
    const user = admin(request, true);
    const product = getDb().products.find((p) => p.id === params['id']);
    if (!product) throw notFound('Product');
    product.status = 'active';
    delete product.moderationNote;
    product.updatedAt = new Date().toISOString();
    writeAudit(user, 'product.approve', 'product', product.id, `Approved product ${product.title}`);
    return product;
  }),

  route('post', routes.admin.productFlag, async ({ request, params }) => {
    const user = admin(request, true);
    const product = getDb().products.find((p) => p.id === params['id']);
    if (!product) throw notFound('Product');
    const { reason } = await readBody(request, reasonSchema);
    if (!reason)
      throw new ApiError(422, 'validation_error', 'A reason is required', { reason: ['Required'] });
    product.status = 'flagged';
    product.moderationNote = reason;
    product.updatedAt = new Date().toISOString();
    writeAudit(user, 'product.flag', 'product', product.id, `Flagged product ${product.title}`, {
      reason,
    });
    return product;
  }),

  route('delete', routes.admin.product, ({ request, params }) => {
    const user = admin(request, true);
    const db = getDb();
    const product = db.products.find((p) => p.id === params['id']);
    if (!product) throw notFound('Product');
    db.products = db.products.filter((p) => p.id !== product.id);
    writeAudit(user, 'product.delete', 'product', product.id, `Deleted product ${product.title}`);
    return undefined;
  }),

  /* ---- orders */
  route('get', routes.admin.orders, ({ request, url }) => {
    admin(request);
    const q = url.searchParams;
    const items = getDb().orders.filter(
      (o) =>
        (!q.get('status') || o.status === q.get('status')) &&
        includesText([o.number, o.customerName, o.customerEmail], q.get('q')),
    );
    return paginate(sortNewest(items), url, 20);
  }),

  route('get', routes.admin.order, ({ request, params }) => {
    admin(request);
    const db = getDb();
    const order = db.orders.find((o) => o.id === params['id']);
    if (!order) throw notFound('Order');
    const payment = db.payments.find((p) => p.id === order.paymentId);
    const body: AdminOrderDetail = {
      order,
      ...(payment ? { payment } : {}),
      disputes: db.disputes.filter((d) => d.orderId === order.id),
    };
    return body;
  }),

  route('post', routes.admin.orderRefund, async ({ request, params }) => {
    const user = admin(request, true);
    const db = getDb();
    const { reason } = await readBody(request, refundSchema);
    refundOrder(db, params['id'] ?? '', reason);
    const order = db.orders.find((o) => o.id === params['id']);
    writeAudit(
      user,
      'order.refund',
      'order',
      params['id'] ?? '',
      `Refunded order ${order?.number ?? ''}`,
      { reason },
    );
    return order;
  }),

  /* ---- disputes */
  route('get', routes.admin.disputes, ({ request, url }) => {
    admin(request);
    const status = url.searchParams.get('status');
    return paginate(
      sortNewest(getDb().disputes.filter((d) => !status || d.status === status)),
      url,
      20,
    );
  }),

  route('get', routes.admin.dispute, ({ request, params }) => {
    admin(request);
    const dispute = getDb().disputes.find((d) => d.id === params['id']);
    if (!dispute) throw notFound('Dispute');
    return dispute;
  }),

  route('post', routes.admin.disputeAssign, ({ request, params }) => {
    const user = admin(request);
    const dispute = getDb().disputes.find((d) => d.id === params['id']);
    if (!dispute) throw notFound('Dispute');
    dispute.assignedTo = user.id;
    if (dispute.status === 'open') dispute.status = 'under_review';
    dispute.updatedAt = new Date().toISOString();
    writeAudit(
      user,
      'dispute.assign',
      'dispute',
      dispute.id,
      `Assigned dispute ${dispute.id} to ${user.name}`,
    );
    return dispute;
  }),

  route('post', routes.admin.disputeMessages, async ({ request, params }) => {
    const user = admin(request);
    const dispute = getDb().disputes.find((d) => d.id === params['id']);
    if (!dispute) throw notFound('Dispute');
    const { body } = await readBody(request, messageSchema);
    const message: Dispute['messages'][number] = {
      id: nextId('dm'),
      authorId: user.id,
      authorRole: user.role,
      body,
      createdAt: new Date().toISOString(),
    };
    dispute.messages.push(message);
    return created(message);
  }),

  route('post', routes.admin.disputeResolve, async ({ request, params }) => {
    const user = admin(request, true);
    const db = getDb();
    const dispute = db.disputes.find((d) => d.id === params['id']);
    if (!dispute) throw notFound('Dispute');
    if (dispute.status.startsWith('resolved') || dispute.status === 'closed')
      throw new ApiError(409, 'already_resolved', 'This dispute is already resolved');
    const { outcome, resolution } = await readBody(request, resolveSchema);
    if (outcome === 'refund')
      refundOrder(db, dispute.orderId, `Dispute ${dispute.id} resolved with refund`);
    dispute.status = outcome === 'refund' ? 'resolved_refund' : 'resolved_no_refund';
    dispute.resolution = resolution;
    dispute.updatedAt = new Date().toISOString();
    writeAudit(
      user,
      'dispute.resolve',
      'dispute',
      dispute.id,
      `Resolved dispute ${dispute.id}: ${outcome === 'refund' ? 'refund' : 'no refund'}`,
      { resolution },
    );
    return dispute;
  }),

  /* ---- payouts */
  route('get', routes.admin.payouts, ({ request, url }) => {
    admin(request);
    const q = url.searchParams;
    const items = getDb().payouts.filter(
      (p) =>
        (!q.get('status') || p.status === q.get('status')) &&
        (!q.get('vendorId') || p.vendorId === q.get('vendorId')),
    );
    return paginate(sortNewest(items), url, 20);
  }),

  route('post', routes.admin.payoutProcess, ({ request, params }) => {
    const user = admin(request, true);
    const payout = getDb().payouts.find((p) => p.id === params['id']);
    if (!payout) throw notFound('Payout');
    if (payout.status === 'paid')
      throw new ApiError(409, 'already_paid', 'This payout was already processed');
    const now = new Date().toISOString();
    Object.assign(payout, {
      status: 'paid',
      processedBy: user.id,
      processedAt: now,
      updatedAt: now,
    });
    delete payout.failureReason;
    writeAudit(
      user,
      'payout.process',
      'payout',
      payout.id,
      `Processed payout ${payout.id} for ${payout.vendorName}`,
    );
    return payout;
  }),

  route('post', routes.admin.payoutHold, async ({ request, params }) => {
    const user = admin(request, true);
    const payout = getDb().payouts.find((p) => p.id === params['id']);
    if (!payout) throw notFound('Payout');
    if (payout.status === 'paid')
      throw new ApiError(409, 'already_paid', 'A paid payout cannot be held');
    const { reason } = await readBody(request, reasonSchema);
    payout.status = 'on_hold';
    if (reason) payout.failureReason = reason;
    payout.updatedAt = new Date().toISOString();
    writeAudit(
      user,
      'payout.hold',
      'payout',
      payout.id,
      `Put payout ${payout.id} on hold`,
      reason ? { reason } : undefined,
    );
    return payout;
  }),

  /* ---- users */
  route('get', routes.admin.users, ({ request, url }) => {
    admin(request);
    const q = url.searchParams;
    const items = getDb().users.filter(
      (u) =>
        (!q.get('role') || u.role === q.get('role')) &&
        (!q.get('status') || u.status === q.get('status')) &&
        includesText([u.name, u.email], q.get('q')),
    );
    return paginate(sortNewest(items), url, 20);
  }),

  route('post', routes.admin.users, async ({ request }) => {
    const user = requireUser(request, ['super_admin']);
    const db = getDb();
    const input = await readBody(request, userCreateSchema);
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
      throw new ApiError(409, 'email_taken', 'That email is already in use', {
        email: ['Email already in use'],
      });
    const now = new Date().toISOString();
    const created_: User = {
      id: nextId('usr'),
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      status: 'active',
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(created_);
    writeAudit(
      user,
      'user.update_role',
      'user',
      created_.id,
      `Created ${input.role} account for ${input.name}`,
    );
    return created(created_);
  }),

  route('patch', routes.admin.user, async ({ request, params }) => {
    const actor = admin(request, true);
    const target = getDb().users.find((u) => u.id === params['id']);
    if (!target) throw notFound('User');
    const input = await readBody(request, userPatchSchema);
    if (input.role && input.role !== target.role) {
      if (actor.role !== 'super_admin')
        throw new ApiError(403, 'forbidden', 'Only a super admin can change roles');
      if (target.id === actor.id)
        throw new ApiError(409, 'self_demotion', 'You cannot change your own role');
      if (target.role.startsWith('vendor'))
        throw new ApiError(
          409,
          'invalid_role_change',
          'Vendor team roles are managed by the vendor',
        );
      const from = target.role;
      target.role = input.role;
      writeAudit(
        actor,
        'user.update_role',
        'user',
        target.id,
        `Changed ${target.name} from ${from} to ${input.role}`,
      );
    }
    if (input.status && input.status !== target.status) {
      target.status = input.status;
      writeAudit(
        actor,
        'user.suspend',
        'user',
        target.id,
        `${input.status === 'suspended' ? 'Suspended' : 'Reactivated'} ${target.name}`,
      );
    }
    target.updatedAt = new Date().toISOString();
    return target;
  }),

  /* ---- settings, audit, export */
  route('get', routes.admin.settings, ({ request }) => {
    admin(request);
    return getDb().settings;
  }),

  route('put', routes.admin.settings, async ({ request }) => {
    const user = requireUser(request, ['super_admin']);
    const db = getDb();
    const input = await readBody(request, settingsSchema);
    const changed = Object.keys(input);
    Object.assign(db.settings, input, { updatedAt: new Date().toISOString(), updatedBy: user.id });
    writeAudit(
      user,
      'settings.update',
      'settings',
      'platform',
      `Updated platform settings: ${changed.join(', ') || 'no changes'}`,
      { changed },
    );
    return db.settings;
  }),

  route('get', routes.admin.auditLogs, ({ request, url }) => {
    admin(request);
    const q = url.searchParams;
    const items = getDb().auditLogs.filter(
      (a) =>
        (!q.get('action') || a.action === q.get('action')) &&
        (!q.get('entityType') || a.entityType === q.get('entityType')) &&
        (!q.get('actorId') || a.actorId === q.get('actorId')) &&
        includesText([a.summary, a.actorName, a.entityId], q.get('q')),
    );
    return paginate(sortNewest(items), url, 25);
  }),

  route('post', routes.admin.exports, async ({ request }) => {
    const user = admin(request);
    const input = await readBody(request, exportSchema);
    writeAudit(
      user,
      'export.create',
      'settings',
      input.entity,
      `Exported ${input.rowCount} ${input.entity} rows as ${input.format.toUpperCase()}`,
      { ...input },
    );
    return { ok: true };
  }),
];
