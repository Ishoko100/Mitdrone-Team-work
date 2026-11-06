import { PRICE_RANGES, slugify } from '@mitdrone/utils';

import { env } from './env';

import type { ContentSection } from '@mitdrone/types';
import type { MegaMenuColumn, MegaMenuItem } from '@mitdrone/ui';

/** /about, /learn, /trust-safety, /business, /support, /compliance */
export const contentHref = (section: ContentSection, title: string): string =>
  `/${section === 'company' ? 'about' : section}/${slugify(title)}`;

const cat = (name: string) => ({ label: name, href: `/categories/${slugify(name)}` });
const search = (label: string, q: string) => ({
  label,
  href: `/products?q=${encodeURIComponent(q)}`,
});
const service = (name: string) => ({ label: name, href: `/services?category=${slugify(name)}` });
const pages = (section: ContentSection, titles: string[]) =>
  titles.map((t) => ({ label: t, href: contentHref(section, t) }));
const priceHref = (min: number, max?: number) =>
  `/products?minPrice=${min}${max ? `&maxPrice=${max}` : ''}`;

const DRONES = [
  'Consumer Drones',
  'Enterprise Drones',
  'Agricultural Drones',
  'Mapping & Surveying Drones',
  'Security & Surveillance Drones',
  'Photography & Filmmaking Drones',
  'Inspection Drones',
  'Fixed-Wing Drones',
  'VTOL Drones',
  'Delivery Drones',
  'FPV Drones',
  'Used Drones',
  'Refurbished Drones',
];
const INDUSTRIES = [
  'Agriculture',
  'Construction',
  'Surveying & Mapping',
  'Security',
  'Oil & Gas',
  'Mining',
  'Real Estate',
  'Film & Media',
  'Infrastructure',
  'Environmental Monitoring',
  'Emergency Response',
];

const company = ['About Mitdrone', 'Our Mission', 'Contact Us', 'Careers', 'Partners'];
const learn = [
  'Drone Buying Guide',
  'Drone Guides',
  'Blog',
  'Drone News',
  'Mitdrone Academy',
  'Mitdrone Clubs',
  'FAQs',
];
const trust = [
  'Verified Sellers',
  'Product Verification',
  'Drone Verification',
  'Safety Centre',
  'Buyer Protection',
  'Seller Protection',
];
const business = [
  'Enterprise',
  'Bulk Orders',
  'Request a Quote',
  'Procurement',
  'Fleet Management',
];
const support = ['Help Centre', 'Track Order', 'Returns', 'Warranty', 'Repairs', 'Contact Support'];
const compliance = ['Drone Regulations', 'Registration Guide', 'Compliance Resources'];

const liveLinks = [
  ['Live Product Demonstrations', 'product_demo'],
  ['Drone Flight Demonstrations', 'flight_demo'],
  ['New Product Launches', 'product_launch'],
  ['Manufacturer Sessions', 'manufacturer_session'],
  ['Drone Training', 'training'],
  ['Expert Talks', 'expert_talk'],
  ['Live Deals', 'live_deal'],
] as const;

