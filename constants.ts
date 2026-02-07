
import { PlayerName } from './types';

export const CLUB_NAME = "CLUB F4";
export const MEMBERS = [PlayerName.GREGORY, PlayerName.BIRCHAN, PlayerName.PETER, PlayerName.SEVEN];

export const MEMBER_CODES: Record<PlayerName, string> = {
  [PlayerName.GREGORY]: 'B59',
  [PlayerName.BIRCHAN]: 'K341',
  [PlayerName.PETER]: 'J71',
  [PlayerName.SEVEN]: 'K396'
};

export const INITIAL_GAMES = [
  {
    id: '1',
    date: '2024-05-15',
    course: 'Green Valley Country Club',
    scores: [
      { playerName: PlayerName.GREGORY, score: 82 },
      { playerName: PlayerName.BIRCHAN, score: 85 },
      { playerName: PlayerName.PETER, score: 79 },
      { playerName: PlayerName.SEVEN, score: 88 }
    ]
  },
  {
    id: '2',
    date: '2024-06-10',
    course: 'Sunset Ridge Golf Resort',
    scores: [
      { playerName: PlayerName.GREGORY, score: 80 },
      { playerName: PlayerName.BIRCHAN, score: 82 },
      { playerName: PlayerName.PETER, score: 81 },
      { playerName: PlayerName.SEVEN, score: 84 }
    ]
  }
];
