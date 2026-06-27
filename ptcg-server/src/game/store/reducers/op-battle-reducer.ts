import { OpBattleAction } from '../actions/game-actions';
import { GameError } from '../../game-error';
import { GameLog, GameMessage } from '../../game-message';
import { Action } from '../actions/action';
import { State, GamePhase } from '../state/state';
import { StoreLike } from '../store-like';
import { checkWinner } from '../effect-reducers/check-effect';
import {
  canOpAttackerStrike,
  canOpDefenderBeTargeted,
  isOnePieceFormat,
  resolveOpCombatant,
  restOpAttacker,
  koOpCharacter,
  takeOpLifeToHand,
} from './op-battle-utils';

export function opBattleReducer(store: StoreLike, state: State, action: Action): State {
  if (!(action instanceof OpBattleAction) || state.phase !== GamePhase.PLAYER_TURN) {
    return state;
  }

  if (!isOnePieceFormat(state)) {
    throw new GameError(GameMessage.ILLEGAL_ACTION);
  }

  const player = state.players[state.activePlayer];
  if (player === undefined || player.id !== action.clientId) {
    throw new GameError(GameMessage.NOT_YOUR_TURN);
  }

  const attacker = resolveOpCombatant(state, player, action.attacker);
  const defender = resolveOpCombatant(state, player, action.defender);

  if (attacker === null || defender === null) {
    throw new GameError(GameMessage.INVALID_TARGET);
  }

  if (!canOpAttackerStrike(state, player, action.attacker)) {
    throw new GameError(GameMessage.CANNOT_USE_ATTACK);
  }

  if (!canOpDefenderBeTargeted(state, player, action.defender)) {
    throw new GameError(GameMessage.INVALID_TARGET);
  }

  restOpAttacker(attacker);

  store.log(state, GameLog.LOG_PLAYER_USES_ATTACK, {
    name: player.name,
    attack: `${attacker.card.name} (${attacker.power}) → ${defender.card.name} (${defender.power})`,
  });

  if (attacker.power >= defender.power) {
    if (defender.isLeader) {
      takeOpLifeToHand(defender.owner);
    } else if (defender.slot) {
      koOpCharacter(defender.slot, defender.owner.discard);
    }
  }

  return checkWinner(store, state);
}
