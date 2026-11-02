import { at, daysAgo, faker, makeId, naira, pad } from './rng';

import type {
  Admin,
  Customer,
  Manufacturer,
  User,
  Vendor,
  VendorKYC,
  VendorMember,
  VendorStatus,
  VendorType,
} from '@mitdrone/types';

const FIRST = [
  'Aisha',
  'Chinedu',
  'Funmilayo',
  'Musa',
  'Ngozi',
  'Emeka',
  'Hauwa',
  'Tunde',
  'Zainab',
  'Chidi',
  'Bola',
  'Yusuf',
  'Amina',
  'Segun',
];
const LAST = [
  'Bello',
  'Okafor',
  'Adeyemi',
  'Abdullahi',
  'Eze',
  'Lawal',
  'Nwosu',
  'Suleiman',
  'Balogun',
  'Garba',
  'Okonkwo',
  'Danjuma',
];
const CITIES: [string, string][] = [
  ['Zaria', 'Kaduna'],
  ['Lagos', 'Lagos'],
  ['Abuja', 'FCT Abuja'],
  ['Port Harcourt', 'Rivers'],
  ['Kano', 'Kano'],
  ['Ibadan', 'Oyo'],
  ['Enugu', 'Enugu'],
];
const BANKS = ['GTBank', 'Access Bank', 'Zenith Bank', 'UBA', 'First Bank', 'Kuda'];

type VendorDef = [
  slug: string,
  name: string,
  type: VendorType,
  city: string,
  state: string,
  status: VendorStatus,
  commission: number,
  description: string,
];

export const VENDOR_DEFS: VendorDef[] = [
  [
    'skynaija-drones',
    'SkyNaija Drones',
    'dealer',
    'Lagos',
    'Lagos',
    'approved',
    0.08,
    'Authorised dealer for consumer and enterprise drones, accessories, repairs and pilot training.',
  ],
  [
    'kaduna-agriair',
    'Kaduna AgriAir',
    'dealer',
    'Kaduna',
    'Kaduna',
    'approved',
    0.07,
    'Agricultural drones, crop spraying and farm mapping services across Northern Nigeria.',
  ],
  [
    'abuja-aerial-supply',
    'Abuja Aerial Supply',
    'dealer',
    'Abuja',
    'FCT Abuja',
    'approved',
    0.08,
    'Enterprise drones and payloads for surveying, security and inspection teams.',
  ],
  [
    'briech-drones',
    'Briech Drones',
    'manufacturer',
    'Lagos',
    'Lagos',
    'approved',
    0.06,
    'Nigerian drone manufacturer building survey and agricultural platforms.',
  ],
  [
    'terra-drones',
    'Terra Drones',
    'manufacturer',
    'Abuja',
    'FCT Abuja',
    'approved',
    0.06,
    'Mapping and inspection drones with local support and training.',
  ],
  [
    'ken-drone',
    'Ken Drone',
    'manufacturer',
    'Enugu',
    'Enugu',
    'approved',
    0.06,
    'Locally assembled delivery and security patrol drones.',
  ],
  [
    'pilothub-rentals',
    'PilotHub Rentals',
    'renter',
    'Port Harcourt',
    'Rivers',
    'approved',
    0.1,
    'Daily, weekly and monthly drone rentals with optional certified pilots.',
  ],
  [
    'used-drone-exchange',
    'Used Drone Exchange',
    'individual_seller',
    'Kano',
    'Kano',
    'approved',
    0.1,
    'Inspected pre-owned and refurbished drones at honest prices.',
  ],
  [
    'northstar-survey',
    'NorthStar Survey',
    'service_provider',
    'Kano',
    'Kano',
    'approved',
    0.09,
    'Licensed surveyors offering mapping, photogrammetry and thermal inspection.',
  ],
  [
    'newwave-aviation',
    'NewWave Aviation',
    'dealer',
    'Ibadan',
    'Oyo',
    'pending_review',
    0.08,
    'New dealer awaiting verification.',
  ],
  [
    'quickfly-traders',
    'QuickFly Traders',
    'individual_seller',
    'Lagos',
    'Lagos',
    'suspended',
    0.1,
    'Suspended after repeated buyer complaints.',
  ],
];

export const vendorId = (n: number): string => makeId('ven', n, 2);

