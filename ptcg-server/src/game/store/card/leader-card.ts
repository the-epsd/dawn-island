import { Card } from './card';
import { Format, SuperType } from './card-types';
import { OpAttribute, OpColor } from './op-card-types';
import { LeaderEffect } from './op-types';
import { Effect } from '../effects/effect';
import { State } from '../state/state';
import { StoreLike } from '../store-like';

export abstract class LeaderCard extends Card {

  public superType: SuperType = SuperType.LEADER;

  public format: Format = Format.ONE_PIECE;

  public color: OpColor = OpColor.RED;

  public life: number = 5;

  public power: number = 5000;

  public attribute: OpAttribute = OpAttribute.SLASH;

  public types: string[] = [];

  public leaderEffects: LeaderEffect[] = [];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    for (const leaderEffect of this.leaderEffects) {
      if (leaderEffect.effect !== undefined) {
        state = leaderEffect.effect(store, state, effect);
      }
    }
    return state;
  }

}
