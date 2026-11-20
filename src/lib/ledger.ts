import type { StockLedgerEntry } from '../types/inventory';

export type LedgerDirection = 'in' | 'out' | 'transfer';

// Ledger entries store a positive quantity; direction comes from which side has a location.
// Older entries may carry a signed quantity instead, so a negative number also means "out".
export function ledgerDirection(tx: Pick<StockLedgerEntry, 'quantity' | 'sourceLocationId' | 'destinationLocationId'>): LedgerDirection {
  if (tx.sourceLocationId && tx.destinationLocationId) return 'transfer';
  if (tx.sourceLocationId) return 'out';
  if (tx.destinationLocationId) return tx.quantity < 0 ? 'out' : 'in';
  return tx.quantity < 0 ? 'out' : 'in';
}

export function signedLedgerQuantity(tx: Pick<StockLedgerEntry, 'quantity' | 'sourceLocationId' | 'destinationLocationId'>): number {
  const dir = ledgerDirection(tx);
  const q = Math.abs(tx.quantity);
  return dir === 'out' ? -q : dir === 'in' ? q : 0;
}

export function newestFirst<T extends { createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
