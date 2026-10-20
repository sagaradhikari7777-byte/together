const fail = (message, status = 400) => { throw Object.assign(new Error(message), {status}); };
const group = seat => seat < 2 ? 'a' : 'b';
export const recurringFor = (h, seat) => (h.recurring ?? []).filter(r => r.visibility === 'shared' || group(r.payer) === group(seat));
// Adds every recurring expense that is not already on the sheet, dated on the sheet's start. Returns how many were added.
export function applyRecurring(h, sheet, makeId) {
  let added = 0;
  for (const r of h.recurring ?? []) {
    if (h.expenses.some(e => e.sheet === sheet.id && e.recurring === r.id)) continue;
    h.expenses.unshift({id:makeId(), merchant:r.merchant, cents:r.cents, category:r.category, payer:r.payer, visibility:r.visibility, split:r.split, date:sheet.start, notes:r.notes, receipt:'', sheet:sheet.id, creator:r.creator, settlement:null, created:new Date().toISOString(), recurring:r.id});
    added++;
  }
  return added;
}
// Reverses a recorded settlement: its expenses unlock and count toward the balance again.
export function undoSettlement(h, id) {
  const s = h.settlements.find(s => s.id === id);
  if (!s) fail('This settlement no longer exists.', 404);
  if (h.sheets.find(x => x.id === s.sheet)?.archived) fail('Reopen the sheet before undoing its settlement.');
  h.settlements = h.settlements.filter(x => x.id !== id);
  for (const e of h.expenses) if (e.settlement === id) e.settlement = null;
}