export function buildVendors(): Vendor[] {
  return VENDOR_DEFS.map(
    ([slug, name, type, city, state, status, commissionRate, description], index) => {
      const n = index + 1;
      return {
        id: vendorId(n),
        slug,
        name,
        type,
        status,
        description,
        email: n === 1 ? 'vendor@mitdrone.test' : `owner@${slug}.mitdrone.test`,
        phone: `0803${faker.string.numeric(7)}`,
        city,
        state,
        country: 'Nigeria',
        verified: status === 'approved',
        rating: 0,
        reviewCount: 0,
        productCount: 0,
        commissionRate,
        ownerId: makeId('usr_ven', n, 2),
        shipping: {
          handlingDays: 2,
          flatRate: naira(8_500),
          freeShippingThreshold: naira(2_000_000),
          regions: ['Nationwide'],
        },
        returnPolicy:
          'Returns accepted within 7 days if the item is unused and in original packaging.',
        bank: {
          bankName: at(BANKS, n),
          accountName: name,
          accountNumber: `0${faker.string.numeric(9)}`,
        },
        kycStatus: status === 'pending_review' ? 'submitted' : 'verified',
        createdAt: daysAgo(400 - n * 20),
        updatedAt: daysAgo(n),
      };
    },
  );
}

export function buildKyc(vendors: Vendor[]): VendorKYC[] {
  return vendors.map((vendor, index) => ({
    id: makeId('kyc', index + 1),
    vendorId: vendor.id,
    status: vendor.kycStatus,
    legalName: `${vendor.name} Limited`,
    registrationNumber: `RC ${1_000_000 + index * 7_919}`,
    documents: [
      {
        type: 'cac_certificate',
        fileName: 'cac-certificate.pdf',
        url: '/placeholders/document.pdf',
        uploadedAt: daysAgo(60),
      },
      {
        type: 'government_id',
        fileName: 'director-id.pdf',
        url: '/placeholders/document.pdf',
        uploadedAt: daysAgo(60),
      },
      {
        type: 'ncaa_permit',
        fileName: 'ncaa-permit.pdf',
        url: '/placeholders/document.pdf',
        uploadedAt: daysAgo(59),
      },
    ],
    ...(vendor.kycStatus === 'verified'
      ? { reviewedBy: 'usr_adm_02', reviewedAt: daysAgo(55) }
      : {}),
    createdAt: daysAgo(60),
    updatedAt: daysAgo(55),
  }));
}

type ManufacturerDef = [
  slug: string,
  name: string,
  country: string,
  isNigerian: boolean,
  vendorIdx: number,
  capabilities: string[],
  industries: string[],
  website: string | undefined,
  description: string,
];

const MANUFACTURER_DEFS: ManufacturerDef[] = [
  [
    'dji',
    'DJI',
    'China',
    false,
    0,
    ['Consumer drones', 'Enterprise platforms', 'Agricultural drones'],
    ['Agriculture', 'Surveying & Mapping', 'Film & Media'],
    'https://www.dji.com',
    'Global leader in consumer and enterprise drone platforms.',
  ],
  [
    'autel-robotics',
    'Autel Robotics',
    'China',
    false,
    0,
    ['Consumer drones', 'Enterprise inspection'],
    ['Security', 'Infrastructure'],
    'https://www.autelrobotics.com',
    'Camera and enterprise drones for inspection and public safety.',
  ],
  [
    'parrot',
    'Parrot',
    'France',
    false,
    0,
    ['Government drones', 'Inspection'],
    ['Security', 'Emergency Response'],
    'https://www.parrot.com',
    'European maker of secure, compact professional drones.',
  ],
  [
    'skydio',
    'Skydio',
    'United States',
    false,
    0,
    ['Autonomous flight', 'Enterprise inspection'],
    ['Infrastructure', 'Emergency Response'],
    'https://www.skydio.com',
    'Autonomous drones for inspection and public safety.',
  ],
  // TODO: confirm with the Mitdrone team that Terra Drones should be listed as a Nigerian manufacturer.
  [
    'terra-drones',
    'Terra Drones',
    'Nigeria',
    true,
    5,
    ['VTOL mapping', 'Inspection quads', 'Local training'],
    ['Surveying & Mapping', 'Infrastructure', 'Oil & Gas'],
    undefined,
    'Placeholder profile. Mapping and inspection drones with local support.',
  ],
  [
    'briech-drones',
    'Briech Drones',
    'Nigeria',
    true,
    4,
    ['Fixed-wing survey', 'Agricultural sprayers'],
    ['Agriculture', 'Surveying & Mapping'],
    undefined,
    'Placeholder profile. Nigerian manufacturer of survey and agricultural drones.',
  ],
  [
    'ken-drone',
    'Ken Drone',
    'Nigeria',
    true,
    6,
    ['Delivery quads', 'Security patrol'],
    ['Security', 'Emergency Response'],
    undefined,
    'Placeholder profile. Locally assembled delivery and patrol drones.',
  ],
];

