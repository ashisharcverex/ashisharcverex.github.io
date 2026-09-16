export function splitSampleBody(body: string) {
  const match = /\n={60}\nProvided RTL: ([^\n]+)\n={60}\n\n/.exec(body);
  return match
    ? { prompt: body.slice(0, match.index).trim(), rtlPath: match[1], rtl: body.slice(match.index + match[0].length) }
    : { prompt: body.trim(), rtlPath: undefined, rtl: undefined };
}
