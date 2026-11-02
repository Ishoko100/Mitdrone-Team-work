'use client';

import { useAuth } from '@mitdrone/auth';
import { getErrorMessage, useLiveMessages, usePostLiveMessage } from '@mitdrone/sdk';
import { Button, Input, Switch, toast } from '@mitdrone/ui';
import { formatDateTime } from '@mitdrone/utils';
import { HelpCircle, PlayCircle, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { Price } from '@/components/product/price';
import { useCartStore } from '@/stores/cart';

import { StatusPill } from './live-card';

import type { LiveSession, Product } from '@mitdrone/types';

/** Frontend-only: no real video. The player is a placeholder and chat is mocked with polling. */
export function LiveRoom({
  session,
  product,
}: {
  session: LiveSession;
  product?: Product | undefined;
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const messages = useLiveMessages(session.id);
  const post = usePostLiveMessage(session.id, user?.name ?? 'You');
  const [text, setText] = useState('');
  const [question, setQuestion] = useState(false);
  const log = useRef<HTMLUListElement>(null);
  const count = messages.data?.length ?? 0;

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [count]);

  function send(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    post.mutate(
      { body, isQuestion: question || body.includes('?') },
      { onError: (e) => toast.error(getErrorMessage(e)) },
    );
    setText('');
  }

  function buyNow() {
    if (!product) return;
    add(
      {
        productId: product.id,
        vendorId: product.vendorId,
        title: product.title,
        slug: product.slug,
        ...(product.images[0] ? { imageUrl: product.images[0].url } : {}),
        unitPrice: product.price,
        maxQuantity: product.inventory.quantity,
      },
      1,
    );
    router.push('/checkout');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div
          className="from-primary/90 to-foreground text-primary-foreground relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br"
          role="img"
          aria-label="Live stream placeholder"
        >
          <PlayCircle className="size-20 opacity-90" aria-hidden="true" />
          <span className="absolute left-4 top-4">
            <StatusPill session={session} />
          </span>
          {session.status === 'live' ? (
            <span className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs">
              {session.viewerCount} watching
            </span>
          ) : null}
          <span className="absolute bottom-4 left-4 text-xs opacity-80">
            Demo stream. Video is not available in this build.
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{session.title}</h1>
          <p className="text-muted-foreground text-sm">
            {session.hostName} · {formatDateTime(session.startsAt)}
          </p>
          <p>{session.description}</p>
        </div>
        {product ? (
          <div className="bg-card shadow-soft flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt=""
                width={120}
                height={90}
                className="bg-muted rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-primary text-xs font-semibold uppercase tracking-wide">
                Featured in this session
              </p>
              <Link
                href={`/products/${product.slug}`}
                className="block truncate font-medium hover:underline"
              >
                {product.title}
              </Link>
              <Price price={product.price} compareAt={product.compareAtPrice} />
            </div>
            <div className="flex gap-2">
              <AddToCartButton product={product} variant="outline" />
              <Button onClick={buyNow} disabled={product.inventory.quantity <= 0}>
                Buy Now
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <section
        aria-labelledby="chat-h"
        className="bg-card shadow-soft flex h-[480px] flex-col rounded-xl border lg:h-auto lg:min-h-[480px]"
      >
        <h2 id="chat-h" className="border-b px-4 py-3 font-semibold">
          Live chat and Q&A
        </h2>
        <ul
          ref={log}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className="flex-1 space-y-3 overflow-y-auto p-4"
        >
          {messages.data?.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="font-medium">{m.authorName}</span>
              {m.isQuestion ? (
                <span className="bg-accent text-accent-foreground ml-1 inline-flex items-center gap-0.5 rounded px-1.5 text-xs">
                  <HelpCircle className="size-3" aria-hidden="true" />
                  Question
                </span>
              ) : null}
              <p className="text-muted-foreground">{m.body}</p>
            </li>
          ))}
          {messages.isSuccess && count === 0 ? (
            <li className="text-muted-foreground text-sm">
              No messages yet. Ask the host a question.
            </li>
          ) : null}
        </ul>
        {isAuthenticated ? (
          <form onSubmit={send} className="space-y-2 border-t p-3">
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Say something or ask a question"
                aria-label="Message"
                maxLength={300}
              />
              <Button type="submit" size="icon" aria-label="Send message" disabled={!text.trim()}>
                <Send />
              </Button>
            </div>
            <label className="text-muted-foreground flex items-center gap-2 text-xs">
              <Switch
                checked={question}
                onCheckedChange={setQuestion}
                aria-label="Mark as question"
              />{' '}
              Mark as a question for the host
            </label>
          </form>
        ) : (
          <p className="border-t p-4 text-sm">
            <Link
              href={`/login?next=${encodeURIComponent(`/live/${session.id}`)}`}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>{' '}
            to join the chat.
          </p>
        )}
      </section>
    </div>
  );
}
