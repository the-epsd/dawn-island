import { CharacterCard } from '../../game/store/card/character-card';
import { OpAttribute, OpColor } from '../../game/store/card/op-card-types';

export class Shanks extends CharacterCard {

  public name = 'Shanks';

  public fullName = 'Shanks OP01';

  public set = 'OP01';

  public setNumber = '120';

  public cardImage = 'https://oppp.online/static/thumbs/OP01/OP01-120.png';

  public color = OpColor.RED;

  public cost = 9;

  public power = 10000;

  public attribute = OpAttribute.SLASH;

  public types = ['The Four Emperors', 'Red-Haired Pirates'];

}
