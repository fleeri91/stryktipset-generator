'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ---------- Typography ---------- */

export function Wordmark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'text-ember font-mono text-[11px] tracking-[0.26em]',
        className
      )}
    >
      B O N G E N
    </div>
  )
}

/** Small mono, letter-spaced label. */
export function Kicker({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'text-fg-3 font-mono text-[11px] tracking-[0.2em] uppercase',
        className
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Buttons ---------- */

type BigButtonVariant = 'primary' | 'light' | 'ghost' | 'muted' | 'dim'

const bigButtonStyles: Record<BigButtonVariant, string> = {
  primary: 'bg-ember text-ember-fg hover:bg-ember-hover',
  light: 'bg-fg text-[oklch(0.18_0.015_60)] hover:bg-white',
  ghost: 'border-line-3 text-fg hover:border-fg-4 border bg-transparent',
  muted: 'bg-ink-4 text-fg-4 cursor-default',
  dim: 'bg-ink-6 text-fg hover:bg-[oklch(0.31_0.012_60)]',
}

export function BigButton({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: BigButtonVariant }) {
  return (
    <button
      type="button"
      className={cn(
        'h-13 w-full cursor-pointer rounded-[14px] border-0 font-sans text-[17px] font-semibold transition-colors disabled:cursor-default',
        bigButtonStyles[variant],
        className
      )}
      {...props}
    />
  )
}

/** Small mono text-only button (e.g. "AVBRYT OMGÅNGEN"). */
export function TextButton({
  className,
  danger = false,
  ...props
}: ComponentProps<'button'> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'text-fg-4 cursor-pointer border-0 bg-transparent p-[3px] font-mono text-[11px] tracking-[0.1em] uppercase transition-colors',
        danger ? 'hover:text-ember-text' : 'hover:text-fg-2',
        className
      )}
      {...props}
    />
  )
}

export function BackButton({
  href,
  onClick,
  className,
}: {
  href?: string
  onClick?: () => void
  className?: string
}) {
  const cls = cn(
    'text-fg-2 hover:text-fg cursor-pointer border-0 bg-transparent p-0 text-[22px] leading-none transition-colors',
    className
  )
  if (href) {
    return (
      <Link href={href} aria-label="Tillbaka" className={cls}>
        ←
      </Link>
    )
  }
  return (
    <button
      type="button"
      aria-label="Tillbaka"
      onClick={onClick}
      className={cls}
    >
      ←
    </button>
  )
}

export function StepButton(props: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className="bg-ink-5 text-fg hover:bg-ink-6 h-9 w-9 cursor-pointer rounded-[9px] border-0 font-mono text-[17px] transition-colors disabled:cursor-default disabled:opacity-40"
      {...props}
    />
  )
}

/* ---------- Inputs ---------- */

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'bg-ink-3 border-line-2 text-fg placeholder:text-fg-4 focus:border-line-3 box-border h-13 w-full rounded-[14px] border px-4 font-sans text-[17px] outline-none',
        className
      )}
      {...props}
    />
  )
}

export function CodeInput({
  invalid = false,
  className,
  ...props
}: ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        'bg-ink-3 text-fg placeholder:text-fg-4/60 box-border h-16 w-full rounded-[14px] border text-center font-mono text-[26px] tracking-[0.28em] uppercase outline-none',
        invalid
          ? 'border-[oklch(0.55_0.15_28)]'
          : 'border-line-2 focus:border-line-3',
        className
      )}
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
      {...props}
    />
  )
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-fg-3 mb-2.5 block font-mono text-[11px] tracking-[0.16em] uppercase"
    >
      {children}
    </label>
  )
}

/* ---------- Session bits ---------- */

export function Avatar({ name, me = false }: { name: string; me?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold',
        me ? 'bg-ember text-ember-fg' : 'bg-ink-6 text-fg-2'
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function StatusPill({ done }: { done: boolean }) {
  return (
    <div
      className={cn(
        'rounded-md px-2 py-1 font-mono text-[10px] tracking-[0.12em]',
        done ? 'bg-ok-bg text-ok-fg' : 'bg-ink-4 text-fg-4'
      )}
    >
      {done ? 'KLAR' : 'VÄNTAR'}
    </div>
  )
}

export function ParticipantRow({
  name,
  me,
  done,
  compact = false,
}: {
  name: string
  me: boolean
  done: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'border-line-2 flex items-center border',
        compact
          ? 'gap-[11px] rounded-[11px] px-3 py-[9px]'
          : 'gap-3 rounded-xl px-3.5 py-[11px]'
      )}
    >
      <Avatar name={name} me={me} />
      <div
        className={cn(
          'min-w-0 flex-1 truncate font-semibold',
          compact ? 'text-[15px]' : 'text-base'
        )}
      >
        {name}
        {me && ' (du)'}
      </div>
      <StatusPill done={done} />
    </div>
  )
}

export function CodeCard({
  code,
  onCopy,
  compact = false,
}: {
  code: string
  onCopy: () => void
  compact?: boolean
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onCopy}
        className="bg-ink-4 w-full cursor-pointer rounded-[14px] border-0 px-4 py-3.5 text-left transition-colors hover:bg-[oklch(0.265_0.012_60)]"
      >
        <div className="mb-[5px] flex items-center justify-between">
          <span className="text-fg-3 font-mono text-[10px] tracking-[0.18em]">
            DELA KODEN
          </span>
          <span className="text-ember font-mono text-[10px] tracking-[0.08em]">
            KOPIERA
          </span>
        </div>
        <div className="text-fg font-mono text-[25px] font-semibold tracking-[0.16em]">
          {code}
        </div>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="bg-ink-3 flex w-full cursor-pointer items-center justify-between rounded-2xl border-0 px-[18px] py-[15px] text-left transition-colors hover:bg-[oklch(0.245_0.01_60)]"
    >
      <div>
        <div className="text-fg-3 mb-[5px] font-mono text-[10px] tracking-[0.18em]">
          DELA KODEN
        </div>
        <div className="text-fg font-mono text-[27px] font-semibold tracking-[0.16em]">
          {code}
        </div>
      </div>
      <div className="text-ember font-mono text-[11px] tracking-[0.08em]">
        KOPIERA
      </div>
    </button>
  )
}

/** Chip showing used/available garderingar; turns warning-red when over. */
export function LimitChip({
  over,
  children,
}: {
  over: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em]',
        over ? 'bg-warn-bg text-warn-fg' : 'bg-ink-4 text-fg-2'
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Screen chrome ---------- */

/** Full-height column: header / scrollable body / footer. */
export function Screen({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {children}
    </div>
  )
}

export function ScreenHeader({
  back,
  title,
  right,
  className,
}: {
  back?: string | (() => void)
  title: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3.5 px-[22px] pt-1.5 pb-3.5 lg:px-11 lg:pt-[26px] lg:pb-5',
        className
      )}
    >
      {typeof back === 'string' ? (
        <BackButton href={back} />
      ) : back ? (
        <BackButton onClick={back} />
      ) : null}
      <Kicker className="text-fg-2 flex-1">{title}</Kicker>
      {right}
    </div>
  )
}

export function ScreenFooter({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'border-line flex flex-col gap-[9px] border-t px-[22px] pt-[13px] pb-7',
        className
      )}
    >
      {children}
    </div>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <div className="text-ember-text mt-[9px] font-mono text-[11px]">
      {children}
    </div>
  )
}
