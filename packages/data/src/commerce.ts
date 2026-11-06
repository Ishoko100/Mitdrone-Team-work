import { slugify } from '@mitdrone/utils';

import { addHours, at, daysAhead, daysAgo, faker, kobo, makeId, naira, pad, round1 } from './rng';

import type {
  Category,
  Customer,
  Dispute,
  DisputeReason,
  DisputeStatus,
  LedgerEntry,
  Manufacturer,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  Payout,
  Product,
  ProductCondition,
  ProductKind,
  ProductStatus,
  Review,
  Vendor,
  VendorBalance,
} from '@mitdrone/types';

/* ------------------------------------------------------------------ products */

interface ProductOpts {
  featured?: boolean;
  /** Percent off. The tuple price becomes compareAtPrice. */
  deal?: number;
  /** [daily, weekly, monthly, deposit] in naira. Makes this a rental listing. */
  rent?: [number, number, number, number];
  status?: ProductStatus;
  stock?: number;
  variants?: [name: string, deltaNaira: number][];
}
type ProductDef = [
  title: string,
  brand: string,
  kind: ProductKind,
  condition: ProductCondition,
  priceNaira: number,
  categories: string[],
  vendorIndex: number,
  opts?: ProductOpts,
];

/**
 * ILLUSTRATIVE seed catalogue. Prices are plausible placeholders, not live quotes, and
 * specs are intentionally generic so no real-world technical claims are made.
 */
