export interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  league: string
  kickoff: string
}

/**
 * Sample matches for MVP.
 * Replace with Svenska Spel API or football data provider later.
 */
export function getAvailableMatches(): Match[] {
  const today = new Date().toISOString().split('T')[0]

  return [
    {
      id: 1,
      homeTeam: 'AIK',
      awayTeam: 'Djurgården',
      league: 'Allsvenskan',
      kickoff: `${today}T13:00:00Z`,
    },
    {
      id: 2,
      homeTeam: 'Malmö FF',
      awayTeam: 'IFK Göteborg',
      league: 'Allsvenskan',
      kickoff: `${today}T13:00:00Z`,
    },
    {
      id: 3,
      homeTeam: 'Hammarby',
      awayTeam: 'IFK Norrköping',
      league: 'Allsvenskan',
      kickoff: `${today}T15:30:00Z`,
    },
    {
      id: 4,
      homeTeam: 'Elfsborg',
      awayTeam: 'Häcken',
      league: 'Allsvenskan',
      kickoff: `${today}T15:30:00Z`,
    },
    {
      id: 5,
      homeTeam: 'Sirius',
      awayTeam: 'Kalmar FF',
      league: 'Allsvenskan',
      kickoff: `${today}T15:30:00Z`,
    },
    {
      id: 6,
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      league: 'Premier League',
      kickoff: `${today}T16:00:00Z`,
    },
    {
      id: 7,
      homeTeam: 'Liverpool',
      awayTeam: 'Man City',
      league: 'Premier League',
      kickoff: `${today}T16:00:00Z`,
    },
    {
      id: 8,
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      league: 'La Liga',
      kickoff: `${today}T18:00:00Z`,
    },
    {
      id: 9,
      homeTeam: 'Atlético',
      awayTeam: 'Sevilla',
      league: 'La Liga',
      kickoff: `${today}T18:00:00Z`,
    },
    {
      id: 10,
      homeTeam: 'Bayern',
      awayTeam: 'Dortmund',
      league: 'Bundesliga',
      kickoff: `${today}T18:30:00Z`,
    },
    {
      id: 11,
      homeTeam: 'Inter',
      awayTeam: 'AC Milan',
      league: 'Serie A',
      kickoff: `${today}T20:00:00Z`,
    },
    {
      id: 12,
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      league: 'Ligue 1',
      kickoff: `${today}T20:00:00Z`,
    },
    {
      id: 13,
      homeTeam: 'Juventus',
      awayTeam: 'Roma',
      league: 'Serie A',
      kickoff: `${today}T20:45:00Z`,
    },
  ]
}

export function formatKickoff(kickoff: string): string {
  return new Date(kickoff).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
