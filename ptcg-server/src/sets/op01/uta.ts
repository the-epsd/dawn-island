import { CharacterCard } from '../../game/store/card/character-card';
import { OpAttribute, OpColor } from '../../game/store/card/op-card-types';

export class Uta extends CharacterCard {

  public name = 'Uta';

  public fullName = 'Uta OP01';

  public set = 'OP01';

  public setNumber = '005';

  public cardImage = 'https://oppp.online/static/thumbs/OP01/OP01-005.png';

  public color = OpColor.RED;

  public cost = 4;

  public power = 4000;

  public attribute = OpAttribute.SPECIAL;

  public types = ['FILM'];

}