export const PRODUCT_DEFS: ProductDef[] = [
  [
    'DJI Mini 4 Pro Fly More Combo',
    'DJI',
    'drone',
    'new',
    1_450_000,
    ['consumer-drones', 'photography-and-filmmaking-drones'],
    1,
    {
      featured: true,
      stock: 12,
      variants: [
        ['Standard', 0],
        ['Fly More Combo', 220_000],
      ],
    },
  ],
  [
    'DJI Air 3 Fly More Combo',
    'DJI',
    'drone',
    'new',
    1_950_000,
    ['consumer-drones', 'photography-and-filmmaking-drones'],
    1,
    {
      featured: true,
      deal: 10,
      stock: 9,
      variants: [
        ['Standard', 0],
        ['Fly More Combo', 250_000],
      ],
    },
  ],
  [
    'DJI Mavic 3 Pro',
    'DJI',
    'drone',
    'new',
    3_650_000,
    ['photography-and-filmmaking-drones'],
    3,
    {
      featured: true,
      stock: 6,
      variants: [
        ['Drone only', 0],
        ['Cine Premium Combo', 1_100_000],
      ],
    },
  ],
  [
    'DJI Mavic 3 Enterprise (M3E)',
    'DJI',
    'drone',
    'new',
    5_900_000,
    ['enterprise-drones', 'mapping-and-surveying-drones', 'inspection-drones'],
    1,
    { featured: true, stock: 5 },
  ],
  [
    'DJI Mavic 3 Thermal (M3T)',
    'DJI',
    'drone',
    'new',
    6_800_000,
    ['enterprise-drones', 'inspection-drones', 'security-and-surveillance-drones'],
    3,
    { featured: true, deal: 10, stock: 4 },
  ],
  [
    'DJI Matrice 350 RTK',
    'DJI',
    'drone',
    'new',
    18_500_000,
    ['enterprise-drones', 'inspection-drones'],
    3,
    { featured: true, stock: 2 },
  ],
  [
    'DJI Agras T50 Spraying Drone',
    'DJI',
    'drone',
    'new',
    14_900_000,
    ['agricultural-drones'],
    2,
    { featured: true, stock: 3 },
  ],
  [
    'DJI Agras T25 Spraying Drone',
    'DJI',
    'drone',
    'new',
    9_400_000,
    ['agricultural-drones'],
    2,
    { featured: true, deal: 10, stock: 4 },
  ],
  [
    'DJI Phantom 4 RTK',
    'DJI',
    'drone',
    'new',
    4_900_000,
    ['mapping-and-surveying-drones'],
    3,
    { stock: 3 },
  ],
  ['DJI Avata 2 FPV Combo', 'DJI', 'drone', 'new', 1_250_000, ['fpv-drones'], 1, { stock: 8 }],
  [
    'Autel EVO Lite+ Premium Bundle',
    'Autel Robotics',
    'drone',
    'new',
    1_850_000,
    ['consumer-drones', 'photography-and-filmmaking-drones'],
    3,
    { stock: 7 },
  ],
  [
    'Autel EVO Max 4N',
    'Autel Robotics',
    'drone',
    'new',
    6_200_000,
    ['enterprise-drones', 'security-and-surveillance-drones'],
    3,
    { stock: 3 },
  ],
  [
    'Autel EVO II Dual 640T V3',
    'Autel Robotics',
    'drone',
    'new',
    8_900_000,
    ['inspection-drones', 'security-and-surveillance-drones'],
    3,
    { stock: 2 },
  ],
  [
    'Parrot ANAFI USA',
    'Parrot',
    'drone',
    'new',
    7_400_000,
    ['enterprise-drones', 'security-and-surveillance-drones'],
    3,
    { stock: 2 },
  ],
  ['Parrot ANAFI Ai', 'Parrot', 'drone', 'new', 5_200_000, ['inspection-drones'], 3, { stock: 3 }],
  [
    'Skydio X10',
    'Skydio',
    'drone',
    'new',
    16_800_000,
    ['enterprise-drones', 'inspection-drones'],
    3,
    { stock: 2 },
  ],
  [
    'Briech Survey Fixed-Wing',
    'Briech Drones',
    'drone',
    'new',
    8_500_000,
    ['fixed-wing-drones', 'mapping-and-surveying-drones'],
    4,
    { featured: true, stock: 4 },
  ],
  [
    'Briech Crop Sprayer 20L',
    'Briech Drones',
    'drone',
    'new',
    5_800_000,
    ['agricultural-drones'],
    4,
    { stock: 6 },
  ],
  [
    'Terra VTOL Mapper',
    'Terra Drones',
    'drone',
    'new',
    12_300_000,
    ['vtol-drones', 'mapping-and-surveying-drones'],
    5,
    { featured: true, stock: 2 },
  ],
  [
    'Terra Inspection Quad',
    'Terra Drones',
    'drone',
    'new',
    4_300_000,
    ['inspection-drones'],
    5,
    { stock: 5 },
  ],
  [
    'Ken Drone Delivery Quad',
    'Ken Drone',
    'drone',
    'new',
    3_900_000,
    ['delivery-drones'],
    6,
    { stock: 5 },
  ],
  [
    'Ken Drone Security Patrol',
    'Ken Drone',
    'drone',
    'new',
    2_750_000,
    ['security-and-surveillance-drones'],
    6,
    { deal: 10, stock: 6 },
  ],
  [
    'DJI Mavic 2 Pro (Used)',
    'DJI',
    'drone',
    'used',
    650_000,
    ['used-drones', 'photography-and-filmmaking-drones'],
    8,
    { stock: 1 },
  ],
  [
    'DJI Phantom 4 Pro V2 (Refurbished)',
    'DJI',
    'drone',
    'refurbished',
    900_000,
    ['refurbished-drones', 'photography-and-filmmaking-drones'],
    8,
    { stock: 2 },
  ],
  [
    'DJI Mini 3 (Used, Like New)',
    'DJI',
    'drone',
    'used',
    720_000,
    ['used-drones', 'consumer-drones'],
    8,
    { stock: 1 },
  ],
  [
    'Intelligent Flight Battery (Enterprise)',
    'DJI',
    'accessory',
    'new',
    450_000,
    ['batteries-and-chargers'],
    1,
    { stock: 20 },
  ],
  [
    '100W Battery Charging Hub',
    'DJI',
    'accessory',
    'new',
    120_000,
    ['batteries-and-chargers'],
    1,
    { stock: 15 },
  ],
  [
    'Low-Noise Propellers (Pair)',
    'DJI',
    'accessory',
    'new',
    35_000,
    ['propellers'],
    1,
    { deal: 10, stock: 40 },
  ],
  [
    'ND Filter Set (ND8/16/32/64)',
    'SkyGear',
    'accessory',
    'new',
    85_000,
    ['nd-filters', 'gimbals-and-mounts'],
    1,
    { stock: 18 },
  ],
  [
    'Weatherproof Drone Backpack 25L',
    'SkyGear',
    'accessory',
    'new',
    180_000,
    ['drone-cases-and-backpacks'],
    1,
    { stock: 14 },
  ],
  [
    'Foldable Landing Pad 110cm',
    'SkyGear',
    'accessory',
    'new',
    25_000,
    ['landing-pads', 'safety-equipment'],
    1,
    { stock: 60 },
  ],
  [
    'Anti-Collision Strobe Light',
    'SkyGear',
    'accessory',
    'new',
    18_000,
    ['safety-equipment'],
    1,
    { stock: 2 },
  ],
  [
    'D-RTK 2 Mobile Station',
    'DJI',
    'equipment',
    'new',
    1_100_000,
    ['rtk-systems', 'gps-rtk-accessories', 'mapping-equipment'],
    3,
    { stock: 4 },
  ],
  [
    'Enterprise Drone Ground Control Station',
    'DJI',
    'equipment',
    'new',
    2_400_000,
    ['rtk-systems', 'mapping-equipment'],
    3,
    { stock: 5 },
  ],
  [
    'Aerial Survey GNSS Base Station',
    'SkyGear',
    'equipment',
    'new',
    1_850_000,
    ['gps-rtk-accessories', 'mapping-equipment'],
    5,
    { stock: 4 },
  ],
  [
    'Drone LiDAR Mapping System',
    'DJI',
    'equipment',
    'new',
    7_500_000,
    ['mapping-equipment', 'sensors'],
    3,
    { stock: 2 },
  ],
  [
    'Portable Drone Operations Console',
    'Terra Drones',
    'equipment',
    'new',
    980_000,
    ['mapping-equipment', 'controllers'],
    5,
    { stock: 6 },
  ],
  [
    'Zenmuse Thermal Payload (H20T)',
    'DJI',
    'payload',
    'new',
    9_800_000,
    ['payloads', 'thermal-cameras', 'sensors'],
    3,
    { stock: 2 },
  ],
  [
    'Gimbal Camera Module (Spare)',
    'DJI',
    'spare_part',
    'new',
    380_000,
    ['spare-parts'],
    1,
    { stock: 5 },
  ],
  [
    'Rental: DJI Mavic 3 Enterprise',
    'DJI',
    'drone',
    'new',
    85_000,
    ['enterprise-drones', 'mapping-and-surveying-drones'],
    7,
    { rent: [85_000, 480_000, 1_600_000, 1_500_000], stock: 3 },
  ],
  [
    'Rental: DJI Mini 4 Pro',
    'DJI',
    'drone',
    'new',
    25_000,
    ['consumer-drones'],
    7,
    { rent: [25_000, 140_000, 450_000, 400_000], stock: 5 },
  ],
  [
    'Rental: DJI Air 3',
    'DJI',
    'drone',
    'new',
    35_000,
    ['photography-and-filmmaking-drones'],
    7,
    { rent: [35_000, 200_000, 650_000, 600_000], stock: 4 },
  ],
  [
    'Rental: DJI Agras T25 (per day)',
    'DJI',
    'drone',
    'new',
    120_000,
    ['agricultural-drones'],
    2,
    { rent: [120_000, 700_000, 2_400_000, 2_000_000], stock: 2 },
  ],
  [
    'DJI Mini 3 Pro (New listing)',
    'DJI',
    'drone',
    'new',
    1_150_000,
    ['consumer-drones'],
    1,
    { status: 'pending_review', stock: 6 },
  ],
  [
    'Mavic 3 Pro (Unverified, too good to be true)',
    'DJI',
    'drone',
    'new',
    900_000,
    ['photography-and-filmmaking-drones'],
    8,
    { status: 'flagged', stock: 1 },
  ],
];

