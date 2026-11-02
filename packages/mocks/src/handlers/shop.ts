import { COUPONS } from '@mitdrone/data';
import {
  addressSchema,
  quoteRequestSchema,
  routes,
  type Address,
  type Cart,
  type CartItem,
  type CartQuoteRequest,
  type ConfirmCheckoutRequest,
  type Order,
  type PaymentIntent,
  type Product,
  type ReferralSummary,
  type Variant,
} from '@mitdrone/types';
import { z } from 'zod';

import { getDb, nextId, type Db } from '../db';
import { ApiError, created, notFound, paginate, readBody, requireUser, route } from '../http';
import { isCustomer, sortNewest } from '../lib';

/* ------------------------------------------------------------- cart pricing */

const itemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(50),
});
const quoteSchema = z.object({
  items: z.array(itemSchema).min(1, 'Your cart is empty'),
  couponCode: z.string().optional(),
});
const addressInput = addressSchema;
const intentSchema = z.object({
  items: z.array(itemSchema).min(1),
  shippingAddress: addressInput,
  cartId: z.string().optional(),
});
const confirmSchema = intentSchema.extend({
  paymentIntentId: z.string(),
  couponCode: z.string().optional(),
  paymentMethod: z
    .object({ last4: z.string().optional(), brand: z.string().optional() })
    .optional(),
});

interface Line {
  product: Product;
  variant?: Variant;
  quantity: number;
}

function priceCart(db: Db, req: CartQuoteRequest): { cart: Cart; lines: Line[] } {
  const currency = 'NGN' as const;
  const lines: Line[] = [];
  const items: CartItem[] = req.items.map((input) => {
    const product = db.products.find((p) => p.id === input.productId && p.status === 'active');
    if (!product) throw notFound('Product');
    if (product.listingType === 'rent')
      throw new ApiError(422, 'not_purchasable', 'Rentals are booked, not purchased');
    const variant = input.variantId
      ? product.variants.find((v) => v.id === input.variantId)
      : undefined;
    if (input.variantId && !variant) throw notFound('Variant');
    const stock = (variant ?? product).inventory.quantity;
    if (input.quantity > stock) {
      throw new ApiError(409, 'insufficient_stock', `Only ${stock} left of ${product.title}`, {
        items: [`${product.title}: only ${stock} in stock`],
      });
    }
    lines.push({ product, ...(variant ? { variant } : {}), quantity: input.quantity });
    return {
      id: `ci_${product.id}_${variant?.id ?? 'base'}`,
      productId: product.id,
      ...(variant ? { variantId: variant.id } : {}),
      vendorId: product.vendorId,
      title: variant ? `${product.title} (${variant.name})` : product.title,
      slug: product.slug,
      ...(product.images[0] ? { imageUrl: product.images[0].url } : {}),
      unitPrice: (variant ?? product).price,
      quantity: input.quantity,
      maxQuantity: stock,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.unitPrice.amount * i.quantity, 0);
  const perVendor = new Map<string, number>();
  for (const i of items)
    perVendor.set(i.vendorId, (perVendor.get(i.vendorId) ?? 0) + i.unitPrice.amount * i.quantity);
  let shipping = 0;
  for (const [vendorId, vendorSubtotal] of perVendor) {
    const vendor = db.vendors.find((v) => v.id === vendorId);
    const free = vendor?.shipping.freeShippingThreshold;
    if (!free || vendorSubtotal < free.amount)
      shipping += vendor?.shipping.flatRate?.amount ?? db.settings.shippingFlatRate.amount;
  }
  const coupon = req.couponCode ? COUPONS[req.couponCode.toUpperCase()] : undefined;
  if (req.couponCode && !coupon)
    throw new ApiError(422, 'invalid_coupon', 'That coupon code is not valid');
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const tax = Math.round(subtotal * db.settings.taxRate);
  const m = (amount: number) => ({ amount, currency });
  return {
    lines,
    cart: {
      id: 'cart_mock',
      items,
      subtotal: m(subtotal),
      shipping: m(shipping),
      tax: m(tax),
      discount: m(discount),
      total: m(subtotal + shipping + tax - discount),
      ...(req.couponCode ? { couponCode: req.couponCode.toUpperCase() } : {}),
    },
  };
}

/* ------------------------------------------------------------------ handlers */

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});
const reviewTopic = quoteRequestSchema.extend({ topic: z.string().optional() });
const messageSchema = z.object({
  body: z.string().min(1).max(300),
  isQuestion: z.boolean().optional(),
});

