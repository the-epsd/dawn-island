import { Vector3 } from 'three';
import { PlayerType } from 'ptcg-server';
import { BOARD3D_DROP_ZONE_SNAP_DISTANCE } from './board3d-constants';

// Zone positions in 3D world space
// One Piece layout: Active/Supporter on the back row (formerly Bench), Bench on the front row (formerly Active).
// DON!! deck is the leftmost slot on the cost row; active DON!! fill slots to its right.
export const OP_DON_AREA_MAX = 10;
/** Shared scale for leaders, characters, and DON!! cards on the OP board. */
export const OP_CHARACTER_SCALE = 0.88;

export const ZONE_POSITIONS = {
  stadium: new Vector3(-10, 0.1, 14),

  bottomPlayer: {
    active: new Vector3(0, 0.1, 21),
    supporter: new Vector3(6, 0.1, 21),
    bench: [
      new Vector3(-8, 0.1, 17),
      new Vector3(-4, 0.1, 17),
      new Vector3(0, 0.1, 17),
      new Vector3(4, 0.1, 17),
      new Vector3(8, 0.1, 17),
      new Vector3(12, 0.1, 17),
      new Vector3(16, 0.1, 17),
      new Vector3(20, 0.1, 17),
    ],
    board: new Vector3(0, 0.1, 16),
    prizes: new Vector3(-18, 0.1, 20),
    /** Beside supporter on the leader row (supporter x + 6). */
    deck: new Vector3(12, 0.1, 21),
    /** Beside DON!! deck on the cost row (bench slot 0 x − 3). */
    discard: new Vector3(-11, 0.1, 25),
    lostZone: new Vector3(-10, 0.1, 18),
    /** Z of the DON!! cost row (deck x aligns with bench slot 0). */
    donRowAnchor: new Vector3(0, 0.1, 25),
  },
  topPlayer: {
    active: new Vector3(0, 0.1, 7),
    supporter: new Vector3(-6, 0.1, 7),
    bench: [
      new Vector3(8, 0.1, 11),
      new Vector3(4, 0.1, 11),
      new Vector3(0, 0.1, 11),
      new Vector3(-4, 0.1, 11),
      new Vector3(-8, 0.1, 11),
      new Vector3(-12, 0.1, 11),
      new Vector3(-16, 0.1, 11),
      new Vector3(-20, 0.1, 11),
    ],
    board: new Vector3(0, 0.1, 3),
    prizes: new Vector3(20, 0.1, 8),
    /** Beside supporter on the leader row (supporter x − 6). */
    deck: new Vector3(-12, 0.1, 7),
    /** Beside DON!! deck on the cost row (bench slot 0 x + 3). */
    discard: new Vector3(11, 0.1, 3),
    lostZone: new Vector3(-10, 0.1, 10),
    /** DON!! cost row — below leader toward top edge (mirrors bottomPlayer leader 21 → DON 25). */
    donRowAnchor: new Vector3(0, 0.1, 3),
  }
};

export const ORIGINAL_BENCH_POSITIONS = {
  bottomPlayer: [
    new Vector3(-12, 0.1, 17),
    new Vector3(-8, 0.1, 17),
    new Vector3(-4, 0.1, 17),
    new Vector3(0, 0.1, 17),
    new Vector3(4, 0.1, 17),
    new Vector3(8, 0.1, 17),
    new Vector3(12, 0.1, 17),
    new Vector3(16, 0.1, 17),
  ],
  topPlayer: [
    new Vector3(14, 0.1, 11),
    new Vector3(10, 0.1, 11),
    new Vector3(6, 0.1, 11),
    new Vector3(2, 0.1, 11),
    new Vector3(-2, 0.1, 11),
    new Vector3(-6, 0.1, 11),
    new Vector3(-10, 0.1, 11),
    new Vector3(-14, 0.1, 11),
  ]
};

export const MOBILE_ZONE_POSITIONS = {
  stadium: new Vector3(-10, 0.1, 14),
  bottomPlayer: {
    active: new Vector3(0, 0.1, 21),
    supporter: new Vector3(6, 0.1, 21),
    bench: [
      new Vector3(-6, 0.1, 17),
      new Vector3(-3, 0.1, 17),
      new Vector3(0, 0.1, 17),
      new Vector3(3, 0.1, 17),
      new Vector3(6, 0.1, 17),
      new Vector3(9, 0.1, 17),
      new Vector3(12, 0.1, 17),
      new Vector3(15, 0.1, 17),
    ],
    board: new Vector3(0, 0.1, 16),
    prizes: new Vector3(-18, 0.1, 20),
    /** Beside supporter on the leader row (supporter x + 6). */
    deck: new Vector3(12, 0.1, 21),
    /** Beside DON!! deck on the cost row (bench slot 0 x − 3). */
    discard: new Vector3(-11, 0.1, 25),
    lostZone: new Vector3(-10, 0.1, 18),
    donRowAnchor: new Vector3(0, 0.1, 25),
  },
  topPlayer: {
    active: new Vector3(0, 0.1, 7),
    supporter: new Vector3(-6, 0.1, 7),
    bench: [
      new Vector3(6, 0.1, 11),
      new Vector3(3, 0.1, 11),
      new Vector3(0, 0.1, 11),
      new Vector3(-3, 0.1, 11),
      new Vector3(-6, 0.1, 11),
      new Vector3(-9, 0.1, 11),
      new Vector3(-12, 0.1, 11),
      new Vector3(-15, 0.1, 11),
    ],
    board: new Vector3(0, 0.1, 3),
    prizes: new Vector3(20, 0.1, 8),
    /** Beside supporter on the leader row (supporter x − 6). */
    deck: new Vector3(-12, 0.1, 7),
    /** Beside DON!! deck on the cost row (bench slot 0 x + 3). */
    discard: new Vector3(11, 0.1, 3),
    lostZone: new Vector3(-10, 0.1, 10),
    /** DON!! cost row — below leader toward top edge (mirrors bottomPlayer leader 21 → DON 25). */
    donRowAnchor: new Vector3(0, 0.1, 3),
  }
};