export function buildProducts(vendors: Vendor[], manufacturers: Manufacturer[]): Product[] {
  const manufacturerByBrand = new Map(manufacturers.map((m) => [m.name, m.id]));
  return PRODUCT_DEFS.map((def, i) => {
    const [title, brand, kind, condition, price, cats, vIdx, opts = {}] = def;
    const vendor = vendors[vIdx - 1];
    if (!vendor) throw new Error(`Unknown vendor index ${vIdx} for "${title}"`);
    const n = i + 1;
    const sku = `MD-${pad(n)}`;
    const listPrice = naira(price);
    const sale = opts.deal ? naira(Math.round(price * (1 - opts.deal / 100))) : listPrice;
    const stock = opts.stock ?? 10;
    const tint = (i % 3) + 1;
    const imageKind = kind === 'spare_part' ? 'part' : kind;
    const inventory = {
      sku,
      quantity: stock,
      lowStockThreshold: 3,
      trackInventory: true,
      allowBackorder: false,
    };
    const manufacturerId = manufacturerByBrand.get(brand);
    return {
      id: makeId('prd', n),
      slug: slugify(title),
      title,
      shortDescription: `${title} sold by ${vendor.name}, ${vendor.city}.`,
      description: `<p>${title} from <strong>${vendor.name}</strong>. ${faker.lorem.sentences(2)}</p><ul><li>${condition === 'new' ? 'Brand new, sealed' : 'Inspected by the seller'}</li><li>Ships from ${vendor.city}</li><li>Covered by Mitdrone Buyer Protection</li></ul>`,
      kind,
      listingType: opts.rent ? 'rent' : 'sale',
      condition,
      status: opts.status ?? 'active',
      vendorId: vendor.id,
      ...(manufacturerId ? { manufacturerId } : {}),
      brand,
      categoryIds: cats.map((slug) => `cat_${slug}`),
      images: [
        { url: `/placeholders/${imageKind}-${tint}.svg`, alt: title },
        {
          url: `/placeholders/${imageKind}-${((i + 1) % 3) + 1}.svg`,
          alt: `${title}, alternate view`,
        },
      ],
      price: sale,
      ...(!opts.rent
        ? {
            compareAtPrice: opts.deal ? listPrice : naira(Math.round(price * 1.1)),
            ...(opts.deal ? { dealEndsAt: daysAhead(5) } : {}),
          }
        : {}),
      ...(opts.rent
        ? {
            rental: {
              daily: naira(opts.rent[0]),
              weekly: naira(opts.rent[1]),
              monthly: naira(opts.rent[2]),
              deposit: naira(opts.rent[3]),
              minDays: 1,
            },
          }
        : {}),
      variants: (opts.variants ?? []).map(([name, delta], k) => ({
        id: `var_${pad(n)}_${k + 1}`,
        name,
        options: { Package: name },
        price: naira(Math.round(price * (opts.deal ? 1 - opts.deal / 100 : 1)) + delta),
        inventory: {
          ...inventory,
          sku: `${sku}-${k + 1}`,
          quantity: Math.max(1, Math.floor(stock / 2)),
        },
      })),
      inventory,
      specs: {
        Brand: brand,
        Condition: condition.charAt(0).toUpperCase() + condition.slice(1),
        Warranty: condition === 'new' ? '12 months' : '3 months',
        'Ships from': vendor.city,
      },
      tags: [brand.toLowerCase(), kind.replace('_', ' '), condition, ...cats.slice(0, 2)],
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      featured: opts.featured ?? false,
      ...(opts.status === 'flagged'
        ? { moderationNote: 'Price is far below market. Awaiting seller proof of ownership.' }
        : {}),
      createdAt: daysAgo(10 + i * 2),
      updatedAt: daysAgo(i % 9),
    };
  });
}

