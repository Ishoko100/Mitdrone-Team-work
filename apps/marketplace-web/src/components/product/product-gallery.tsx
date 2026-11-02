'use client';

import { cn } from '@mitdrone/ui';
import Image from 'next/image';
import { useState } from 'react';

import type { ProductImage } from '@mitdrone/types';

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current)
    return (
      <div
        className="bg-muted aspect-[4/3] rounded-2xl"
        role="img"
        aria-label="No image available"
      />
    );
  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-2xl border">
        <Image
          src={current.url}
          alt={current.alt || title}
          fill
          priority
          sizes="(min-width:1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2" aria-label="Product images">
          {images.map((image, i) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === index}
                className={cn(
                  'bg-muted relative block size-20 overflow-hidden rounded-lg border',
                  i === index && 'ring-primary ring-2',
                )}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