export const NAV_ITEMS: MegaMenuItem[] = [
  {
    label: 'Categories',
    iconSrc: '/categories-grid-icon.png',
    columns: [
      { title: 'By Industry', links: INDUSTRIES.map(cat) },
      {
        title: 'By Purpose',
        links: [
          { label: 'Buy a Drone', href: '/products?kind=drone&listingType=sale' },
          { label: 'Rent a Drone', href: '/rent' },
          { label: 'Find a Drone Operator', href: '/services/providers' },
          { label: 'Find a Drone Service', href: '/services/find' },
          { label: 'Find Spare Parts', href: '/products?kind=spare_part' },
          { label: 'Repair a Drone', href: '/services?category=drone-repairs' },
        ],
      },
    ],
    featured: {
      title: 'Not sure where to start?',
      description: 'Tell us what you need done and we will match you with verified operators.',
      href: '/services/find',
      cta: 'Find what you need',
    },
  },
  {
    label: 'Drone',
    columns: [
      { title: 'Drones', links: DRONES.map(cat) },
    ],
  },
  {
    label: 'Shop',
    columns: [
      {
        title: 'Shop All',
        links: [
          { label: 'All Drones', href: '/products?kind=drone' },
          { label: 'New Drones', href: '/products?kind=drone&condition=new' },
          { label: 'Used Drones', href: '/products?kind=drone&condition=used' },
          { label: 'Refurbished Drones', href: '/products?kind=drone&condition=refurbished' },
          { label: 'Drone Equipment', href: '/products?kind=equipment' },
          { label: 'Spare Parts', href: '/products?kind=spare_part' },
          { label: 'Accessories', href: '/accessories' },
          { label: 'Payloads', href: '/products?kind=payload' },
          { label: 'Batteries & Chargers', href: '/categories/batteries-and-chargers' },
          { label: 'Cameras & Sensors', href: '/categories/sensors' },
        ],
      },
      {
        title: 'Shop by Price',
        links: PRICE_RANGES.map((r) => ({ label: r.label, href: priceHref(r.min, r.max) })),
      },
      {
        title: 'Shop by Brand',
        links: [
          { label: 'DJI', href: '/products?brand=DJI' },
          { label: 'Autel', href: '/products?brand=Autel%20Robotics' },
          { label: 'Parrot', href: '/products?brand=Parrot' },
          { label: 'Nigerian Manufacturers', href: '/manufacturers?nigerian=true' },
          { label: 'Other Brands', href: '/brands' },
        ],
      },
    ],
    featured: {
      title: 'Deals of the Week',
      description: 'Limited-time prices on drones and accessories.',
      href: '/offers',
      cta: 'See the deals',
    },
  },
  {
    label: 'Accessories',
    columns: [
      {
        title: 'Batteries & Power',
        links: [
          search('Drone Batteries', 'battery'),
          search('Chargers', 'charg'),
          search('Charging Hubs', 'hub'),
          search('Power Stations', 'power station'),
        ],
      },
      {
        title: 'Flight Accessories',
        links: [
          cat('Propellers'),
          cat('Controllers'),
          cat('Landing Pads'),
          cat('GPS/RTK Accessories'),
        ],
      },
      {
        title: 'Camera Accessories',
        links: [
          cat('ND Filters'),
          search('Camera Protection', 'camera protection'),
          cat('Gimbals & Mounts'),
          search('Mounts', 'mount'),
        ],
      },
      {
        title: 'Storage & Protection',
        links: [
          cat('Drone Cases & Backpacks'),
          search('Backpacks', 'backpack'),
          search('Storage', 'storage'),
          search('Protective Covers', 'cover'),
        ],
      },
      {
        title: 'Safety',
        links: [cat('Landing Pads'), search('Warning Lights', 'light'), cat('Safety Equipment')],
      },
      {
        title: 'Professional Equipment',
        links: [
          cat('RTK Systems'),
          cat('Payloads'),
          cat('Sensors'),
          cat('Thermal Cameras'),
          cat('Mapping Equipment'),
        ],
      },
    ],
    featured: {
      title: 'Shop Accessories',
      description: 'Batteries, filters, cases, RTK and more.',
      href: '/accessories',
      cta: 'Shop Accessories',
    },
  },
  {
    label: 'Brands',
    columns: [
      {
        title: 'Popular Brands',
        links: [
          { label: 'DJI', href: '/brands/dji' },
          { label: 'Autel Robotics', href: '/brands/autel-robotics' },
          { label: 'Parrot', href: '/brands/parrot' },
          { label: 'Skydio', href: '/brands/skydio' },
          { label: 'Plus more', href: '/brands' },
        ],
      },
      {
        title: 'Nigerian Manufacturers',
        links: [
          { label: 'Explore Nigerian Drone Manufacturers', href: '/manufacturers?nigerian=true' },
          { label: 'Terra Drones', href: '/manufacturers/terra-drones' },
          { label: 'Briech Drones', href: '/manufacturers/briech-drones' },
          { label: 'Ken Drone', href: '/manufacturers/ken-drone' },
          { label: 'Other Nigerian Manufacturers', href: '/manufacturers?nigerian=true' },
        ],
      },
      {
        title: 'Manufacturer Directory',
        links: [
          {
            label: 'Browse all manufacturers',
            href: '/manufacturers',
            description: 'Profiles, capabilities, industries and verification.',
          },
        ],
      },
    ],
    featured: {
      title: 'Made in Nigeria',
      description: 'Discover and support Nigerian and African drone manufacturers.',
      href: '/manufacturers?nigerian=true',
      cta: 'Meet the makers',
    },
  },
  {
    label: 'Drone Software & Data',
    columns: [
      {
        title: 'Software & Platforms',
        links: [
          'Mapping software',
          'Flight planning software',
          'Photogrammetry software',
          'Agricultural analytics',
          'AI image analysis',
          'Object detection',
          'Thermal analysis',
          'Surveying platforms',
          'Fleet management',
          'Drone security software',
          'Data processing',
        ].map((name) => ({ label: name, href: `/products?q=${encodeURIComponent(name)}` })),
      },
    ],
  },
  {
    label: 'Drone Services',
    columns: [
      {
        title: 'Drone Services',
        links: [
          'Aerial Photography',
          'Aerial Videography',
          'Land Surveying',
          'Mapping',
          'Photogrammetry',
          '3D Mapping',
          'Agriculture Monitoring',
          'Crop Spraying',
          'Construction Monitoring',
          'Security & Surveillance',
          'Infrastructure Inspection',
          'Powerline Inspection',
          'Oil & Gas Inspection',
          'Mining',
          'Thermal Inspection',
          'Real Estate Photography',
          'Search & Rescue',
        ].map(service),
      },
      {
        title: 'Professional Services',
        links: [
          { label: 'Find a Drone Operator', href: '/services/providers' },
          { label: 'Hire a Pilot', href: '/services?category=hire-a-pilot' },
          { label: 'Request a Drone Service', href: '/services/find' },
          { label: 'Post a Project', href: '/services/post-project' },
        ],
      },
      {
        title: 'Support Services',
        links: ['Drone Repairs', 'Maintenance', 'Calibration', 'Training', 'Technical Support'].map(
          service,
        ),
      },
    ],
    featured: {
      title: 'Need your farm mapped?',
      description:
        'Pick a service, add your location and size, and get quotes from verified operators.',
      href: '/services/find?service=mapping',
      cta: 'Get quotes',
    },
  },
  {
    label: 'Rent',
    columns: [
      {
        title: 'Rent a Drone',
        links: [
          { label: 'Consumer Drones', href: '/rent?category=consumer-drones' },
          { label: 'Enterprise Drones', href: '/rent?category=enterprise-drones' },
          { label: 'Agriculture Drones', href: '/rent?category=agricultural-drones' },
          { label: 'Mapping Drones', href: '/rent?category=mapping-and-surveying-drones' },
          { label: 'Camera Drones', href: '/rent?category=photography-and-filmmaking-drones' },
          { label: 'Security Drones', href: '/rent?category=security-and-surveillance-drones' },
        ],
      },
      {
        title: 'Rental Options',
        links: [
          { label: 'Daily', href: '/rent?period=daily' },
          { label: 'Weekly', href: '/rent?period=weekly' },
          { label: 'Monthly', href: '/rent?period=monthly' },
        ],
      },
      {
        title: 'Rent From',
        links: [
          { label: 'Mitdrone', href: '/rent?from=mitdrone' },
          { label: 'Verified Sellers', href: '/rent?from=sellers' },
          { label: 'Verified Owners', href: '/rent?from=owners' },
        ],
      },
    ],
    featured: {
      title: 'List your drone for rent',
      description: 'Coming soon: earn from a drone that sits idle.',
      href: '/sell?type=rent',
      cta: 'Join the waitlist',
    },
  },
  {
    label: 'Sell on Mitdrone',
    columns: [
      {
        title: 'Start selling',
        links: [
          {
            label: 'Sell a Drone',
            href: '/sell?type=drone',
            description: 'List your drone for sale.',
          },
          {
            label: 'Sell Equipment',
            href: '/sell?type=equipment',
            description: 'Accessories, spare parts, equipment, payloads.',
          },
          {
            label: 'Become a Seller',
            href: '/sell?type=seller',
            description: 'For businesses and dealers.',
          },
          {
            label: 'Become a Manufacturer',
            href: '/sell?type=manufacturer',
            description: 'For drone manufacturers.',
          },
          {
            label: 'Sell Used Drones',
            href: '/sell?type=used',
            description: 'Pre-owned equipment.',
          },
        ],
      },
      {
        title: 'How Selling Works',
        links: [
          'Create account',
          'Verify yourself',
          'List your product',
          'Get buyers',
          'Complete transaction',
          'Get paid',
        ].map((label, i) => ({ label: `${i + 1}. ${label}`, href: '/sell/how-it-works' })),
      },
    ],
    featured: {
      title: 'List Your Drone',
      description: 'Reach verified buyers and get paid securely.',
      href: `${env.NEXT_PUBLIC_VENDOR_URL}/register`,
      cta: 'List Your Drone',
    },
  },
  {
    label: 'Offers',
    columns: [
      {
        title: 'Deals',
        links: [
          { label: "Today's Deals", href: '/offers?type=today' },
          { label: 'Flash Sales', href: '/offers?type=flash' },
          { label: 'Limited-Time Offers', href: '/offers?type=limited' },
          { label: 'Clearance', href: '/offers?type=clearance' },
        ],
      },
      {
        title: 'Promotions',
        links: [
          { label: '10% Off Selected Drones', href: '/offers?kind=drone' },
          { label: 'Bundle Deals', href: '/offers?type=bundle' },
          { label: 'Accessories Deals', href: '/offers?kind=accessory' },
          { label: 'Seasonal Offers', href: '/offers?type=seasonal' },
        ],
      },
      {
        title: 'Price',
        links: [
          { label: 'Under ₦500K', href: priceHref(0, 50_000_000) },
          { label: 'Under ₦1M', href: priceHref(0, 100_000_000) },
          { label: 'Best Value', href: '/products?sort=rating' },
          { label: 'Pre-Owned Deals', href: '/products?condition=used' },
        ],
      },
      {
        title: 'Featured',
        links: [
          { label: 'Featured Drones', href: '/products?kind=drone&featured=true' },
          { label: 'Featured Sellers', href: '/vendors' },
          { label: 'New Arrivals', href: '/products?sort=newest' },
        ],
      },
    ],
    featured: {
      title: 'Deals of the Week',
      description: 'Fresh discounts every week.',
      href: '/offers',
      cta: 'Shop deals',
    },
  },
  {
    label: 'More',
    showChevron: true,
    columns: [
      {
        title: 'Referral & Earn',
        links: [
          { label: 'How it works', href: '/referral' },
          { label: 'My Referrals', href: '/account/referrals' },
        ],
      },
      { title: 'Mitdrone', links: pages('company', company) },
      { title: 'Learn', links: pages('learn', learn) },
      { title: 'Trust & Safety', links: pages('trust-safety', trust) },
      { title: 'Business', links: pages('business', business) },
      { title: 'Support', links: pages('support', support) },
      { title: 'Compliance', links: pages('compliance', compliance) },
      {
        title: 'Mitdrone Live',
        links: liveLinks.map(([label, type]) => ({ label, href: `/live?type=${type}` })),
      },
    ],
  },
];

export const FOOTER_COLUMNS: MegaMenuColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All Drones', href: '/products?kind=drone' },
      { label: 'Accessories', href: '/accessories' },
      { label: 'Offers', href: '/offers' },
      { label: 'Rent a Drone', href: '/rent' },
      { label: 'Brands', href: '/brands' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Find a Service', href: '/services/find' },
      { label: 'Post a Project', href: '/services/post-project' },
      { label: 'Drone Operators', href: '/services/providers' },
      { label: 'Mitdrone Live', href: '/live' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Sell a Drone', href: '/sell?type=drone' },
      { label: 'Become a Seller', href: '/sell?type=seller' },
      { label: 'How Selling Works', href: '/sell/how-it-works' },
      { label: 'Referral & Earn', href: '/referral' },
    ],
  },
  { title: 'Trust & Safety', links: pages('trust-safety', trust.slice(0, 5)) },
  { title: 'Support', links: pages('support', support.slice(0, 5)) },
  {
    title: 'Company',
    links: [...pages('company', company), ...pages('compliance', ['Drone Regulations'])],
  },
];
