'use client';

import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { ChevronDown, Menu } from 'lucide-react';
import { useState, type ElementType, type ReactNode } from 'react';

import { cn } from '../lib/cn';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import { Button } from './button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet';

export interface MegaMenuLink {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}
export interface MegaMenuColumn {
  title: string;
  links: MegaMenuLink[];
}
export interface MegaMenuFeatured {
  title: string;
  description: string;
  href: string;
  cta: string;
}
export interface MegaMenuItem {
  label: string;
  /** Direct link. Omit when `columns` is set. */
  href?: string;
  columns?: MegaMenuColumn[];
  featured?: MegaMenuFeatured;
  iconSrc?: string;
  showChevron?: boolean;
}

interface LinkLikeProps {
  href: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}
/** Pass next/link here so navigation stays client-side. Defaults to a plain anchor. */
export type LinkAs = ElementType<LinkLikeProps>;

const triggerClass =
  'inline-flex h-10 items-center gap-2 rounded-md px-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent';

/** Desktop mega menu. Place inside a `relative` header: the panel spans the header width. */
export function MegaMenu({ items, linkAs: L = 'a' }: { items: MegaMenuItem[]; linkAs?: LinkAs }) {
  return (
    <NavigationMenu.Root aria-label="Primary" className="hidden lg:block">
      <NavigationMenu.List className="flex items-center gap-1">
        {items.map((item) => (
          <NavigationMenu.Item key={item.label}>
            {item.columns ? (
              <>
                <NavigationMenu.Trigger className={cn(triggerClass, 'group')}>
                  {item.iconSrc ? (
                    <span
                      className="mr-1 size-4 bg-current [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
                      style={{
                        maskImage: `url(${item.iconSrc})`,
                        WebkitMaskImage: `url(${item.iconSrc})`,
                      }}
                      aria-hidden="true"
                    />
                  ) : item.showChevron ? (
                    <ChevronDown
                      className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  ) : null}
                  {item.label}
                </NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <div className="grid w-full gap-x-6 gap-y-8 p-6 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                    {item.columns.map((column) => (
                      <div key={column.title}>
                        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                          {column.title}
                        </p>
                        <ul className="space-y-0.5">
                          {column.links.map((link) => (
                            <li key={link.href + link.label}>
                              <NavigationMenu.Link asChild>
                                <L
                                  href={link.href}
                                  className="hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                                >
                                  <span>
                                    {link.label}
                                    {link.description ? (
                                      <span className="text-muted-foreground block text-xs">
                                        {link.description}
                                      </span>
                                    ) : null}
                                  </span>
                                  {link.badge ? (
                                    <span className="bg-primary/10 text-accent-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                                      {link.badge}
                                    </span>
                                  ) : null}
                                </L>
                              </NavigationMenu.Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {item.featured ? (
                      <NavigationMenu.Link asChild>
                        <L
                          href={item.featured.href}
                          className="bg-accent text-accent-foreground hover:bg-accent/70 flex flex-col justify-end gap-1 rounded-lg p-4 transition-colors"
                        >
                          <span className="font-semibold">{item.featured.title}</span>
                          <span className="text-sm opacity-80">{item.featured.description}</span>
                          <span className="mt-2 text-sm font-medium underline underline-offset-4">
                            {item.featured.cta}
                          </span>
                        </L>
                      </NavigationMenu.Link>
                    ) : null}
                  </div>
                </NavigationMenu.Content>
              </>
            ) : (
              <NavigationMenu.Link asChild>
                <L href={item.href ?? '#'} className={triggerClass}>
                  {item.label}
                </L>
              </NavigationMenu.Link>
            )}
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
      <div className="absolute inset-x-0 top-full flex justify-center">
        <NavigationMenu.Viewport className="bg-popover text-popover-foreground shadow-pop relative mt-1 h-[var(--radix-navigation-menu-viewport-height)] w-[min(1040px,calc(100vw-2rem))] max-w-full origin-top overflow-visible rounded-xl border" />
      </div>
    </NavigationMenu.Root>
  );
}

/** Full-height Sheet with accordions for small screens. */
export function MobileNav({
  items,
  linkAs: L = 'a',
  footer,
}: {
  items: MegaMenuItem[];
  linkAs?: LinkAs;
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile">
          <Accordion type="multiple">
            {items.map((item) =>
              item.columns ? (
                <AccordionItem key={item.label} value={item.label}>
                  <AccordionTrigger>{item.label}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {item.columns.map((column) => (
                      <div key={column.title}>
                        <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wide">
                          {column.title}
                        </p>
                        <ul>
                          {column.links.map((link) => (
                            <li key={link.href + link.label}>
                              <L
                                href={link.href}
                                onClick={close}
                                className="hover:bg-accent block rounded-md px-2 py-2.5 text-sm"
                              >
                                {link.label}
                              </L>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div key={item.label} className="border-b">
                  <L
                    href={item.href ?? '#'}
                    onClick={close}
                    className="block py-4 text-sm font-medium"
                  >
                    {item.label}
                  </L>
                </div>
              ),
            )}
          </Accordion>
        </nav>
        {footer}
      </SheetContent>
    </Sheet>
  );
}
