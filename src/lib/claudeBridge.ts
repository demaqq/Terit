// When Terit runs as a Claude artifact, `window.claude` exists and the page can ask
// Claude through the `sample` capability. Everywhere else this resolves null and the
// app uses its own /api (Gemini) backend.

type SampleTurn = { role: 'user' | 'assistant'; content: string };
type SampleFn = (
  input: string | SampleTurn[],
  options?: Record<string, unknown>
) => Promise<{ text: string; truncated: boolean }>;

let samplePromise: Promise<SampleFn | null> | null = null;

export function getClaudeSample(): Promise<SampleFn | null> {
  if (samplePromise) return samplePromise;
  const claude = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  if (!claude?.use) {
    samplePromise = Promise.resolve(null);
  } else {
    samplePromise = claude
      .use('sample')
      .then((fn) => (typeof fn === 'function' ? (fn as SampleFn) : null))
      .catch(() => null);
  }
  return samplePromise;
}
