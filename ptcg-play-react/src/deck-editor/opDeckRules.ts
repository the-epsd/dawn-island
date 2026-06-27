import type { Card } from 'ptcg-server';
import { SuperType } from 'ptcg-server';
import type { DeckSlot } from './types';
import {
  OP_DECK_SET,
  OP_DEFAULT_DON_FULL_NAME,
  OP_DON_DECK_SIZE,
  OP_MAIN_DECK_SIZE,
} from './opDeckConfig';
import { addCardToDeck, type CanAddResult, type AddCardResult } from './deckRules';

export type DonSlot = {
  card: Card;
};

export function isOpCatalogCard(card: Card): boolean {
  return card.set === OP_DECK_SET || card.set === 'DON';
}

export function filterOpCatalog(cards: Card[]): Card[] {
  return cards.filter(isOpCatalogCard);
}

export function isOpMainDeckCard(card: Card): boolean {
  return card.set === OP_DECK_SET
    && card.superType !== SuperType.LEADER
    && card.superType !== SuperType.DON;
}

export function isOpLeaderCard(card: Card): boolean {
  return card.set === OP_DECK_SET && card.superType === SuperType.LEADER;
}

export function isOpDonCard(card: Card): boolean {
  return card.superType === SuperType.DON;
}

export function mainDeckCount(slots: DeckSlot[]): number {
  return slots.reduce((sum, slot) => sum + slot.count, 0);
}

export function canSetLeader(card: Card): CanAddResult {
  if (!isOpLeaderCard(card)) {
    return { ok: false, reason: 'Only Leader cards can be placed in the Leader zone.' };
  }
  return { ok: true };
}

export function canAddOneOpMain(slots: DeckSlot[], card: Card): CanAddResult {
  if (isOpLeaderCard(card)) {
    return { ok: false, reason: 'Leader cards belong in the Leader zone, not the main deck.' };
  }
  if (isOpDonCard(card)) {
    return { ok: false, reason: 'DON!! cards belong in the DON!! deck.' };
  }
  if (!isOpMainDeckCard(card)) {
    return { ok: false, reason: 'Only OP01 deck cards can be added to the main deck.' };
  }
  if (mainDeckCount(slots) >= OP_MAIN_DECK_SIZE) {
    return { ok: false, reason: `Main deck is limited to ${OP_MAIN_DECK_SIZE} cards.` };
  }
  return { ok: true };
}

export function addCardToOpMainDeck(slots: DeckSlot[], card: Card): AddCardResult {
  const gate = canAddOneOpMain(slots, card);
  if (gate.ok === false) {
    return { ok: false, reason: gate.reason };
  }
  return addCardToDeck(slots, card, { unlimitedCopies: true });
}

export function createDefaultDonSlots(defaultDon: Card): DonSlot[] {
  return Array.from({ length: OP_DON_DECK_SIZE }, () => ({ card: defaultDon }));
}

export function donSlotsFromFlatNames(flat: string[], byFullName: Map<string, Card>): DonSlot[] {
  const slots: DonSlot[] = [];
  for (const line of flat) {
    const key = line.trim();
    if (!key) {
      continue;
    }
    const card = byFullName.get(key);
    if (card && isOpDonCard(card)) {
      slots.push({ card });
    }
  }
  return slots;
}

export function mainDeckFlatNames(flat: string[], byFullName: Map<string, Card>): string[] {
  return flat.filter((line) => {
    const key = line.trim();
    if (!key) {
      return false;
    }
    const card = byFullName.get(key);
    return !!card && !isOpDonCard(card);
  });
}

export function flatNamesForOpSave(mainSlots: DeckSlot[], donSlots: DonSlot[]): string[] {
  const main = mainSlots.flatMap((slot) => Array.from({ length: slot.count }, () => slot.card.fullName));
  const don = donSlots.map((slot) => slot.card.fullName);
  return [...main, ...don];
}

export function resolveLeaderFromDeck(
  manualArchetype1: string | undefined,
  byFullName: Map<string, Card>,
): Card | null {
  const key = manualArchetype1?.trim();
  if (!key) {
    return null;
  }
  const card = byFullName.get(key);
  if (card && isOpLeaderCard(card)) {
    return card;
  }
  return null;
}

export function ensureDonSlots(
  donSlots: DonSlot[],
  byFullName: Map<string, Card>,
): DonSlot[] {
  const defaultDon = byFullName.get(OP_DEFAULT_DON_FULL_NAME);
  if (!defaultDon) {
    return donSlots;
  }
  if (donSlots.length === 0) {
    return createDefaultDonSlots(defaultDon);
  }
  if (donSlots.length < OP_DON_DECK_SIZE) {
    const next = donSlots.slice();
    while (next.length < OP_DON_DECK_SIZE) {
      next.push({ card: defaultDon });
    }
    return next;
  }
  if (donSlots.length > OP_DON_DECK_SIZE) {
    return donSlots.slice(0, OP_DON_DECK_SIZE);
  }
  return donSlots;
}

export function replaceDonSlotCard(
  donSlots: DonSlot[],
  index: number,
  newCard: Card,
): DonSlot[] {
  if (index < 0 || index >= donSlots.length) {
    return donSlots;
  }
  const next = donSlots.slice();
  next[index] = { card: newCard };
  return next;
}

export function isOpDeckComplete(
  leader: Card | null,
  mainSlots: DeckSlot[],
  donSlots: DonSlot[],
): boolean {
  return !!leader
    && mainDeckCount(mainSlots) === OP_MAIN_DECK_SIZE
    && donSlots.length === OP_DON_DECK_SIZE;
}
