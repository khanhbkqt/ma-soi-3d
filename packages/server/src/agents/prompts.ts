// ── Response Parsing ──
// Prompt building has moved to ./prompt-builders/

export function parseActionResponse(response: string, validNames: string[]): { target: string | null; target1?: string; target2?: string; player1?: string; player2?: string; message?: string; heal?: boolean; killTarget?: string | null; infect?: boolean; verdict?: string; reasoning?: string } {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.target && parsed.target !== 'skip') {
        const match = validNames.find(n => n.toLowerCase() === parsed.target.toLowerCase());
        if (match) parsed.target = match;
        else if (validNames.length) parsed.target = validNames[Math.floor(Math.random() * validNames.length)];
      }
      if (parsed.killTarget) {
        const match = validNames.find(n => n.toLowerCase() === parsed.killTarget.toLowerCase());
        parsed.killTarget = match || null;
      }
      for (const key of ['target1', 'target2', 'player1', 'player2']) {
        if (parsed[key]) {
          const match = validNames.find(n => n.toLowerCase() === parsed[key].toLowerCase());
          if (match) parsed[key] = match;
          else if (validNames.length) parsed[key] = validNames[Math.floor(Math.random() * validNames.length)];
        }
      }
      return parsed;
    }
  } catch { }
  for (const name of validNames) {
    if (response.toLowerCase().includes(name.toLowerCase())) {
      return { target: name, message: response };
    }
  }
  return { target: validNames.length ? validNames[Math.floor(Math.random() * validNames.length)] : null };
}
