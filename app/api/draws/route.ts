import { NextResponse } from 'next/server'
import { fetchAllDraws } from '@/lib/api'

export async function GET() {
  try {
    const draws = await fetchAllDraws()
    return NextResponse.json(draws, {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    })
  } catch (error) {
    console.error('Failed to fetch draws:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draws' },
      { status: 500 }
    )
  }
}
