import { CharacterCard } from '../../game/store/card/character-card';
import { OpAttribute, OpColor } from '../../game/store/card/op-card-types';

export class Nami extends CharacterCard {

  public name = 'Nami';

  public fullName = 'Nami OP01';

  public set = 'OP01';

  public setNumber = '016';

  public cardImage = 'https://oppp.online/static/thumbs/OP01/OP01-016.png';

  public color = OpColor.RED;

  public cost = 1;

  public power = 2000;

  public attribute = OpAttribute.SPECIAL;

  public counter = 1000;

  public types = ['Straw Hat Crew'];

}
