import { LeaderCard } from '../../game/store/card/leader-card';
import { OpAttribute, OpColor } from '../../game/store/card/op-card-types';

export class RoronoaZoro extends LeaderCard {
  public name = 'Roronoa Zoro';
  public fullName = 'Roronoa Zoro OP01';
  public set = 'OP01';
  public setNumber = '001';
  public cardImage = 'https://oppp.online/static/thumbs/OP01/OP01-001.png';
  public color = OpColor.RED;
  public life = 5;
  public power = 5000;
  public attribute = OpAttribute.SLASH;
  public types = ['Supernovas', 'Straw Hat Crew'];

  public leaderEffects = [{
    name: 'All Characters +1000 Power',
    text: '[DON!! x1] [Your Turn] All of your Characters gain +1000 power.',
    donCost: 1,
    yourTurnOnly: true,
  }];

}
