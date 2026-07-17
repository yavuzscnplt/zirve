// Claude Agent SDK sadece-ESM; CJS main'de dinamik import ile yüklenir.
// Tek sefer yüklenip önbelleğe alınır; hem koç hem analiz kullanır.
type AgentSdk = typeof import('@anthropic-ai/claude-agent-sdk')

let sdkPromise: Promise<AgentSdk> | null = null

export function loadSdk(): Promise<AgentSdk> {
  if (!sdkPromise) sdkPromise = import('@anthropic-ai/claude-agent-sdk')
  return sdkPromise
}
