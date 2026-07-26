export const REQUIRED_ENV_VARS = ['VITE_API_URL', 'VITE_WS_URL'] as const

type Environment = Record<string, string | boolean | undefined>

export function getMissingRequiredEnvVars(env: Environment): string[] {
  return REQUIRED_ENV_VARS.filter((name) => {
    const value = env[name]
    return typeof value !== 'string' || value.trim() === ''
  })
}
