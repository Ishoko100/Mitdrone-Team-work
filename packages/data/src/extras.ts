import { slugify } from '@mitdrone/utils';

import { serviceCategoryId } from './catalog';
import { addHours, daysAgo, daysAhead, kobo, makeId, naira, pad } from './rng';

import type {
  AuditLog,
  ContentPage,
  ContentSection,
  LiveChatMessage,
  LiveSession,
  Notification,
  PlatformSettings,
  Product,
  ReferralSummary,
  ServiceListing,
  ServiceQuote,
  ServiceRequest,
  Vendor,
} from '@mitdrone/types';

/* ------------------------------------------------------------------ services */

type ServiceDef = [
  title: string,
  category: string,
  vendorIndex: number,
  model: ServiceListing['pricingModel'],
  startingNaira: number | undefined,
  states: string[],
];
const NORTH = ['Kaduna', 'Kano', 'Katsina', 'Zamfara', 'Niger', 'Plateau', 'Jigawa'];
const ALL = ['Lagos', 'FCT Abuja', 'Kaduna', 'Rivers', 'Oyo', 'Enugu', 'Kano'];

const SERVICE_DEFS: ServiceDef[] = [
  ['Farm Mapping & Crop Health Survey', 'Mapping', 2, 'per_hectare', 12_000, NORTH],
  ['Precision Crop Spraying', 'Crop Spraying', 2, 'per_hectare', 9_500, NORTH.slice(0, 4)],
  [
    'Agriculture Monitoring Subscription',
    'Agriculture Monitoring',
    2,
    'per_project',
    250_000,
    ['Kaduna', 'Kano'],
  ],
  ['Land Survey & Topographic Mapping', 'Land Surveying', 9, 'per_project', 450_000, NORTH],
  ['Photogrammetry & Orthomosaic', 'Photogrammetry', 9, 'per_hectare', 15_000, NORTH],
  ['3D Site Modelling', '3D Mapping', 9, 'per_project', 600_000, ALL],
  ['Thermal Inspection (Solar & Roofs)', 'Thermal Inspection', 9, 'per_hour', 85_000, ALL],
  ['Powerline Inspection', 'Powerline Inspection', 5, 'quote', undefined, ALL],
  [
    'Oil & Gas Pipeline Inspection',
    'Oil & Gas Inspection',
    5,
    'quote',
    undefined,
    ['Rivers', 'Lagos', 'FCT Abuja'],
  ],
  [
    'Infrastructure & Bridge Inspection',
    'Infrastructure Inspection',
    5,
    'per_project',
    900_000,
    ALL,
  ],
  ['Aerial Photography', 'Aerial Photography', 7, 'per_hour', 45_000, ['Rivers', 'Lagos']],
  [
    'Cinematic Aerial Videography',
    'Aerial Videography',
    7,
    'per_project',
    350_000,
    ['Rivers', 'Lagos', 'FCT Abuja'],
  ],
  [
    'Real Estate Photography',
    'Real Estate Photography',
    7,
    'per_project',
    60_000,
    ['Rivers', 'Lagos'],
  ],
  [
    'Construction Progress Monitoring',
    'Construction Monitoring',
    3,
    'per_project',
    300_000,
    ['FCT Abuja', 'Niger', 'Kaduna'],
  ],
  [
    'Security Patrol & Surveillance',
    'Security & Surveillance',
    6,
    'quote',
    undefined,
    ['Enugu', 'Lagos'],
  ],
  [
    'Search & Rescue Support',
    'Search & Rescue',
    6,
    'quote',
    undefined,
    ['Enugu', 'Lagos', 'FCT Abuja'],
  ],
  ['Mining Stockpile Surveys', 'Mining', 9, 'per_project', 700_000, ['Plateau', 'Kano', 'Niger']],
  ['Drone Repairs & Diagnostics', 'Drone Repairs', 1, 'per_project', 35_000, ['Lagos']],
  ['Calibration & Maintenance', 'Calibration', 1, 'per_project', 25_000, ['Lagos']],
  ['Drone Pilot Training (Basic)', 'Training', 1, 'per_project', 180_000, ['Lagos', 'FCT Abuja']],
  ['Remote Technical Support', 'Technical Support', 1, 'per_hour', 15_000, ['Lagos']],
  [
    'Hire a Certified Pilot',
    'Hire a Pilot',
    3,
    'per_hour',
    50_000,
    ['FCT Abuja', 'Niger', 'Kaduna'],
  ],
];

