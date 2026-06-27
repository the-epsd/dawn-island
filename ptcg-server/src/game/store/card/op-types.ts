import { Effect } from '../effects/effect';
import { State } from '../state/state';
import { StoreLike } from '../store-like';

export interface LeaderEffect {
  name: string;
  text: string;
  donCost: number;
  yourTurnOnly: boolean;
  effect?: (store: StoreLike, state: State, effect: Effect) => State;
}