export function buildManufacturers(): Manufacturer[] {
  return MANUFACTURER_DEFS.map(
    (
      [
        slug,
        name,
        country,
        isNigerian,
        vendorIdx,
        capabilities,
        industriesServed,
        website,
        description,
      ],
      index,
    ) => ({
      id: `man_${slug}`,
      slug,
      name,
      description,
      country,
      isNigerian,
      capabilities,
      industriesServed,
      verified: true,
      email: `hello@${slug}.example.com`,
      ...(website ? { website } : {}),
      rating: 0,
      reviewCount: 0,
      productCount: 0,
      ...(vendorIdx > 0 ? { vendorId: vendorId(vendorIdx) } : {}),
      createdAt: daysAgo(500 - index * 10),
      updatedAt: daysAgo(index),
    }),
  );
}

export function buildUsers(vendors: Vendor[]): User[] {
  const customers: Customer[] = Array.from({ length: 12 }, (_, i) => {
    const demo = i === 0;
    const first = demo ? 'Ibrahim' : at(FIRST, i);
    const last = demo ? 'Musa' : at(LAST, i * 3);
    const [city, state] = demo ? (['Zaria', 'Kaduna'] as [string, string]) : at(CITIES, i);
    const name = `${first} ${last}`;
    return {
      id: makeId('usr_cus', i + 1),
      email: demo ? 'ibrahim@mitdrone.test' : `${first}.${last}${i}@example.com`.toLowerCase(),
      name,
      phone: `0803${faker.string.numeric(7)}`,
      role: 'customer',
      status: 'active',
      emailVerified: true,
      referralCode: demo ? 'IBRAHIM10' : `${first}${pad(i, 2)}`.toUpperCase(),
      addresses: [
        {
          id: `addr_${pad(i + 1)}`,
          label: 'Home',
          fullName: name,
          phone: `0803${faker.string.numeric(7)}`,
          line1: `${10 + i} ${faker.location.street()}`,
          city,
          state,
          country: 'NG',
          isDefault: true,
        },
      ],
      createdAt: daysAgo(300 - i * 15),
      updatedAt: daysAgo(i),
      lastLoginAt: daysAgo(i % 5),
    };
  });

  const owners: VendorMember[] = vendors.map((vendor, i) => ({
    id: vendor.ownerId,
    email: vendor.email,
    name: `${at(FIRST, i + 2)} ${at(LAST, i + 5)}`,
    phone: vendor.phone,
    role: 'vendor_owner',
    status:
      vendor.status === 'suspended'
        ? 'suspended'
        : vendor.status === 'pending_review'
          ? 'pending'
          : 'active',
    vendorId: vendor.id,
    emailVerified: true,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  }));

  const staff: VendorMember = {
    id: 'usr_stf_01',
    email: 'staff@mitdrone.test',
    name: 'Kemi Adebayo',
    role: 'vendor_staff',
    status: 'active',
    vendorId: vendorId(1),
    emailVerified: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(10),
  };

  const admin = (n: number, email: string, name: string, role: Admin['role']): Admin => ({
    id: makeId('usr_adm', n, 2),
    email,
    name,
    role,
    status: 'active',
    emailVerified: true,
    createdAt: daysAgo(600),
    updatedAt: daysAgo(3),
    lastLoginAt: daysAgo(0),
  });

  return [
    ...customers,
    ...owners,
    staff,
    admin(1, 'superadmin@mitdrone.test', 'Adaeze Okoro', 'super_admin'),
    admin(2, 'admin@mitdrone.test', 'Ibrahim Yakubu', 'admin'),
    admin(3, 'support@mitdrone.test', 'Grace Ojo', 'support'),
  ];
}
