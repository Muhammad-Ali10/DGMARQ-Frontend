export const payoutLineState = (line, now = Date.now()) => {
  if (Number(line?.netAmount || 0) < 0) return 'deduction';
  const status = line?.status;
  if (status === 'available' || status === 'frozen') return 'withdrawable';
  if (status === 'pending') {
    const holdMs = line?.holdUntil ? new Date(line.holdUntil).getTime() : null;
    return holdMs != null && holdMs <= now ? 'withdrawable' : 'held';
  }
  return 'unavailable';
};

const UNAVAILABLE_NOTE = {
  blocked: 'Payout cancelled — not payable',
  hold: 'Held during a payment dispute',
  released: 'Already paid out',
};

export const unavailableLineNote = (status) => UNAVAILABLE_NOTE[status] || 'Not available to withdraw';
