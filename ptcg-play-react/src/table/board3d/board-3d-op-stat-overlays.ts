import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three';
import {
  Card,
  CharacterCard,
  LeaderCard,
  OpColor,
  SuperType,
} from 'ptcg-server';
import {
  BOARD_OP_ATTACK_CANVAS_HEIGHT,
  BOARD_OP_ATTACK_CANVAS_WIDTH,
  BOARD_OP_COST_CANVAS_SIZE,
  paintBoardOpAttackBadge,
  paintBoardOpCostBadge,
} from './board-op-stat-paint';
import {
  OP_ATTACK_BADGE_HEIGHT,
  OP_ATTACK_BADGE_WIDTH,
  OP_ATTACK_BADGE_X,
  OP_ATTACK_BADGE_Y,
  OP_COST_BADGE_SIZE,
  OP_COST_BADGE_X,
  OP_COST_BADGE_Y,
  OP_STAT_OVERLAY_FACE_Z,
} from './board-3d-overlay-layout';

export interface OpBoardCardStats {
  cost: number | null;
  power: number;
  color: OpColor;
}

export function getOpBoardCardStats(card: Card): OpBoardCardStats | null {
  if (card.superType === SuperType.CHARACTER) {
    const character = card as CharacterCard;
    return { cost: character.cost, power: character.power, color: character.color };
  }
  if (card.superType === SuperType.LEADER) {
    const leader = card as LeaderCard;
    return { cost: null, power: leader.power, color: leader.color };
  }
  return null;
}

/**
 * One Piece cost (top-left disc) and attack (top-right pill) overlays on board fighters.
 */
export class Board3dOpStatOverlays {
  private group = new Group();
  private costMesh: Mesh | null = null;
  private attackMesh: Mesh | null = null;
  private attachedParent: Object3D | null = null;
  private currentCost: number | null = null;
  private currentPower: number | null = null;
  private currentColor: OpColor | null = null;

  private static readonly _qParent = new Quaternion();
  private static readonly _qCam = new Quaternion();
  private static readonly _qFlip = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);

  attachTo(parent: Object3D): void {
    if (this.attachedParent === parent) {
      return;
    }
    this.attachedParent?.remove(this.group);
    this.attachedParent = parent;
    parent.add(this.group);
  }

  update(card: Card | undefined, visible: boolean): void {
    if (!visible || !card) {
      this.clear();
      return;
    }

    const stats = getOpBoardCardStats(card);
    if (!stats || stats.power <= 0) {
      this.clear();
      return;
    }

    const costChanged = stats.cost !== this.currentCost || stats.color !== this.currentColor;
    const powerChanged = stats.power !== this.currentPower;

    if (stats.cost != null) {
      if (costChanged || !this.costMesh) {
        this.replaceCostMesh(stats.cost, stats.color);
        this.currentCost = stats.cost;
        this.currentColor = stats.color;
      }
    } else {
      this.disposeCostMesh();
      this.currentCost = null;
      this.currentColor = null;
    }

    if (powerChanged || !this.attackMesh) {
      this.replaceAttackMesh(stats.power);
      this.currentPower = stats.power;
    }
  }

  updateBillboards(camera: PerspectiveCamera): void {
    for (const mesh of [this.costMesh, this.attackMesh]) {
      if (!mesh) {
        continue;
      }
      camera.getWorldQuaternion(Board3dOpStatOverlays._qCam);
      const parent = mesh.parent;
      if (!parent) {
        mesh.quaternion
          .copy(Board3dOpStatOverlays._qCam)
          .multiply(Board3dOpStatOverlays._qFlip);
        continue;
      }
      parent.getWorldQuaternion(Board3dOpStatOverlays._qParent);
      mesh.quaternion
        .copy(Board3dOpStatOverlays._qParent)
        .invert()
        .multiply(Board3dOpStatOverlays._qCam)
        .multiply(Board3dOpStatOverlays._qFlip);
    }
  }

  clear(): void {
    this.disposeCostMesh();
    this.disposeAttackMesh();
    this.currentCost = null;
    this.currentPower = null;
    this.currentColor = null;
  }

  dispose(): void {
    this.clear();
    this.attachedParent?.remove(this.group);
    this.attachedParent = null;
  }

  private replaceCostMesh(cost: number, color: OpColor): void {
    this.disposeCostMesh();

    const canvas = document.createElement('canvas');
    canvas.width = BOARD_OP_COST_CANVAS_SIZE;
    canvas.height = BOARD_OP_COST_CANVAS_SIZE;
    const ctx = canvas.getContext('2d')!;
    paintBoardOpCostBadge(ctx, cost, color);

    const texture = new CanvasTexture(canvas);
    texture.repeat.x = -1;
    texture.offset.x = 1;
    texture.needsUpdate = true;

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
      alphaTest: 0.1,
      depthWrite: false,
      color: 0xd0d0d0,
    });

    this.costMesh = new Mesh(new PlaneGeometry(OP_COST_BADGE_SIZE, OP_COST_BADGE_SIZE), material);
    this.costMesh.renderOrder = 13;
    this.costMesh.position.set(OP_COST_BADGE_X, OP_COST_BADGE_Y, OP_STAT_OVERLAY_FACE_Z);
    this.group.add(this.costMesh);
  }

  private replaceAttackMesh(power: number): void {
    this.disposeAttackMesh();

    const canvas = document.createElement('canvas');
    canvas.width = BOARD_OP_ATTACK_CANVAS_WIDTH;
    canvas.height = BOARD_OP_ATTACK_CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    paintBoardOpAttackBadge(ctx, power);

    const texture = new CanvasTexture(canvas);
    texture.repeat.x = -1;
    texture.offset.x = 1;
    texture.needsUpdate = true;

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
      alphaTest: 0.1,
      depthWrite: false,
      color: 0xd0d0d0,
    });

    this.attackMesh = new Mesh(new PlaneGeometry(OP_ATTACK_BADGE_WIDTH, OP_ATTACK_BADGE_HEIGHT), material);
    this.attackMesh.renderOrder = 13;
    this.attackMesh.position.set(OP_ATTACK_BADGE_X, OP_ATTACK_BADGE_Y, OP_STAT_OVERLAY_FACE_Z);
    this.group.add(this.attackMesh);
  }

  private disposeCostMesh(): void {
    if (!this.costMesh) {
      return;
    }
    this.group.remove(this.costMesh);
    (this.costMesh.material as MeshBasicMaterial).map?.dispose();
    (this.costMesh.material as MeshBasicMaterial).dispose();
    this.costMesh.geometry.dispose();
    this.costMesh = null;
  }

  private disposeAttackMesh(): void {
    if (!this.attackMesh) {
      return;
    }
    this.group.remove(this.attackMesh);
    (this.attackMesh.material as MeshBasicMaterial).map?.dispose();
    (this.attackMesh.material as MeshBasicMaterial).dispose();
    this.attackMesh.geometry.dispose();
    this.attackMesh = null;
  }
}
