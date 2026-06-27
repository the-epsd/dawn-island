import { CharacterCard } from '../../game/store/card/character-card';
import { OpAttribute, OpColor } from '../../game/store/card/op-card-types';

export class MonkeyDLuffy extends CharacterCard {

  public name = 'Monkey.D.Luffy';

  public fullName = 'Monkey.D.Luffy OP01';

  public set = 'OP01';

  public setNumber = '024';

  public cardImage = 'https://oppp.online/static/thumbs/OP01/OP01-024.png';

  public color = OpColor.RED;

  public cost = 2;

  public power = 3000;

  public attribute = OpAttribute.STRIKE;

  public counter = 1000;

  public types = ['Supernovas', 'Straw Hat Crew'];

}
