import { NextResponse } from 'next/server'
import { fetchAllDraws } from '@/lib/api'

export async function GET() {
  try {
    const draws = await fetchAllDraws()
    return NextResponse.json(draws)
  } catch (error) {
    console.error('Failed to fetch draws:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta omgångar' },
      { status: 500 }
    )
  }
}
