/**
 * Validated environment variables.
 * Throws at module load time if required variables are missing,
 * providing a clear error message rather than a silent runtime failure.
 */
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'See .env.example for the list of required variables.'
    )
  }
  return value
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  SVENSKA_SPEL_BASE_URL: requireEnv('SVENSKA_SPEL_BASE_URL'),
  SVENSKA_SPEL_SECRET: requireEnv('SVENSKA_SPEL_SECRET'),
} as const
