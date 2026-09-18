'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BigButton,
  CodeInput,
  ErrorText,
  FieldLabel,
  ScreenHeader,
  TextInput,
} from '@/components/bongen/ui'

const JOIN_ERRORS: Record<number, string> = {
  404: 'Ingen omgång med den koden. Kontrollera och försök igen.',
  403: 'Omgången är redan låst. Bongen har genererats.',
  409: 'Namnet är redan taget i den här omgången.',
  410: 'Omgången har stängt.',
}

export default function JoinPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canJoin = code.length === 6 && name.trim().length > 0 && !isPending

  function handleJoin() {
    if (!canJoin) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sessions/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        })
        if (!res.ok) {
          setError(JOIN_ERRORS[res.status] ?? 'Något gick fel. Försök igen.')
          return
        }
        const data = await res.json()
        router.push(`/session/${data.sessionCode}`)
      } catch {
        setError('Kunde inte ansluta. Försök igen.')
      }
    })
  }

  return (
    <div className="animate-fade-up flex h-dvh flex-col">
      <ScreenHeader back="/" title="Gå med" className="lg:pb-0" />

      <div className="flex flex-1 flex-col px-[22px] pb-[34px] lg:items-center lg:justify-center lg:px-11 lg:pb-10">
        <div className="flex flex-1 flex-col gap-[22px] pt-5 lg:w-[400px] lg:flex-none lg:pt-0">
          <div>
            <FieldLabel htmlFor="join-code">Kod</FieldLabel>
            <CodeInput
              id="join-code"
              value={code}
              invalid={!!error}
              maxLength={6}
              placeholder="K7M2QX"
              autoFocus
              onChange={(e) => {
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 6)
                )
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <ErrorText>{error}</ErrorText>
          </div>
          <div>
            <FieldLabel htmlFor="join-name">Ditt namn</FieldLabel>
            <TextInput
              id="join-name"
              value={name}
              maxLength={20}
              placeholder="Sara"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>
          <p className="text-fg-3 text-sm leading-normal lg:hidden">
            Koden får du av den som skapat omgången. Sex tecken, inga nollor
            eller O.
          </p>
          <BigButton
            className="mt-auto lg:mt-0"
            variant={canJoin ? 'primary' : 'muted'}
            disabled={!canJoin}
            onClick={handleJoin}
          >
            {isPending ? 'Ansluter…' : 'Gå med'}
          </BigButton>
        </div>
      </div>
    </div>
  )
}