export const shopHandlers = [
  route('post', routes.checkout.quote, async ({ request }) => {
    const input = await readBody(request, quoteSchema);
    return priceCart(getDb(), input).cart;
  }),

  route('post', routes.checkout.paymentIntent, async ({ request }) => {
    requireUser(request);
    const db = getDb();
    const input = await readBody(request, intentSchema);
    const { cart } = priceCart(db, { items: input.items });
    const id = nextId('pi_mock');
    const intent: PaymentIntent = {
      id,
      clientSecret: `${id}_secret_mock`,
      amount: cart.total,
      status: 'requires_payment_method',
    };
    db.intents.set(id, intent);
    return created(intent);
  }),

  route('post', routes.checkout.confirm, async ({ request }) => {
    const user = requireUser(request);
    const db = getDb();
    const input = (await readBody(request, confirmSchema)) as ConfirmCheckoutRequest;
    const intent = db.intents.get(input.paymentIntentId);
    if (!intent) throw notFound('Payment intent');
    if (intent.status === 'succeeded')
      throw new ApiError(409, 'already_confirmed', 'This payment was already completed');
    if (input.paymentMethod?.last4 === '0002') {
      throw new ApiError(402, 'card_declined', 'Your card was declined. Try a different card.');
    }
    const { cart, lines } = priceCart(db, {
      items: input.items,
      ...(input.couponCode ? { couponCode: input.couponCode } : {}),
    });
    const now = new Date().toISOString();
    const orderId = nextId('ord');
    const paymentId = nextId('pay');
    const vendorIds = [...new Set(cart.items.map((i) => i.vendorId))];
    const commission = cart.items.reduce((s, i) => {
      const rate =
        db.vendors.find((v) => v.id === i.vendorId)?.commissionRate ??
        db.settings.defaultCommissionRate;
      return s + Math.round(i.unitPrice.amount * i.quantity * rate);
    }, 0);
    const address: Address = {
      id: nextId('addr'),
      isDefault: false,
      ...input.shippingAddress,
      country: input.shippingAddress.country ?? 'NG',
    };
    const order: Order = {
      id: orderId,
      number: `MD-${1000 + db.orders.length}`,
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      vendorIds,
      items: cart.items.map((i, k) => ({
        id: `oi_${orderId}_${k + 1}`,
        productId: i.productId,
        ...(i.variantId ? { variantId: i.variantId } : {}),
        vendorId: i.vendorId,
        title: i.title,
        ...(i.imageUrl ? { imageUrl: i.imageUrl } : {}),
        sku: lines[k]?.variant?.inventory.sku ?? lines[k]?.product.inventory.sku ?? '',
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        total: { amount: i.unitPrice.amount * i.quantity, currency: 'NGN' },
      })),
      status: 'paid',
      shippingAddress: address,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      tax: cart.tax,
      discount: cart.discount,
      total: cart.total,
      commission: { amount: commission, currency: 'NGN' },
      paymentId,
      timeline: [
        { status: 'pending', at: now },
        { status: 'paid', at: now },
      ],
      createdAt: now,
      updatedAt: now,
    };
    for (const { product, variant, quantity } of lines) {
      (variant ?? product).inventory.quantity -= quantity;
      product.salesCount += quantity;
    }
    db.orders.unshift(order);
    db.payments.unshift({
      id: paymentId,
      orderId,
      amount: cart.total,
      status: 'succeeded',
      method: 'card',
      last4: input.paymentMethod?.last4 ?? '4242',
      brand: input.paymentMethod?.brand ?? 'visa',
      providerReference: intent.id,
      createdAt: now,
      updatedAt: now,
    });
    db.intents.set(intent.id, { ...intent, status: 'succeeded' });
    for (const vendorId of vendorIds) {
      const owner = db.vendors.find((v) => v.id === vendorId)?.ownerId;
      if (owner)
        db.notifications.unshift({
          id: nextId('ntf'),
          userId: owner,
          type: 'order',
          title: 'New order received',
          body: `Order ${order.number} needs processing.`,
          href: '/orders',
          read: false,
          createdAt: now,
        });
    }
    return created(order);
  }),

  route('get', routes.me.profile, ({ request }) => requireUser(request)),

  route('patch', routes.me.profile, async ({ request }) => {
    const user = requireUser(request);
    const input = await readBody(request, profileSchema);
    if (input.name) user.name = input.name;
    if (input.phone) user.phone = input.phone;
    user.updatedAt = new Date().toISOString();
    return user;
  }),

  route('get', routes.me.orders, ({ request, url }) => {
    const user = requireUser(request);
    const status = url.searchParams.get('status');
    return paginate(
      sortNewest(
        getDb().orders.filter((o) => o.customerId === user.id && (!status || o.status === status)),
      ),
      url,
      10,
    );
  }),

  route('get', routes.me.order, ({ request, params }) => {
    const user = requireUser(request);
    const order = getDb().orders.find((o) => o.id === params['id'] && o.customerId === user.id);
    if (!order) throw notFound('Order');
    return order;
  }),

  route('get', routes.me.addresses, ({ request }) => {
    const user = requireUser(request, ['customer']);
    return isCustomer(user) ? user.addresses : [];
  }),

  route('post', routes.me.addresses, async ({ request }) => {
    const user = requireUser(request, ['customer']);
    if (!isCustomer(user)) throw new ApiError(403, 'forbidden', 'Customers only');
    const input = await readBody(
      request,
      addressInput.extend({ isDefault: z.boolean().optional(), label: z.string().optional() }),
    );
    const address: Address = {
      id: nextId('addr'),
      ...input,
      country: input.country ?? 'NG',
      isDefault: input.isDefault ?? user.addresses.length === 0,
    };
    if (address.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
    user.addresses.push(address);
    return created(address);
  }),

  route('delete', routes.me.address, ({ request, params }) => {
    const user = requireUser(request, ['customer']);
    if (!isCustomer(user)) throw new ApiError(403, 'forbidden', 'Customers only');
    const before = user.addresses.length;
    user.addresses = user.addresses.filter((a) => a.id !== params['id']);
    if (user.addresses.length === before) throw notFound('Address');
    return undefined;
  }),

  route('get', routes.me.referrals, ({ request }) => {
    const user = requireUser(request, ['customer']);
    const db = getDb();
    const code = isCustomer(user) ? user.referralCode : '';
    const empty = { kobo: { amount: 0, currency: 'NGN' as const } };
    const fallback: ReferralSummary = {
      code,
      link: `https://mitdrone.example/register?ref=${code}`,
      peopleReferred: 0,
      purchases: 0,
      pendingRewards: empty.kobo,
      availableRewards: empty.kobo,
      totalEarned: empty.kobo,
      entries: [],
    };
    return db.referrals[user.id] ?? fallback;
  }),

  route('get', routes.me.notifications, ({ request, url }) => {
    const user = requireUser(request);
    return paginate(sortNewest(getDb().notifications.filter((n) => n.userId === user.id)), url, 20);
  }),

  route('post', routes.me.notificationRead, ({ request, params }) => {
    const user = requireUser(request);
    const note = getDb().notifications.find((n) => n.id === params['id'] && n.userId === user.id);
    if (!note) throw notFound('Notification');
    note.read = true;
    return note;
  }),

  route('get', routes.live.sessions, ({ url }) => {
    const q = url.searchParams;
    const order = { live: 0, scheduled: 1, ended: 2 } as const;
    const items = getDb()
      .liveSessions.filter(
        (s) =>
          (!q.get('status') || s.status === q.get('status')) &&
          (!q.get('type') || s.type === q.get('type')),
      )
      .sort((a, b) => order[a.status] - order[b.status] || a.startsAt.localeCompare(b.startsAt));
    return paginate(items, url, 12);
  }),

  route('get', routes.live.session, ({ params }) => {
    const session = getDb().liveSessions.find((s) => s.id === params['id']);
    if (!session) throw notFound('Live session');
    return session;
  }),

  route('get', routes.live.messages, ({ params }) =>
    getDb().liveMessages.filter((m) => m.sessionId === params['id']),
  ),

  route('post', routes.live.messages, async ({ request, params }) => {
    const user = requireUser(request);
    const db = getDb();
    if (!db.liveSessions.some((s) => s.id === params['id'])) throw notFound('Live session');
    const input = await readBody(request, messageSchema);
    const message = {
      id: nextId('lm'),
      sessionId: params['id'] ?? '',
      authorName: user.name,
      body: input.body,
      isQuestion: input.isQuestion ?? input.body.includes('?'),
      createdAt: new Date().toISOString(),
    };
    db.liveMessages.push(message);
    return created(message);
  }),

  route('get', routes.content.pages, ({ url }) => {
    const section = url.searchParams.get('section');
    return getDb().contentPages.filter((p) => !section || p.section === section);
  }),

  route('get', routes.content.page, ({ params }) => {
    const page = getDb().contentPages.find((p) => p.slug === params['slug']);
    if (!page) throw notFound('Page');
    return page;
  }),

  route('post', routes.content.businessQuote, async ({ request }) => {
    const input = await readBody(request, reviewTopic);
    return created({ id: nextId('quote'), status: 'received', email: input.email });
  }),
];
