import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LobbyClient } from './lobby-client'

interface Props {
  params: Promise<{ code: string }>
}

export default async function SessionPage({ params }: Props) {
  const { code } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('participant-token')?.value

  if (!token) redirect('/')

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: {
      session: {
        include: {
          participants: {
            select: { id: true, name: true, isHost: true, submitted: true },
            orderBy: { isHost: 'desc' },
          },
        },
      },
    },
  })

  if (!participant || participant.session.code !== code.toUpperCase()) {
    redirect('/')
  }

  const session = participant.session

  return (
    <LobbyClient
      sessionCode={session.code}
      status={session.status}
      participants={session.participants}
      currentParticipantId={participant.id}
    />
  )
}