export function countCategoryProducts(categories: Category[], products: Product[]): void {
  for (const category of categories) {
    category.productCount = products.filter(
      (p) => p.status === 'active' && p.categoryIds.includes(category.id),
    ).length;
  }
}

/* -------------------------------------------------------------------- orders */

const STEPS: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'completed'];
const STATUS_CYCLE: OrderStatus[] = [
  'completed',
  'completed',
  'delivered',
  'shipped',
  'completed',
  'cancelled',
  'delivered',
  'completed',
  'refunded',
  'completed',
  'processing',
  'completed',
];
const CARRIERS = ['GIG Logistics', 'DHL', 'Kwik Delivery'];
export const COUNTED_STATUSES: readonly OrderStatus[] = [
  'paid',
  'processing',
  'shipped',
  'delivered',
  'completed',
];

function timelineFor(status: OrderStatus): OrderStatus[] {
  if (status === 'cancelled') return ['pending', 'cancelled'];
  if (status === 'refunded')
    return ['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded'];
  return STEPS.slice(0, STEPS.indexOf(status) + 1);
}

export function buildOrders(
  products: Product[],
  vendors: Vendor[],
  customers: Customer[],
): { orders: Order[]; payments: Payment[] } {
  const sellable = products.filter((p) => p.status === 'active' && p.listingType === 'sale');
  const vendorById = new Map(vendors.map((v) => [v.id, v]));
  const orders: Order[] = [];
  const payments: Payment[] = [];

  for (let i = 0; i < 70; i++) {
    const customer = i < 7 ? at(customers, 0) : at(customers, i);
    const address = at(customer.addresses, 0);
    const ageDays = Math.max(0, 88 - i * 1.25);
    const status: OrderStatus =
      ageDays < 6
        ? at<OrderStatus>(['pending', 'paid', 'processing', 'paid', 'processing', 'shipped'], i)
        : at(STATUS_CYCLE, i);

    const wanted = 1 + (i % 3 === 0 ? 1 : 0) + (i % 8 === 0 ? 1 : 0);
    const picked: Product[] = [];
    for (let k = 0; k < wanted; k++) {
      const product = at(sellable, i * 5 + k * 7);
      if (!picked.some((p) => p.id === product.id)) picked.push(product);
    }

    const items: OrderItem[] = picked.map((product, k) => {
      const quantity = i % 5 === 0 && product.price.amount < 50_000_000 ? 2 : 1;
      return {
        id: `oi_${pad(i + 1)}_${k + 1}`,
        productId: product.id,
        vendorId: product.vendorId,
        title: product.title,
        ...(product.images[0] ? { imageUrl: product.images[0].url } : {}),
        sku: product.inventory.sku,
        unitPrice: product.price,
        quantity,
        total: kobo(product.price.amount * quantity),
      };
    });

    const vendorIds = [...new Set(items.map((item) => item.vendorId))];
    const subtotal = items.reduce((sum, item) => sum + item.total.amount, 0);
    const shipping = vendorIds.length * 850_000;
    const tax = Math.round(subtotal * 0.075);
    const discount = i % 9 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + shipping + tax - discount;
    const commission = items.reduce(
      (sum, item) =>
        sum +
        Math.round(item.total.amount * (vendorById.get(item.vendorId)?.commissionRate ?? 0.08)),
      0,
    );

    const createdAt = daysAgo(ageDays);
    const timeline = timelineFor(status).map((step, k) => ({
      status: step,
      at: addHours(createdAt, k * 18),
    }));
    const paid = status !== 'pending' && status !== 'cancelled';
    const shipped = ['shipped', 'delivered', 'completed', 'refunded'].includes(status);
    const number = `MD-${1000 + i}`;

    orders.push({
      id: makeId('ord', i + 1),
      number,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      vendorIds,
      items,
      status,
      shippingAddress: address,
      subtotal: kobo(subtotal),
      shipping: kobo(shipping),
      tax: kobo(tax),
      discount: kobo(discount),
      total: kobo(total),
      commission: kobo(commission),
      ...(paid ? { paymentId: makeId('pay', i + 1) } : {}),
      ...(shipped ? { trackingNumber: `TRK${700000 + i * 37}`, carrier: at(CARRIERS, i) } : {}),
      timeline,
      createdAt,
      updatedAt: timeline[timeline.length - 1]?.at ?? createdAt,
    });

    if (paid) {
      payments.push({
        id: makeId('pay', i + 1),
        orderId: makeId('ord', i + 1),
        amount: kobo(total),
        status: status === 'refunded' ? 'refunded' : 'succeeded',
        method: 'card',
        last4: '4242',
        brand: 'visa',
        providerReference: `pi_mock_${pad(i + 1, 5)}`,
        createdAt: addHours(createdAt, 1),
        updatedAt: addHours(createdAt, 1),
      });
    }
  }
  return { orders, payments };
}

