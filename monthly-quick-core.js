/* Quick entry stores only selected-day reading values. Register calculations stay in monthly-energy.js. */
export const channels = ['firstImport', 'firstExport', 'secondImport', 'secondExport'];
export function rowValues(data, day) {
  return Object.fromEntries(channels.map(key => [key, String(data?.days?.[String(day)]?.[key] ?? '')]));
}
export function changedValues(baseline, draft) {
  return Object.fromEntries(channels.filter(key => String(draft[key] ?? '') !== String(baseline[key] ?? ''))
    .map(key => [key, String(draft[key] ?? '')]));
}
export function prepareDayUpdate(data, day, baseline, draft) {
  const latest = rowValues(data, day);
  const patch = changedValues(baseline, draft);
  const previous = day === 1 ? data?.opening : data?.days?.[String(day - 1)];
  const next = data?.days?.[String(day + 1)];
  for (const [key, value] of Object.entries(patch)) {
    if (latest[key] !== String(baseline[key] ?? '') && latest[key] !== value) {
      throw new Error('This reading was changed by another user. Your entry is retained; refresh before saving.');
    }
    if (value.trim() !== '') {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0) throw new Error('Enter a valid non-negative reading.');
      const start = previous?.[key];
      if (start !== undefined && start !== null && String(start).trim() !== '' && number < Number(start)) {
        throw new Error('Reading must not be below the previous closing reading.');
      }
      const following = next?.[key];
      if (following !== undefined && following !== null && String(following).trim() !== '' && number > Number(following)) {
        throw new Error('Reading must not be above the next saved closing reading.');
      }
    }
  }
  return {patch, row: {...latest, ...patch}};
}
