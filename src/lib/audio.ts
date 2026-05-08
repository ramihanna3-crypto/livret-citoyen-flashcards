export function audioUrl(sha1: string): string {
  return `${import.meta.env.BASE_URL}audio/${sha1}.mp3`;
}
