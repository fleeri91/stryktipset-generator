'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type View = 'idle' | 'create' | 'join'

export function LandingClient() {
  const [view, setView] = useState<View>('idle')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  function reset() {
    setView('idle')
    setName('')
    setJoinCode('')
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* Decorative rings */}
      <div className="border-primary/5 absolute top-1/2 left-1/2 h-75 w-75 -translate-x-1/2 -translate-y-1/2 rounded-full border" />
      <div className="border-primary/3 absolute top-1/2 left-1/2 h-130 w-130 -translate-x-1/2 -translate-y-1/2 rounded-full border" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Header / Branding */}
        <header className="mb-10 text-center">
          <div className="mb-3 text-5xl">⚽</div>
          <h1 className="font-display text-foreground text-5xl font-bold tracking-widest uppercase">
            STRYKTIPSET
          </h1>
          <p className="text-primary mt-2 text-xs tracking-[5px] uppercase">
            Samarbeta · Tippa · Vinn
          </p>
        </header>

        {/* Idle: Action buttons */}
        {view === 'idle' && (
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setView('create')}
            >
              Skapa Session
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setView('join')}
            >
              Gå Med i Session
            </Button>
          </div>
        )}

        {/* Create form */}
        {view === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg tracking-wider uppercase">
                Skapa Session
              </CardTitle>
              <CardDescription>
                Ange ditt namn för att skapa en ny tippningssession.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Ditt namn</Label>
                <Input
                  id="create-name"
                  autoFocus
                  placeholder="T.ex. Erik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={reset}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Tillbaka
                </Button>
                <Button className="flex-2" disabled={!name.trim()}>
                  Fortsätt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join form */}
        {view === 'join' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg tracking-wider uppercase">
                Gå Med
              </CardTitle>
              <CardDescription>
                Ange ditt namn och sessionskoden du fått av värden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-name">Ditt namn</Label>
                <Input
                  id="join-name"
                  autoFocus
                  placeholder="T.ex. Anna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-code">Sessionskod</Label>
                <Input
                  id="join-code"
                  placeholder="T.ex. ABC123"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 6)
                    )
                  }
                  maxLength={6}
                  className="text-center text-lg tracking-[8px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={reset}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Tillbaka
                </Button>
                <Button
                  className="flex-2"
                  disabled={!name.trim() || joinCode.length !== 6}
                >
                  Gå Med
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <p className="text-muted-foreground absolute bottom-6 text-[10px] tracking-[3px] uppercase">
        Stryktipset Collab v0.1
      </p>
    </div>
  )
}
