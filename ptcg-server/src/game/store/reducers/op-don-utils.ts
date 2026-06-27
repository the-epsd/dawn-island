import { SuperType } from '../card/card-types';
import { Player } from '../state/player';

export const OP_DON_AREA_MAX = 10;
export const OP_DON_DECK_SIZE = 10;

/** Move DON!! cards out of the main deck into {@link Player.donDeck}. */
export function splitDonCardsIntoDonDeck(player: Player): void {
  const don: typeof player.deck.cards = [];
  const main: typeof player.deck.cards = [];
  for (const card of player.deck.cards) {
    if (card.superType === SuperType.DON) {
      don.push(card);
    } else {
      main.push(card);
    }
  }
  player.deck.cards = main;
  player.donDeck.cards = don;
}

/** Add up to `count` DON!! from the DON deck to the cost area (max {@link OP_DON_AREA_MAX} in play). */
export function addDonFromDeckToArea(player: Player, count: number): number {
  const room = OP_DON_AREA_MAX - player.donArea.cards.length;
  const toMove = Math.min(count, room, player.donDeck.cards.length);
  if (toMove > 0) {
    player.donDeck.moveTo(player.donArea, toMove);
  }
  return toMove;
}

/** DON!! placed at refresh: turn 1 → 1 (first player), turn 2+ → 2 per turn. */
export function getDonRefreshCountForTurn(turn: number): number {
  return turn === 1 ? 1 : 2;
}