/* ------------------------------------------------------------------- reviews */

const REVIEW_COPY: Record<1 | 2 | 3 | 4 | 5, [string, string][]> = {
  5: [
    [
      'Exactly what I needed',
      'Arrived well packed and works perfectly. The seller answered all my questions before I bought.',
    ],
    [
      'Outstanding quality',
      'Flew it the same day. Image quality and stability are excellent for the price.',
    ],
    [
      'Fast delivery, great seller',
      'Delivered within three days and the seller included extra accessories.',
    ],
  ],
  4: [
    [
      'Very good overall',
      'Does everything I expected. Packaging could be better but the product is solid.',
    ],
    ['Happy with it', 'Good value. Setup took a little reading but it has been reliable.'],
  ],
  3: [['Decent, not perfect', 'Works as described though delivery took longer than promised.']],
  2: [
    [
      'Not quite as described',
      'Cosmetic wear was more than the listing suggested. Seller was responsive about it.',
    ],
  ],
  1: [['Disappointed', 'Item arrived late and required a replacement part.']],
};
const RATINGS: (1 | 2 | 3 | 4 | 5)[] = [5, 5, 4, 5, 3, 4, 2, 5, 4, 5];

export function buildReviews(
  products: Product[],
  vendors: Vendor[],
  customers: Customer[],
  orders: Order[],
): Review[] {
  const reviews: Review[] = [];
  const push = (targetType: Review['targetType'], targetId: string, n: number, seed: number) => {
    const rating = at(RATINGS, seed);
    const [title, body] = at(REVIEW_COPY[rating], seed);
    const author = at(customers, seed * 2 + 1);
    const createdAt = daysAgo(5 + ((seed * 7) % 80));
    reviews.push({
      id: makeId('rev', n),
      targetType,
      targetId,
      authorId: author.id,
      authorName: author.name,
      rating,
      title,
      body,
      verifiedPurchase:
        targetType === 'product' &&
        orders.some(
          (o) => o.customerId === author.id && o.items.some((it) => it.productId === targetId),
        ),
      helpfulCount: seed % 12,
      status: 'published',
      createdAt,
      updatedAt: createdAt,
    });
  };

  let n = 1;
  products.forEach((product, pIdx) => {
    if (product.status !== 'active') return;
    const count = (pIdx * 3) % 5;
    for (let r = 0; r < count; r++) push('product', product.id, n++, pIdx + r * 3);
  });
  vendors.forEach((vendor, vIdx) => {
    if (vendor.status !== 'approved') return;
    for (let r = 0; r < 2; r++) push('vendor', vendor.id, n++, vIdx * 2 + r);
  });
  return reviews;
}

