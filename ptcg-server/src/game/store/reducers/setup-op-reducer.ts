import { CardManager } from '../../cards/card-manager';
import { Card } from '../card/card';
import { SuperType, Format } from '../card/card-types';
import { LeaderCard } from '../card/leader-card';
import { ConfirmPrompt } from '../prompts/confirm-prompt';
import { CoinFlipPrompt } from '../prompts/coin-flip-prompt';
import { Player } from '../state/player';
import { CardList } from '../state/card-list';
import { State, GamePhase, GameWinner } from '../state/state';
import { StoreLike } from '../store-like';
import { GameMessage, GameLog } from '../../game-message';
import { initNextTurn } from '../effect-reducers/game-phase-effect';
import { WhoBeginsEffect } from '../effects/game-phase-effects';
import {
  splitDonCardsIntoDonDeck,
} from './op-don-utils';

const OP_OPENING_HAND_SIZE = 5;

function shuffleCardListInPlace(list: CardList): void {
  const cards = list.cards;
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
}

function registerCardInState(state: State, card: Card): void {
  state.cardNames.push(card.fullName);
  card.id = state.cardNames.length - 1;
}

export function placeLeaderOnField(player: Player, leaderFullName: string | undefined, state: State): boolean {
  const cardManager = CardManager.getInstance();
  let leaderCard: Card | undefined;

  if (leaderFullName) {
    leaderCard = cardManager.getCardByName(leaderFullName);
    if (leaderCard) {
      const deckIndex = player.deck.cards.findIndex(c => c.fullName === leaderCard!.fullName);
      if (deckIndex !== -1) {
        player.deck.moveCardTo(player.deck.cards[deckIndex], player.leader);
      } else {
        // Leader is stored outside the 60-card save blob — assign a game card id for serialization.
        registerCardInState(state, leaderCard);
        player.leader.cards.push(leaderCard);
      }
    }
  }

  if (!leaderCard || player.leader.cards.length === 0) {
    const deckLeaderIndex = player.deck.cards.findIndex(c => c.superType === SuperType.LEADER);
    if (deckLeaderIndex !== -1) {
      player.deck.moveCardTo(player.deck.cards[deckLeaderIndex], player.leader);
    }
  }

  if (player.leader.cards.length === 0) {
    return false;
  }

  player.leader.isPublic = true;
  player.leader.isSecret = false;
  return true;
}

function getLeaderLife(player: Player): number {
  const card = player.leader.cards[0];
  if (card instanceof LeaderCard) {
    return card.life;
  }
  return 5;
}

function placeLifeCards(player: Player): boolean {
  const lifeCount = getLeaderLife(player);
  player.prizes = [];

  for (let i = 0; i < lifeCount; i++) {
    const lifeCard = new CardList();
    lifeCard.isSecret = true;
    player.prizes.push(lifeCard);
  }

  for (let i = 0; i < lifeCount; i++) {
    if (player.deck.cards.length === 0) {
      return false;
    }
    player.deck.moveTo(player.prizes[i], 1);
  }

  return true;
}

function* opMulliganForPlayer(
  player: Player,
  next: Function,
  store: StoreLike,
  state: State,
): IterableIterator<State> {
  yield store.prompt(state, new ConfirmPrompt(player.id, GameMessage.MULLIGAN), choice => {
    if (choice === true) {
      player.hand.moveTo(player.deck);
      shuffleCardListInPlace(player.deck);
      player.deck.moveTo(player.hand, OP_OPENING_HAND_SIZE);
    }
    next();
  });
}

export function* setupOnePieceGame(
  next: Function,
  store: StoreLike,
  state: State,
): IterableIterator<State> {
  const player = state.players[0];
  const opponent = state.players[1];

  for (const p of state.players) {
    if (!placeLeaderOnField(p, p.leaderFullName, state)) {
      store.log(state, GameLog.LOG_GAME_FINISHED_BEFORE_STARTED);
      state.phase = GamePhase.FINISHED;
      state.winner = GameWinner.NONE;
      return state;
    }
  }

  const whoBeginsEffect = new WhoBeginsEffect();
  store.reduceEffect(state, whoBeginsEffect);
  if (whoBeginsEffect.player) {
    state.activePlayer = state.players.indexOf(whoBeginsEffect.player);
  } else {
    const coinFlipPrompt = new CoinFlipPrompt(player.id, GameMessage.SETUP_WHO_BEGINS_FLIP);
    yield store.prompt(state, coinFlipPrompt, whoBegins => {
      state.activePlayer = whoBegins ? 0 : 1;
      next();
    });
  }

  shuffleCardListInPlace(player.deck);
  shuffleCardListInPlace(opponent.deck);

  for (const p of state.players) {
    splitDonCardsIntoDonDeck(p);
    shuffleCardListInPlace(p.donDeck);
    p.donDeck.isSecret = true;
    p.donArea.isPublic = true;
  }

  player.deck.moveTo(player.hand, OP_OPENING_HAND_SIZE);
  opponent.deck.moveTo(opponent.hand, OP_OPENING_HAND_SIZE);

  yield* opMulliganForPlayer(player, next, store, state);
  yield* opMulliganForPlayer(opponent, next, store, state);

  for (const p of state.players) {
    if (!placeLifeCards(p)) {
      store.log(state, GameLog.LOG_GAME_FINISHED_BEFORE_STARTED);
      state.phase = GamePhase.FINISHED;
      state.winner = GameWinner.NONE;
      return state;
    }
  }

  return initNextTurn(store, state);
}

export function isOnePieceFormat(format: Format | undefined): boolean {
  return format === Format.ONE_PIECE;
}
