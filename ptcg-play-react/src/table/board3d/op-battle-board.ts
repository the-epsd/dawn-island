import { Player, PlayerType, type CardTarget } from 'ptcg-server';

/** Which screen row (TOP/BOTTOM) shows the local player's fighters. */
export function getClientBoardPlayerType(
  clientId: number,
  bottomPlayer: Player | undefined,
  topPlayer: Player | undefined,
): PlayerType {
  if (bottomPlayer?.id === clientId) {
    return PlayerType.BOTTOM_PLAYER;
  }
  if (topPlayer?.id === clientId) {
    return PlayerType.TOP_PLAYER;
  }
  return PlayerType.BOTTOM_PLAYER;
}

export function getOpponentBoardPlayerType(clientBoard: PlayerType): PlayerType {
  return clientBoard === PlayerType.BOTTOM_PLAYER
    ? PlayerType.TOP_PLAYER
    : PlayerType.BOTTOM_PLAYER;
}

export function cardTargetsEqual(a: CardTarget, b: CardTarget): boolean {
  return a.player === b.player && a.slot === b.slot && a.index === b.index;
}