/** Fills ratings, review counts, sales counts and product counts. Mutates in place. */
export function applyAggregates(
  products: Product[],
  vendors: Vendor[],
  manufacturers: Manufacturer[],
  reviews: Review[],
  orders: Order[],
): void {
  const avg = (list: Review[]) =>
    list.length ? round1(list.reduce((s, r) => s + r.rating, 0) / list.length) : 0;
  for (const product of products) {
    const own = reviews.filter((r) => r.targetType === 'product' && r.targetId === product.id);
    product.rating = avg(own);
    product.reviewCount = own.length;
    product.salesCount = orders
      .filter((o) => COUNTED_STATUSES.includes(o.status))
      .flatMap((o) => o.items)
      .filter((it) => it.productId === product.id)
      .reduce((sum, it) => sum + it.quantity, 0);
  }
  for (const vendor of vendors) {
    const productIds = new Set(products.filter((p) => p.vendorId === vendor.id).map((p) => p.id));
    const related = reviews.filter(
      (r) =>
        (r.targetType === 'vendor' && r.targetId === vendor.id) ||
        (r.targetType === 'product' && productIds.has(r.targetId)),
    );
    vendor.rating = avg(related);
    vendor.reviewCount = related.length;
    vendor.productCount = products.filter(
      (p) => p.vendorId === vendor.id && p.status === 'active',
    ).length;
  }
  for (const m of manufacturers) {
    const mine = products.filter((p) => p.manufacturerId === m.id && p.status === 'active');
    const related = reviews.filter(
      (r) => r.targetType === 'product' && mine.some((p) => p.id === r.targetId),
    );
    m.productCount = mine.length;
    m.rating = avg(related);
    m.reviewCount = related.length;
  }
}

