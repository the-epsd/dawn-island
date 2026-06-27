import { Card } from './card';
import { Format, SuperType } from './card-types';

export abstract class DonCard extends Card {

  public superType: SuperType = SuperType.DON;

  public format: Format = Format.ONE_PIECE;

}
