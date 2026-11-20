/** Fill numbered placeholders in a translated string: fmt('Expires in {0} days', [5]). */
export const fmt = (template: string, values: ReadonlyArray<unknown>): string =>
  template.replace(/\{(\d+)\}/g, (match, i: string) => (Number(i) < values.length ? String(values[Number(i)]) : match));