/* ------------------------------------------------------------------ disputes */

const DISPUTE_REASONS: DisputeReason[] = [
  'not_as_described',
  'damaged',
  'not_received',
  'warranty',
  'not_as_described',
  'other',
  'damaged',
  'not_received',
];
const DISPUTE_STATUSES: DisputeStatus[] = [
  'open',
  'under_review',
  'resolved_refund',
  'open',
  'resolved_no_refund',
  'under_review',
  'closed',
  'open',
];

export function buildDisputes(orders: Order[]): Dispute[] {
  const eligible = orders.filter((o) =>
    ['shipped', 'delivered', 'completed', 'refunded'].includes(o.status),
  );
  return DISPUTE_STATUSES.map((status, i) => {
    const order = at(eligible, i * 3 + 1);
    const createdAt = addHours(order.updatedAt, 24 + i * 5);
    const reason = at(DISPUTE_REASONS, i);
    const messages = [
      {
        id: `dm_${pad(i + 1)}_1`,
        authorId: order.customerId,
        authorRole: 'customer',
        body: 'The item does not match what was described. I would like a resolution.',
        createdAt,
      },
      {
        id: `dm_${pad(i + 1)}_2`,
        authorId: at(order.vendorIds, 0),
        authorRole: 'vendor_owner',
        body: 'Sorry to hear that. Please share photos and we will review.',
        createdAt: addHours(createdAt, 6),
      },
    ];
    return {
      id: makeId('dsp', i + 1),
      orderId: order.id,
      customerId: order.customerId,
      vendorId: at(order.vendorIds, 0),
      reason,
      status,
      amount: order.total,
      description: `Customer reported: ${reason.replace(/_/g, ' ')}.`,
      messages,
      ...(status !== 'open' ? { assignedTo: i % 2 ? 'usr_adm_03' : 'usr_adm_02' } : {}),
      ...(status.startsWith('resolved')
        ? {
            resolution:
              status === 'resolved_refund'
                ? 'Refund approved after review.'
                : 'No fault found. Item matches listing.',
          }
        : {}),
      createdAt,
      updatedAt: addHours(createdAt, 12),
    };
  });
}

