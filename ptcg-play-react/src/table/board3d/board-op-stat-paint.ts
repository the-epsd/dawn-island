import { OpColor } from 'ptcg-server';

/** Canvas size for OP cost disc (matches damage counter art). */
export const BOARD_OP_COST_CANVAS_SIZE = 128;

/** Canvas size for OP attack badge (wide rounded rect). */
export const BOARD_OP_ATTACK_CANVAS_WIDTH = 192;
export const BOARD_OP_ATTACK_CANVAS_HEIGHT = 96;

const OP_COLOR_GRADIENTS: Record<
  OpColor,
  { inner: string; mid: string; outer: string }
> = {
  [OpColor.RED]: { inner: '#b71c1c', mid: '#7f0000', outer: '#2d0000' },
  [OpColor.GREEN]: { inner: '#81c784', mid: '#2e7d32', outer: '#1b5e20' },
  [OpColor.BLUE]: { inner: '#64b5f6', mid: '#1565c0', outer: '#0d47a1' },
  [OpColor.PURPLE]: { inner: '#ce93d8', mid: '#7b1fa2', outer: '#4a148c' },
  [OpColor.BLACK]: { inner: '#9e9e9e', mid: '#424242', outer: '#000000' },
  [OpColor.YELLOW]: { inner: '#fff176', mid: '#f9a825', outer: '#e65100' },
};

function paintOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  fontSize: number,
): void {
  ctx.font = `bold ${fontSize}px Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#000000';
  ctx.fillText(text, centerX - 0.5, centerY - 0.5);
  ctx.fillText(text, centerX + 0.5, centerY - 0.5);
  ctx.fillText(text, centerX - 0.5, centerY + 0.5);
  ctx.fillText(text, centerX + 0.5, centerY + 0.5);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, centerX, centerY);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * One Piece play cost — disc styled like the damage counter, tinted to the card color.
 */
export function paintBoardOpCostBadge(
  ctx: CanvasRenderingContext2D,
  cost: number,
  color: OpColor,
): void {
  const centerX = BOARD_OP_COST_CANVAS_SIZE / 2;
  const centerY = BOARD_OP_COST_CANVAS_SIZE / 2;
  const radius = 58;
  const stops = OP_COLOR_GRADIENTS[color] ?? OP_COLOR_GRADIENTS[OpColor.RED];

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, stops.inner);
  gradient.addColorStop(0.38, stops.mid);
  gradient.addColorStop(1, stops.outer);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  paintOutlinedText(ctx, cost.toString(), centerX, centerY + 2, 52);
}

/**
 * One Piece attack power — rounded rectangle badge for the top-right corner.
 */
export function paintBoardOpAttackBadge(
  ctx: CanvasRenderingContext2D,
  power: number,
): void {
  const width = BOARD_OP_ATTACK_CANVAS_WIDTH;
  const height = BOARD_OP_ATTACK_CANVAS_HEIGHT;
  const padding = 6;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  /** Fully rounded ends (capsule / stadium pill). */
  const radius = innerHeight / 2;

  roundRectPath(ctx, padding, padding, innerWidth, innerHeight, radius);
  ctx.fillStyle = 'rgba(18, 18, 18, 0.92)';
  ctx.fill();

  roundRectPath(ctx, padding, padding, innerWidth, innerHeight, radius);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  const text = power.toString();
  const fontSize = text.length >= 5 ? 36 : text.length >= 4 ? 40 : 46;
  paintOutlinedText(ctx, text, width / 2, height / 2 + 1, fontSize);
}
