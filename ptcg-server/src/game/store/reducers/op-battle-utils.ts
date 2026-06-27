import { CardTarget, PlayerType, SlotType } from '../actions/play-card-action';
import { Format, SuperType } from '../card/card-types';
import { CharacterCard } from '../card/character-card';
import { LeaderCard } from '../card/leader-card';
import { Card } from '../card/card';
import { CardList } from '../state/card-list';
import { Player } from '../state/player';
import { PokemonCardList } from '../state/pokemon-card-list';
import { GamePhase, State } from '../state/state';
import { StateUtils } from '../state-utils';

export interface OpCombatant {
  owner: Player;
  target: CardTarget;
  isLeader: boolean;
  slot?: PokemonCardList;
  card: Card;
  power: number;
  rested: boolean;
  pokemonPlayedTurn?: number;
}

export function isOnePieceFormat(state: State): boolean {
  return state.gameSettings?.format === Format.ONE_PIECE;
}

export function getOpCardPower(card: Card): number {
  if (card instanceof CharacterCard || card instanceof LeaderCard) {
    return card.power;
  }
  if (card.superType === SuperType.CHARACTER) {
    return (card as CharacterCard).power;
  }
  if (card.superType === SuperType.LEADER) {
    return (card as LeaderCard).power;
  }
  return 0;
}

function resolveOpTargetOwner(state: State, actingPlayer: Player, target: CardTarget): Player {
  if (target.player === PlayerType.TOP_PLAYER) {
    return StateUtils.getOpponent(state, actingPlayer);
  }
  return actingPlayer;
}

export function resolveOpCombatant(
  state: State,
  actingPlayer: Player,
  target: CardTarget,
): OpCombatant | null {
  const owner = resolveOpTargetOwner(state, actingPlayer, target);

  if (target.slot === SlotType.ACTIVE) {
    if (owner.leader.cards.length === 0) {
      return null;
    }
    const card = owner.leader.cards[0];
    return {
      owner,
      target,
      isLeader: true,
      card,
      power: getOpCardPower(card),
      rested: owner.leaderRested,
    };
  }

  if (target.slot !== SlotType.BENCH) {
    return null;
  }

  const slot = owner.bench[target.index];
  if (slot === undefined || slot.cards.length === 0) {
    return null;
  }

  const card = slot.cards[0];
  if (card.superType !== SuperType.CHARACTER && !(card instanceof CharacterCard)) {
    return null;
  }

  return {
    owner,
    target,
    isLeader: false,
    slot,
    card,
    power: getOpCardPower(card),
    rested: slot.opRested,
    pokemonPlayedTurn: slot.pokemonPlayedTurn,
  };
}

export function canOpAttackerStrike(state: State, actingPlayer: Player, attackerTarget: CardTarget): boolean {
  if (!isOnePieceFormat(state) || state.phase !== GamePhase.PLAYER_TURN) {
    return false;
  }
  if (state.players[state.activePlayer]?.id !== actingPlayer.id) {
    return false;
  }
  if (attackerTarget.player !== PlayerType.BOTTOM_PLAYER) {
    return false;
  }

  const attacker = resolveOpCombatant(state, actingPlayer, attackerTarget);
  if (attacker === null) {
    return false;
  }
  if (attacker.rested) {
    return false;
  }
  if (!attacker.isLeader && (attacker.pokemonPlayedTurn ?? 0) >= state.turn) {
    return false;
  }
  return true;
}

export function canOpDefenderBeTargeted(state: State, actingPlayer: Player, defenderTarget: CardTarget): boolean {
  if (!isOnePieceFormat(state) || state.phase !== GamePhase.PLAYER_TURN) {
    return false;
  }
  if (defenderTarget.player !== PlayerType.TOP_PLAYER) {
    return false;
  }

  const defender = resolveOpCombatant(state, actingPlayer, defenderTarget);
  if (defender === null) {
    return false;
  }
  // Leaders can be attacked anytime; bench characters must be rested.
  if (defender.isLeader) {
    return true;
  }
  return defender.rested;
}

export function listOpBattleDefenderTargets(state: State, actingPlayer: Player): CardTarget[] {
  const targets: CardTarget[] = [];
  const opponent = StateUtils.getOpponent(state, actingPlayer);

  if (opponent.leader.cards.length > 0) {
    targets.push({ player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 });
  }

  opponent.bench.forEach((slot, index) => {
    if (slot.cards.length > 0 && slot.opRested) {
      targets.push({ player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index });
    }
  });

  return targets;
}

export function standUpOpPlayer(player: Player): void {
  player.leaderRested = false;
  player.bench.forEach(slot => {
    slot.opRested = false;
  });
}

/** Convert a board-view CardTarget to acting-player-relative targets (BOTTOM = self). */
export function boardTargetToActingPlayerTarget(
  target: CardTarget,
  actingPlayerBoardType: PlayerType,
): CardTarget {
  return {
    ...target,
    player: target.player === actingPlayerBoardType
      ? PlayerType.BOTTOM_PLAYER
      : PlayerType.TOP_PLAYER,
  };
}

/** Convert acting-player-relative targets (BOTTOM = self) to on-screen board slots. */
export function serverTargetToBoardTarget(
  serverTarget: CardTarget,
  clientBoardPlayerType: PlayerType,
): CardTarget {
  const opponentBoard =
    clientBoardPlayerType === PlayerType.BOTTOM_PLAYER
      ? PlayerType.TOP_PLAYER
      : PlayerType.BOTTOM_PLAYER;
  return {
    ...serverTarget,
    player:
      serverTarget.player === PlayerType.BOTTOM_PLAYER
        ? clientBoardPlayerType
        : opponentBoard,
  };
}

export function restOpAttacker(attacker: OpCombatant): void {
  if (attacker.isLeader) {
    attacker.owner.leaderRested = true;
    return;
  }
  if (attacker.slot) {
    attacker.slot.opRested = true;
  }
}

export function takeOpLifeToHand(player: Player): boolean {
  const lifePile = player.prizes.find(p => p.cards.length > 0);
  if (lifePile === undefined) {
    return false;
  }
  lifePile.isSecret = false;
  lifePile.moveTo(player.hand, 1);
  return true;
}

export function koOpCharacter(slot: PokemonCardList, discard: CardList): void {
  slot.moveTo(discard);
  slot.opRested = false;
}