/* ------------------------------------------------------------------- finance */

export function buildFinance(
  vendors: Vendor[],
  orders: Order[],
): { payouts: Payout[]; ledger: LedgerEntry[]; balances: VendorBalance[] } {
  const payouts: Payout[] = [];
  const ledger: LedgerEntry[] = [];
  const balances: VendorBalance[] = [];
  let payoutN = 1;
  let ledgerN = 1;

  vendors.forEach((vendor, vIdx) => {
    if (vendor.status === 'pending_review' || !vendor.bank) return;
    const events: {
      at: string;
      amount: number;
      description: string;
      type: LedgerEntry['type'];
      ref?: string;
    }[] = [];
    for (const order of orders) {
      if (!COUNTED_STATUSES.includes(order.status)) continue;
      for (const item of order.items.filter((it) => it.vendorId === vendor.id)) {
        const commission = Math.round(item.total.amount * vendor.commissionRate);
        events.push({
          at: order.createdAt,
          amount: item.total.amount,
          description: `Sale ${order.number}: ${item.title}`,
          type: 'sale',
          ref: order.id,
        });
        events.push({
          at: order.createdAt,
          amount: -commission,
          description: `Commission on ${order.number}`,
          type: 'commission',
          ref: order.id,
        });
      }
    }
    const netUpTo = (days: number) =>
      events.filter((e) => e.at <= daysAgo(days)).reduce((s, e) => s + e.amount, 0);
    const net = events.reduce((s, e) => s + e.amount, 0);
    const p1 = Math.floor(netUpTo(45) * 0.9);
    const p2 = Math.floor(netUpTo(20) * 0.9) - p1;
    const p3 = Math.floor(netUpTo(7) * 0.9) - p1 - p2;
    const plan: [number, Payout['status'], number, number][] = [
      [p1, 'paid', 90, 45],
      [p2, 'paid', 45, 20],
      [
        p3,
        vendor.status === 'suspended' ? 'on_hold' : vIdx % 3 === 0 ? 'processing' : 'pending',
        20,
        7,
      ],
    ];
    const mine: Payout[] = [];
    for (const [amount, status, startDays, endDays] of plan) {
      if (amount <= 0) continue;
      const processedAt = status === 'paid' ? daysAgo(endDays - 2) : undefined;
      mine.push({
        id: makeId('po', payoutN++),
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount: kobo(amount),
        fee: kobo(5_000),
        status,
        bank: vendor.bank,
        periodStart: daysAgo(startDays),
        periodEnd: daysAgo(endDays),
        ...(processedAt ? { processedBy: 'usr_adm_02', processedAt } : {}),
        createdAt: daysAgo(endDays - 1),
        updatedAt: processedAt ?? daysAgo(endDays - 1),
      });
    }
    payouts.push(...mine);
    for (const payout of mine) {
      events.push({
        at: payout.createdAt,
        amount: -payout.amount.amount,
        description: `Payout ${payout.id}`,
        type: 'payout',
        ref: payout.id,
      });
    }
    events.sort((a, b) => a.at.localeCompare(b.at));
    let running = 0;
    for (const event of events) {
      running += event.amount;
      ledger.push({
        id: makeId('led', ledgerN++, 5),
        vendorId: vendor.id,
        type: event.type,
        amount: kobo(event.amount),
        balanceAfter: kobo(running),
        ...(event.ref ? { referenceId: event.ref } : {}),
        description: event.description,
        createdAt: event.at,
      });
    }
    const paid = mine.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount.amount, 0);
    const pending = mine
      .filter((p) => p.status !== 'paid')
      .reduce((s, p) => s + p.amount.amount, 0);
    balances.push({
      vendorId: vendor.id,
      available: kobo(net - paid - pending),
      pending: kobo(pending),
      lifetimeEarnings: kobo(net),
    });
  });
  return { payouts, ledger, balances };
}
