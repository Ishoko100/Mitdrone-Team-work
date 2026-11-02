import { slugify } from '@mitdrone/utils';

import type { Category, ServiceCategory, ServiceGroup } from '@mitdrone/types';

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
const ACCESSORIES = [
  'Batteries & Chargers',
  'Propellers',
  'Controllers',
  'Landing Pads',
  'GPS/RTK Accessories',
  'ND Filters',
  'Gimbals & Mounts',
  'Drone Cases & Backpacks',
  'Safety Equipment',
  'Spare Parts',
];
const EQUIPMENT = ['RTK Systems', 'Payloads', 'Sensors', 'Thermal Cameras', 'Mapping Equipment'];

export const categoryId = (name: string): string => `cat_${slugify(name)}`;

export function buildCategories(): Category[] {
  const make = (names: string[], group: Category['group']): Category[] =>
    names.map((name) => ({
      id: categoryId(name),
      slug: slugify(name),
      name,
      group,
      description: `Browse ${name.toLowerCase()} from verified Mitdrone sellers.`,
      productCount: 0,
    }));
  return [
    ...make(DRONES, 'drones'),
    ...make(INDUSTRIES, 'industry'),
    ...make(ACCESSORIES, 'accessories'),
    ...make(EQUIPMENT, 'equipment'),
  ];
}

const SERVICES: Record<ServiceGroup, string[]> = {
  drone_services: [
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
  ],
  professional: [
    'Find a Drone Operator',
    'Hire a Pilot',
    'Request a Drone Service',
    'Post a Project',
  ],
  support: ['Drone Repairs', 'Maintenance', 'Calibration', 'Training', 'Technical Support'],
};

export const serviceCategoryId = (name: string): string => `svc_cat_${slugify(name)}`;

export function buildServiceCategories(): ServiceCategory[] {
  return (Object.entries(SERVICES) as [ServiceGroup, string[]][]).flatMap(([group, names]) =>
    names.map((name) => ({
      id: serviceCategoryId(name),
      slug: slugify(name),
      name,
      group,
      description: `${name} by verified Mitdrone operators and companies.`,
    })),
  );
}
