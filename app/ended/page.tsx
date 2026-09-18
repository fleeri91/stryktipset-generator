import Link from 'next/link'

interface Props {
  searchParams: Promise<{ kind?: string; code?: string }>
}

export default async function EndedPage({ searchParams }: Props) {
  const { kind, code } = await searchParams
  const cancelled = kind === 'cancelled'
  const safeCode = (code ?? '').replace(/[^A-Z0-9]/gi, '').toUpperCase()

  const kicker = cancelled ? 'AVBRUTEN' : 'DU LÄMNADE'
  const title = cancelled ? 'Omgången är avbruten' : 'Du är inte med längre'
  const body = cancelled
    ? `Koden${safeCode ? ` ${safeCode}` : ''} slutar fungera och allas tips är borttagna. Ingen bong genererades.`
    : 'Ditt tips är borttaget från omgången. Du kan gå med igen med samma kod så länge omgången är öppen.'

  return (
    <main className="animate-fade-up flex min-h-dvh flex-col justify-center gap-[15px] px-[30px] pb-[46px] lg:gap-4 lg:px-16 lg:pb-0">
      <div className="text-ember font-mono text-[11px] tracking-[0.22em]">
        {kicker}
      </div>
      <h2 className="text-[30px] leading-[1.15] font-bold tracking-[-0.015em] text-pretty lg:text-[40px] lg:leading-[1.12] lg:tracking-[-0.02em]">
        {title}
      </h2>
      <p className="text-fg-2 text-base leading-normal text-pretty lg:max-w-[460px] lg:text-[17px]">
        {body}
      </p>
      <Link
        href="/"
        className="bg-ink-6 text-fg mt-3 flex h-13 items-center justify-center rounded-[14px] text-[17px] font-semibold transition-colors hover:bg-[oklch(0.31_0.012_60)] lg:w-[200px]"
      >
        Till start
      </Link>
    </main>
  )
}
