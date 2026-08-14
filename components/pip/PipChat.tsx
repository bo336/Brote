'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SendHorizonal, X } from 'lucide-react';
import { Pip } from '@/components/pip/Pip';
import { useAds } from '@/components/ads/AdsProvider';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/stores/session';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

interface Msg {
  role: 'user' | 'pip';
  text: string;
}

const SUGGESTIONS = [
  '¿Qué puedo hacer hoy?',
  'Contame de mi mundo 🌍',
  'Dame una idea rápida ♻️',
  '¿Cómo cuido mi racha?',
];

/**
 * Pip Chat (IMPROVEMENT_PLAN F4) — a floating Pip on every app screen that
 * opens a conversational eco-coach backed by the `pip-chat` edge function
 * (Gemini + the user's real context). Degrades gracefully to playful canned
 * replies when the AI is unavailable.
 */
export function PipChat() {
  const profile = useSession((s) => s.profile);
  const { monetization } = useAds();
  const isPro = monetization?.is_pro ?? false;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  /** Eco-expert mode (F12.7): rigorous environmental answers instead of coaching. */
  const [expert, setExpert] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thinking, open]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    haptic('light');
    const history: Msg[] = [...messages, { role: 'user', text: clean }];
    setMessages(history);
    setInput('');
    setThinking(true);
    try {
      const { data, error } = await createClient().functions.invoke('pip-chat', {
        // Never request the paid mode without the plan, even if state drifted
        // (e.g. a subscription lapsed while the sheet was open).
        body: { messages: history.slice(-8), mode: expert && isPro ? 'experto' : 'coach' },
      });
      const reply: string =
        (!error && (data as { reply?: string } | null)?.reply) ||
        'Se me enredaron las hojas 🍃 Probá de nuevo en un ratito.';
      setMessages((m) => [...m, { role: 'pip', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'pip', text: 'Se me enredaron las hojas 🍃 Probá de nuevo en un ratito.' }]);
    } finally {
      setThinking(false);
    }
  }

  if (!profile) return null;

  /*
   * The whole assistant is a Brote+ feature, not just the expert mode: every
   * reply costs a model call, so it is the clearest thing the plan can buy.
   * Non-subscribers get no floating button at all rather than a button that
   * turns into a paywall — offering something and then refusing it is worse
   * than not offering it. The plan link lives on the profile screen.
   */
  if (!isPro) return null;

  return (
    <>
      {/* Floating Pip button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="pip-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              haptic('light');
              setOpen(true);
            }}
            aria-label="Hablar con Pip"
            className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-surface shadow-soft-lg ring-1 ring-border lg:bottom-6"
          >
            <Pip size={44} mood="happy" pipStyle={profile.pipStyle} />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              ✦
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="pip-chat"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed bottom-0 right-0 z-50 flex h-[70dvh] w-full flex-col overflow-hidden rounded-t-sheet border border-border bg-background shadow-soft-lg sm:bottom-4 sm:right-4 sm:h-[560px] sm:max-h-[80dvh] sm:w-[380px] sm:rounded-sheet"
            role="dialog"
            aria-label="Chat con Pip"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-border bg-surface px-4 py-3">
              <Pip size={36} mood="happy" pipStyle={profile.pipStyle} />
              <div className="flex-1">
                <p className="font-display text-body font-bold leading-tight">{expert ? 'Eco-Experto' : 'Pip'}</p>
                <p className="text-caption text-muted-foreground">
                  {expert ? 'Respuestas ambientales rigurosas 🧪' : 'Tu eco-coach · con IA ✦'}
                </p>
              </div>
              {/* Eco-Experto is a Brote+ feature (F15.21): it is the mode that
                  actually costs money to run, so it is what the plan buys. The
                  free coach stays available to everyone. */}
              {isPro ? (
                <button
                  onClick={() => {
                    haptic('light');
                    setExpert((v) => !v);
                  }}
                  aria-label="Cambiar modo"
                  className={cn(
                    'rounded-pill border px-2.5 py-1 text-caption font-semibold transition-colors',
                    expert ? 'border-brote-aqua/50 bg-brote-aqua/15 text-brote-aqua' : 'border-border text-muted-foreground',
                  )}
                >
                  {expert ? '🧪 Experto' : '🌱 Coach'}
                </button>
              ) : (
                <Link
                  href="/brote-plus"
                  onClick={() => setOpen(false)}
                  className="rounded-pill border border-brote-sun/40 bg-brote-sun/10 px-2.5 py-1 text-caption font-semibold text-brote-sun"
                >
                  🧪 Experto · Brote+
                </Link>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-3 pt-6 text-center">
                  <Pip size={72} mood="happy" />
                  <p className="max-w-[260px] text-small text-muted-foreground">
                    ¡Hola{profile.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}! Soy Pip 🌱
                    Preguntame lo que quieras sobre tu mundo, tus acciones o cómo sumar más.
                  </p>
                  <div className="mt-1 flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-pill border border-border bg-surface px-3 py-1.5 text-caption font-medium transition-colors hover:border-primary hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'pip' && <Pip size={26} mood="happy" className="mr-2 mt-1 shrink-0" />}
                  <div
                    className={cn(
                      'max-w-[78%] whitespace-pre-wrap rounded-card px-3.5 py-2.5 text-small leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-surface-2 text-foreground',
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex items-center gap-2">
                  <Pip size={26} mood="happy" className="shrink-0" />
                  <div className="flex gap-1 rounded-card rounded-bl-md bg-surface-2 px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2 border-t border-border bg-surface px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribile a Pip…"
                maxLength={500}
                className="min-w-0 flex-1 rounded-pill border border-border bg-background px-4 py-2.5 text-small outline-none transition-colors focus:border-primary"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
