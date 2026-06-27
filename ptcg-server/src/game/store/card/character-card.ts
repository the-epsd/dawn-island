import { Card } from './card';
import { Format, SuperType } from './card-types';
import { OpAttribute, OpColor } from './op-card-types';
import { Effect } from '../effects/effect';
import { State } from '../state/state';
import { StoreLike } from '../store-like';

export abstract class CharacterCard extends Card {

  public superType: SuperType = SuperType.CHARACTER;

  public format: Format = Format.ONE_PIECE;

  public color: OpColor = OpColor.RED;

  public cost: number = 0;

  public power: number = 0;

  public attribute: OpAttribute = OpAttribute.SLASH;

  public counter: number = 0;

  public types: string[] = [];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    return state;
  }

}
