import Link from 'next/link'
import { Wordmark } from '@/components/bongen/ui'

const TAGLINE =
  'Alla tippar var för sig. Garderingarna hamnar där ni är oense, och systemet håller sig inom budgeten.'

export default function HomePage() {
  return (
    <main className="animate-fade-up flex min-h-dvh flex-col px-[26px] pb-[34px] lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-16 lg:pb-0">
      <div className="flex flex-1 flex-col justify-center gap-[22px] lg:flex-none">
        <Wordmark />
        <h1 className="text-[40px] leading-[1.06] font-bold tracking-[-0.02em] text-pretty lg:text-[56px] lg:leading-[1.03] lg:tracking-[-0.025em]">
          Gängets tips,
          <br />
          en bong.
        </h1>
        <p className="text-fg-2 max-w-[285px] text-base leading-normal text-pretty lg:max-w-[400px] lg:text-lg">
          {TAGLINE}
        </p>
      </div>

      {/* Phone actions */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        <Link
          href="/session/create"
          className="bg-ember text-ember-fg hover:bg-ember-hover flex h-[54px] w-full items-center justify-center rounded-[14px] text-[17px] font-semibold transition-colors"
        >
          Skapa omgång
        </Link>
        <Link
          href="/join"
          className="border-line-3 text-fg hover:border-fg-4 flex h-[54px] w-full items-center justify-center rounded-[14px] border text-[17px] font-semibold transition-colors"
        >
          Gå med med kod
        </Link>
        <div className="text-fg-4 mt-2 text-center font-mono text-[11px]">
          Inget konto. Koden räcker.
        </div>
      </div>

      {/* Desktop actions */}
      <div className="hidden flex-col gap-3 lg:flex">
        <Link
          href="/session/create"
          className="bg-ember text-ember-fg hover:bg-ember-hover block rounded-2xl px-6 py-[22px] transition-colors"
        >
          <div className="mb-1 text-xl font-semibold">Skapa omgång</div>
          <div className="text-sm opacity-85">
            Du sätter systemets storlek och delar koden.
          </div>
        </Link>
        <Link
          href="/join"
          className="border-line-3 text-fg hover:border-fg-4 block rounded-2xl border px-6 py-[22px] transition-colors"
        >
          <div className="mb-1 text-xl font-semibold">Gå med med kod</div>
          <div className="text-fg-3 text-sm">
            Sex tecken från den som skapat omgången.
          </div>
        </Link>
        <div className="text-fg-4 mt-1.5 font-mono text-[11px]">
          Inget konto. Koden räcker.
        </div>
      </div>
    </main>
  )
}
