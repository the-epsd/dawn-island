import { CharacterCard } from '../../game/store/card/character-card';
import { OpAttribute, OpColor } from '../../game/store/card/op-card-types';

export class Sai extends CharacterCard {

  public name = 'Sai';

  public fullName = 'Sai OP01';

  public set = 'OP01';

  public setNumber = '012';

  public cardImage = 'https://oppp.online/static/thumbs/OP01/OP01-011.png';

  public color = OpColor.RED;

  public cost = 2;

  public power = 4000;

  public attribute = OpAttribute.SLASH;

  public counter = 1000;

  public types = ['Happosui Army'];

}
