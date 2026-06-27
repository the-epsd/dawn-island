import { CharacterCard } from '../../game/store/card/character-card';
import { OpAttribute, OpColor } from '../../game/store/card/op-card-types';

export class Sanji extends CharacterCard {

  public name = 'Sanji';

  public fullName = 'Sanji OP01';

  public set = 'OP01';

  public setNumber = '013';

  public cardImage = 'https://oppp.online/static/thumbs/OP01/OP01-013.png';

  public color = OpColor.RED;

  public cost = 2;

  public power = 3000;

  public attribute = OpAttribute.STRIKE;

  public counter = 2000;

  public types = ['Straw Hat Crew'];

}