export const MOBILE_ORIGINAL_BENCH_POSITIONS = {
  bottomPlayer: [
    new Vector3(-9, 0.1, 17),
    new Vector3(-6, 0.1, 17),
    new Vector3(-3, 0.1, 17),
    new Vector3(0, 0.1, 17),
    new Vector3(3, 0.1, 17),
    new Vector3(6, 0.1, 17),
    new Vector3(9, 0.1, 17),
    new Vector3(12, 0.1, 17),
  ],
  topPlayer: [
    new Vector3(11, 0.1, 11),
    new Vector3(8, 0.1, 11),
    new Vector3(5, 0.1, 11),
    new Vector3(2, 0.1, 11),
    new Vector3(-1, 0.1, 11),
    new Vector3(-4, 0.1, 11),
    new Vector3(-7, 0.1, 11),
    new Vector3(-10, 0.1, 11),
  ]
};

export const SNAP_DISTANCE = BOARD3D_DROP_ZONE_SNAP_DISTANCE;

const MOBILE_ASPECT_THRESHOLD = 0.8;

export function getZonePositions(aspect?: number): typeof ZONE_POSITIONS {
  if (aspect === undefined || aspect >= MOBILE_ASPECT_THRESHOLD) {
    return ZONE_POSITIONS;
  }
  return MOBILE_ZONE_POSITIONS;
}

export function getOriginalBenchPositions(aspect?: number): typeof ORIGINAL_BENCH_POSITIONS {
  if (aspect === undefined || aspect >= MOBILE_ASPECT_THRESHOLD) {
    return ORIGINAL_BENCH_POSITIONS;
  }
  return MOBILE_ORIGINAL_BENCH_POSITIONS;
}

export function getSnapDistance(aspect?: number): number {
  return SNAP_DISTANCE;
}

export function getBenchPositions(benchSize: number, playerType: PlayerType, aspect?: number): Vector3[] {
  const zonePositions = getZonePositions(aspect);
  const originalBenchPositions = getOriginalBenchPositions(aspect);

  if (benchSize === 8) {
    return playerType === PlayerType.BOTTOM_PLAYER
      ? originalBenchPositions.bottomPlayer
      : originalBenchPositions.topPlayer;
  }

  const currentPositions = playerType === PlayerType.BOTTOM_PLAYER
    ? zonePositions.bottomPlayer.bench
    : zonePositions.topPlayer.bench;
  return currentPositions.slice(0, benchSize);
}

const DON_AREA_SPACING = 3.0;

function getDonRowZ(playerType: PlayerType, aspect?: number): number {
  const zones = getZonePositions(aspect);
  return playerType === PlayerType.BOTTOM_PLAYER
    ? zones.bottomPlayer.donRowAnchor.z
    : zones.topPlayer.donRowAnchor.z;
}

function getDonRowAnchor(playerType: PlayerType, aspect?: number, benchSize = 5): Vector3 {
  const bench0 = getBenchPositions(benchSize, playerType, aspect)[0];
  return new Vector3(bench0.x, bench0.y, getDonRowZ(playerType, aspect));
}

/** DON!! deck stack — same x as bench slot 0, on the cost row. */
export function getDonDeckPosition(
  playerType: PlayerType,
  aspect?: number,
  benchSize = 5
): Vector3 {
  return getDonRowAnchor(playerType, aspect, benchSize);
}

/** Fixed slot positions for up to {@link OP_DON_AREA_MAX} DON!! on the cost row (right of deck). */
export function getDonAreaSlotPositions(
  playerType: PlayerType,
  aspect?: number,
  benchSize = 5
): Vector3[] {
  const anchor = getDonRowAnchor(playerType, aspect, benchSize);
  if (playerType === PlayerType.BOTTOM_PLAYER) {
    return Array.from({ length: OP_DON_AREA_MAX }, (_, i) =>
      new Vector3(anchor.x + (i + 1) * DON_AREA_SPACING, anchor.y, anchor.z)
    );
  }
  return Array.from({ length: OP_DON_AREA_MAX }, (_, i) =>
    new Vector3(anchor.x - (i + 1) * DON_AREA_SPACING, anchor.y, anchor.z)
  );
}

/** World positions for active DON!! cost-area cards. */
export function getDonAreaPositions(
  count: number,
  playerType: PlayerType,
  aspect?: number,
  benchSize = 5
): Vector3[] {
  const n = Math.min(Math.max(count, 0), OP_DON_AREA_MAX);
  if (n === 0) {
    return [];
  }
  return getDonAreaSlotPositions(playerType, aspect, benchSize).slice(0, n);
}