export function buildServices(vendors: Vendor[]): ServiceListing[] {
  return SERVICE_DEFS.map(([title, category, vIdx, pricingModel, price, coverageStates], i) => {
    const vendor = vendors[vIdx - 1];
    if (!vendor) throw new Error(`Unknown vendor index ${vIdx}`);
    return {
      id: makeId('svc', i + 1),
      slug: slugify(title),
      title,
      description: `${title} delivered by ${vendor.name}. Request a quote with your location and project size.`,
      categoryId: serviceCategoryId(category),
      vendorId: vendor.id,
      pricingModel,
      ...(price ? { startingPrice: naira(price) } : {}),
      coverageStates,
      rating: 4 + ((i * 3) % 10) / 10,
      reviewCount: 3 + ((i * 5) % 17),
      verified: vendor.verified,
      status: 'active' as const,
      createdAt: daysAgo(200 - i * 3),
      updatedAt: daysAgo(i),
    };
  });
}

export function buildServiceRequests(): { requests: ServiceRequest[]; quotes: ServiceQuote[] } {
  const requests: ServiceRequest[] = [
    {
      id: 'sreq_001',
      customerId: 'usr_cus_001',
      categoryId: serviceCategoryId('Mapping'),
      title: 'Map my 40 hectare maize farm',
      description:
        'Need an orthomosaic and plant health map of a 40 hectare maize farm before the next spraying cycle.',
      state: 'Kaduna',
      city: 'Zaria',
      areaHectares: 40,
      budget: naira(600_000),
      neededBy: daysAhead(21).slice(0, 10),
      status: 'quoted',
      quoteCount: 2,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
    {
      id: 'sreq_002',
      customerId: 'usr_cus_002',
      categoryId: serviceCategoryId('Real Estate Photography'),
      title: 'Listing photos for a 12-unit estate',
      description: 'Aerial and ground shots of a new estate in Lekki for marketing.',
      state: 'Lagos',
      city: 'Lekki',
      budget: naira(150_000),
      status: 'open',
      quoteCount: 0,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: 'sreq_003',
      customerId: 'usr_cus_003',
      categoryId: serviceCategoryId('Powerline Inspection'),
      title: 'Inspect 18km of distribution line',
      description: 'Visual and thermal inspection of an 18km 33kV line.',
      state: 'FCT Abuja',
      status: 'open',
      quoteCount: 0,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(6),
    },
    {
      id: 'sreq_004',
      customerId: 'usr_cus_004',
      categoryId: serviceCategoryId('Land Surveying'),
      title: 'Boundary survey, 5 hectares',
      description: 'Topographic and boundary survey for a plot in Kano.',
      state: 'Kano',
      areaHectares: 5,
      status: 'awarded',
      quoteCount: 1,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(8),
    },
  ];
  const quotes: ServiceQuote[] = [
    {
      id: 'sq_001',
      requestId: 'sreq_001',
      vendorId: 'ven_02',
      price: naira(520_000),
      message: 'We can fly your farm in one day and deliver the map within 72 hours.',
      estimatedDays: 4,
      status: 'sent',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: 'sq_002',
      requestId: 'sreq_001',
      vendorId: 'ven_09',
      price: naira(480_000),
      message: 'Survey-grade orthomosaic with a crop health overlay included.',
      estimatedDays: 6,
      status: 'sent',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 'sq_003',
      requestId: 'sreq_004',
      vendorId: 'ven_09',
      price: naira(350_000),
      message: 'Boundary pillars verified, deliverables in CAD and PDF.',
      estimatedDays: 5,
      status: 'accepted',
      createdAt: daysAgo(12),
      updatedAt: daysAgo(8),
    },
  ];
  return { requests, quotes };
}

/* ---------------------------------------------------------------------- live */

export function buildLive(products: Product[]): {
  sessions: LiveSession[];
  messages: LiveChatMessage[];
} {
  const productId = (title: string) =>
    products.find((p) => p.title.startsWith(title) && p.listingType === 'sale')?.id;
  const defs: [
    string,
    string,
    LiveSession['type'],
    LiveSession['status'],
    string,
    number,
    number,
    string | undefined,
    number,
  ][] = [
    [
      'DJI Mavic 3 Enterprise Demonstration',
      'Live walk-through of mapping and inspection workflows, with Q&A.',
      'product_demo',
      'live',
      'SkyNaija Drones',
      1,
      0,
      productId('DJI Mavic 3 Enterprise'),
      214,
    ],
    [
      'Agras T50 Field Spraying Demo',
      'Watch a full spraying mission on a working farm.',
      'flight_demo',
      'scheduled',
      'Kaduna AgriAir',
      2,
      2,
      productId('DJI Agras T50'),
      0,
    ],
    [
      'Terra VTOL Mapper Launch',
      'First look at the new VTOL survey platform.',
      'product_launch',
      'scheduled',
      'Terra Drones',
      5,
      5,
      productId('Terra VTOL'),
      0,
    ],
    [
      'Briech Drones: Building in Nigeria',
      'Manufacturer session on local assembly and support.',
      'manufacturer_session',
      'scheduled',
      'Briech Drones',
      4,
      8,
      undefined,
      0,
    ],
    [
      'Beginner Pilot Training',
      'Basic flight, safety and legal checklist for new pilots.',
      'training',
      'scheduled',
      'SkyNaija Drones',
      1,
      12,
      undefined,
      0,
    ],
    [
      'Expert Talk: Drone Regulation in Nigeria',
      'Placeholder session. Speakers to be confirmed by the compliance team.',
      'expert_talk',
      'scheduled',
      'Mitdrone',
      1,
      16,
      undefined,
      0,
    ],
    [
      'Accessories Flash Deals',
      'Limited-time bundles on batteries, filters and cases.',
      'live_deal',
      'ended',
      'SkyNaija Drones',
      1,
      -3,
      productId('100W Battery'),
      96,
    ],
  ];
  const sessions = defs.map(
    (
      [title, description, type, status, hostName, vIdx, days, featuredProductId, viewerCount],
      i,
    ) => ({
      id: makeId('live', i + 1),
      title,
      description,
      type,
      status,
      hostName,
      hostVendorId: `ven_${pad(vIdx, 2)}`,
      ...(featuredProductId ? { featuredProductId } : {}),
      startsAt: status === 'live' ? daysAgo(0, 1) : days >= 0 ? daysAhead(days) : daysAgo(-days),
      viewerCount,
      thumbnailUrl: `/placeholders/drone-${(i % 3) + 1}.svg`,
    }),
  );
  const lines: [string, string, boolean][] = [
    ['Aisha B.', 'How long does the M3E take to map 100 hectares?', true],
    ['Tunde A.', 'Great stability in this wind!', false],
    ['Chinedu E.', 'Is RTK included in the price?', true],
    ['Zainab G.', 'Does it ship to Kano?', true],
    ['Musa S.', 'Love the thermal view.', false],
  ];
  const messages = lines.map(([authorName, body, isQuestion], i) => ({
    id: `lm_${pad(i + 1)}`,
    sessionId: 'live_001',
    authorName,
    body,
    isQuestion,
    createdAt: addHours(daysAgo(0, 1), i * 0.1),
  }));
  return { sessions, messages };
}

/* ------------------------------------------------------------------ referral */

export function buildReferrals(): Record<string, ReferralSummary> {
  const entries: ReferralSummary['entries'] = [
    {
      id: 'ref_001',
      referredName: 'Aisha Bello',
      joinedAt: daysAgo(60),
      purchases: 2,
      status: 'rewarded',
      reward: naira(14_500),
    },
    {
      id: 'ref_002',
      referredName: 'Chinedu Okafor',
      joinedAt: daysAgo(40),
      purchases: 1,
      status: 'rewarded',
      reward: naira(8_000),
    },
    {
      id: 'ref_003',
      referredName: 'Funmilayo Adeyemi',
      joinedAt: daysAgo(18),
      purchases: 1,
      status: 'purchased',
      reward: naira(6_200),
    },
    {
      id: 'ref_004',
      referredName: 'Musa Abdullahi',
      joinedAt: daysAgo(9),
      purchases: 1,
      status: 'purchased',
      reward: naira(4_300),
    },
    {
      id: 'ref_005',
      referredName: 'Ngozi Eze',
      joinedAt: daysAgo(4),
      purchases: 0,
      status: 'signed_up',
      reward: naira(0),
    },
  ];
  const sum = (status: string) =>
    entries.filter((e) => e.status === status).reduce((s, e) => s + e.reward.amount, 0);
  const available = sum('rewarded');
  return {
    usr_cus_001: {
      code: 'IBRAHIM10',
      link: 'https://mitdrone.example/register?ref=IBRAHIM10',
      peopleReferred: entries.length,
      purchases: entries.reduce((s, e) => s + e.purchases, 0),
      pendingRewards: kobo(sum('purchased')),
      availableRewards: kobo(available),
      totalEarned: kobo(available + naira(15_000).amount),
      entries,
    },
  };
}

/* ------------------------------------------------------------ notifications */

export function buildNotifications(): Notification[] {
  const make = (
    userId: string,
    items: [Notification['type'], string, string, string][],
  ): Notification[] =>
    items.map(([type, title, body, href], i) => ({
      id: `ntf_${userId}_${i + 1}`,
      userId,
      type,
      title,
      body,
      href,
      read: i > 1,
      createdAt: daysAgo(i + 0.2),
    }));
  return [
    ...make('usr_cus_001', [
      ['order', 'Your order has shipped', 'Order MD-1060 is on its way.', '/account/orders'],
      [
        'referral',
        'Referral reward available',
        'Aisha Bello completed a purchase.',
        '/account/referrals',
      ],
      ['system', 'Welcome to Mitdrone', 'Verify your drone and fly safely.', '/learn'],
    ]),
    ...make('usr_ven_01', [
      ['order', 'New order received', 'Order MD-1068 needs processing.', '/orders'],
      ['payout', 'Payout processing', 'Your latest payout is being processed.', '/payouts'],
      [
        'moderation',
        'Listing under review',
        'DJI Mini 3 Pro (New listing) is awaiting approval.',
        '/products',
      ],
    ]),
    ...make('usr_adm_01', [
      ['moderation', 'Vendor awaiting approval', 'NewWave Aviation submitted KYC.', '/vendors'],
      ['dispute', 'New dispute opened', 'A dispute needs assignment.', '/disputes'],
      ['system', 'Weekly payout run', 'Payouts are ready to process.', '/payouts'],
    ]),
  ];
}

/* ------------------------------------------------------------------- content */

const CONTENT: Record<ContentSection, string[]> = {
  learn: [
    'Drone Buying Guide',
    'Drone Guides',
    'Blog',
    'Drone News',
    'Mitdrone Academy',
    'Mitdrone Clubs',
    'FAQs',
  ],
  company: ['About Mitdrone', 'Our Mission', 'Contact Us', 'Careers', 'Partners'],
  'trust-safety': [
    'Verified Sellers',
    'Product Verification',
    'Drone Verification',
    'Safety Centre',
    'Buyer Protection',
    'Seller Protection',
  ],
  business: ['Enterprise', 'Bulk Orders', 'Request a Quote', 'Procurement', 'Fleet Management'],
  support: ['Help Centre', 'Track Order', 'Returns', 'Warranty', 'Repairs', 'Contact Support'],
  compliance: ['Drone Regulations', 'Registration Guide', 'Compliance Resources'],
};

export function buildContentPages(): ContentPage[] {
  return (Object.entries(CONTENT) as [ContentSection, string[]][]).flatMap(([section, titles]) =>
    titles.map((title) => {
      const regulatory = section === 'compliance';
      return {
        slug: slugify(title),
        section,
        title,
        summary: `${title} on Mitdrone, the secure marketplace for verified drones, equipment and services.`,
        body: [
          regulatory
            ? // TODO: Mitdrone compliance team must verify all regulatory (NCAA) content before launch.
              'Editorial placeholder: regulatory details must be verified by the Mitdrone compliance team before launch.'
            : `This is placeholder copy for "${title}". The Mitdrone content team will replace it before launch.`,
          'Mitdrone connects buyers, sellers, manufacturers and service providers across Nigeria and Africa, with verified sellers and protected payments.',
          'Need help right now? Contact support from the Help Centre and we will get back to you.',
        ],
        placeholder: true,
      };
    }),
  );
}

/* ------------------------------------------------------- settings and audit */

export function buildSettings(): PlatformSettings {
  return {
    defaultCommissionRate: 0.08,
    taxRate: 0.075,
    shippingFlatRate: naira(8_500),
    minimumPayout: naira(50_000),
    payoutSchedule: 'weekly',
    currencies: ['NGN', 'USD'],
    defaultCurrency: 'NGN',
    referralRewardRate: 0.02,
    maintenanceMode: false,
    supportEmail: 'support@mitdrone.example',
    updatedAt: daysAgo(30),
    updatedBy: 'usr_adm_01',
  };
}

export function buildAuditLogs(): AuditLog[] {
  const defs: [string, AuditLog['action'], AuditLog['entityType'], string, string][] = [
    ['usr_adm_02', 'vendor.approve', 'vendor', 'ven_08', 'Approved vendor Used Drone Exchange'],
    [
      'usr_adm_02',
      'vendor.suspend',
      'vendor',
      'ven_11',
      'Suspended QuickFly Traders after repeated complaints',
    ],
    ['usr_adm_02', 'product.flag', 'product', 'prd_039', 'Flagged listing: price far below market'],
    ['usr_adm_01', 'settings.update', 'settings', 'platform', 'Changed payout schedule to weekly'],
    ['usr_adm_02', 'payout.process', 'payout', 'po_001', 'Processed payout po_001'],
    ['usr_adm_03', 'dispute.assign', 'dispute', 'dsp_002', 'Assigned dispute dsp_002 to self'],
    ['usr_adm_02', 'order.refund', 'order', 'ord_009', 'Refunded order MD-1008'],
    ['usr_adm_01', 'user.update_role', 'user', 'usr_adm_03', 'Changed Grace Ojo role to support'],
  ];
  const actors: Record<string, [string, AuditLog['actorRole']]> = {
    usr_adm_01: ['Adaeze Okoro', 'super_admin'],
    usr_adm_02: ['Ibrahim Yakubu', 'admin'],
    usr_adm_03: ['Grace Ojo', 'support'],
  };
  return defs.map(([actorId, action, entityType, entityId, summary], i) => {
    const [actorName, actorRole] = actors[actorId] ?? ['Unknown', 'admin'];
    return {
      id: makeId('aud', i + 1),
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      summary,
      ip: `102.89.${10 + i}.${20 + i}`,
      createdAt: daysAgo(2 + i * 4),
    };
  });
}
