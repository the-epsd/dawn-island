import { PlayCharacterEffect } from '../effects/play-card-effects';
import { GameError } from '../../game-error';
import { GameMessage, GameLog } from '../../game-message';
import { Effect } from '../effects/effect';
import { State } from '../state/state';
import { StoreLike } from '../store-like';
import { SlotType } from '../actions/play-card-action';

function emitAnimationEvent(store: StoreLike, eventName: string, data: {
  playerId: number;
  cardId: number | string;
  slot?: string;
  index?: number;
}): void {
  const game = (store as any).handler;
  if (game && game.core && typeof game.core.emit === 'function') {
    game.core.emit((c: any) => {
      if (typeof c.socket !== 'undefined') {
        c.socket.emit(`game[${game.id}]:${eventName}`, data);
      }
    });
  }
}

export function playCharacterReducer(store: StoreLike, state: State, effect: Effect): State {
  if (effect instanceof PlayCharacterEffect) {
    if (effect.target.cards.length > 0) {
      throw new GameError(GameMessage.INVALID_TARGET);
    }

    store.log(state, GameLog.LOG_PLAYER_PLAYS_BASIC_POKEMON, {
      name: effect.player.name,
      card: effect.characterCard.name,
    });

    effect.player.hand.moveCardTo(effect.characterCard, effect.target);
    effect.target.pokemonPlayedTurn = state.turn;

    emitAnimationEvent(store, 'playBasicAnimation', {
      playerId: effect.player.id,
      cardId: effect.characterCard.id,
      slot: String(SlotType.BENCH),
      index: effect.index,
    });

    return state;
  }

  return state;
}
