import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateSessionCode } from '@/lib/bong'
import { createSessionSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = createSessionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Ogiltig data', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { hostName, betPerRow, matches } = result.data

    let code = generateSessionCode()
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.session.findUnique({ where: { code } })
      if (!existing) break
      code = generateSessionCode()
      attempts++
    }

    const session = await prisma.session.create({
      data: {
        code,
        betPerRow,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        matches: {
          create: matches.map((match, index) => ({
            matchIndex: index + 1,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            kickoff: new Date(match.kickoff),
          })),
        },
        participants: {
          create: {
            name: hostName,
            isHost: true,
          },
        },
      },
      include: {
        participants: true,
      },
    })

    const host = session.participants[0]

    const cookieStore = await cookies()
    cookieStore.set('participant-token', host.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({ code: session.code }, { status: 201 })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa sessionen' },
      { status: 500 }
    )
  }
}
