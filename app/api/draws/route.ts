import { NextResponse } from 'next/server'
import { fetchDraw } from '@/lib/api'
import { EventType } from '@/types/SvenskaSpel'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type =
      (searchParams.get('type') as EventType) ?? EventType.Europatipset

    const draw = await fetchDraw(type)

    return NextResponse.json(draw)
  } catch (error) {
    console.error('Failed to fetch draw:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta omgången' },
      { status: 500 }
    )
  }
}
