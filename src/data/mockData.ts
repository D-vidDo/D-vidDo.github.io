export interface Player {
  id: string;
  name: string;
  position: string;
  kills: number;
  aces: number;
  blocks: number;
  isCaptain?: boolean;
}

export interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  playerCount: number;
  captain: string;
  color: string;
  pointsFor: number;
  pointsAgainst: number;
  players: Player[];
}

export const mockTeams: Team[] = [
  {
    id: "1",
    name: "Thunder Spikes",
    wins: 8,
    losses: 2,
    playerCount: 6,
    captain: "Sarah Johnson",
    color: "#FF6B35",
    pointsFor: 245,
    pointsAgainst: 178,
    players: [
      { id: "1", name: "Sarah Johnson", position: "Outside Hitter", kills: 85, aces: 23, blocks: 12, isCaptain: true },
      { id: "2", name: "Mike Chen", position: "Setter", kills: 12, aces: 45, blocks: 8 },
      { id: "3", name: "Emma Davis", position: "Middle Blocker", kills: 67, aces: 8, blocks: 34 },
      { id: "4", name: "Alex Rodriguez", position: "Libero", kills: 5, aces: 12, blocks: 2 },
      { id: "5", name: "Jordan Kim", position: "Outside Hitter", kills: 72, aces: 18, blocks: 15 },
      { id: "6", name: "Taylor Swift", position: "Opposite", kills: 58, aces: 15, blocks: 22 }
    ]
  },
  {
    id: "2",
    name: "Net Ninjas",
    wins: 7,
    losses: 3,
    playerCount: 6,
    captain: "David Lee",
    color: "#4ECDC4",
    pointsFor: 232,
    pointsAgainst: 195,
    players: [
      { id: "7", name: "David Lee", position: "Middle Blocker", kills: 63, aces: 11, blocks: 41, isCaptain: true },
      { id: "8", name: "Lisa Wang", position: "Setter", kills: 8, aces: 38, blocks: 5 },
      { id: "9", name: "Carlos Martinez", position: "Outside Hitter", kills: 78, aces: 22, blocks: 9 },
      { id: "10", name: "Jessica Brown", position: "Libero", kills: 3, aces: 15, blocks: 1 },
      { id: "11", name: "Ryan O'Connor", position: "Opposite", kills: 55, aces: 19, blocks: 28 },
      { id: "12", name: "Zoe Anderson", position: "Outside Hitter", kills: 69, aces: 14, blocks: 11 }
    ]
  },
  {
    id: "3",
    name: "Ace Avengers",
    wins: 6,
    losses: 4,
    playerCount: 6,
    captain: "Rachel Green",
    color: "#45B7D1",
    pointsFor: 218,
    pointsAgainst: 201,
    players: [
      { id: "13", name: "Rachel Green", position: "Setter", kills: 15, aces: 42, blocks: 7, isCaptain: true },
      { id: "14", name: "Kevin Zhang", position: "Middle Blocker", kills: 59, aces: 9, blocks: 38 },
      { id: "15", name: "Maya Patel", position: "Outside Hitter", kills: 74, aces: 20, blocks: 13 },
      { id: "16", name: "Chris Johnson", position: "Libero", kills: 2, aces: 18, blocks: 0 },
      { id: "17", name: "Samantha Wu", position: "Opposite", kills: 51, aces: 16, blocks: 25 },
      { id: "18", name: "Tom Wilson", position: "Outside Hitter", kills: 66, aces: 17, blocks: 8 }
    ]
  },
  {
    id: "4",
    name: "Block Party",
    wins: 5,
    losses: 5,
    playerCount: 6,
    captain: "Marcus Thompson",
    color: "#96CEB4",
    pointsFor: 203,
    pointsAgainst: 215,
    players: [
      { id: "19", name: "Marcus Thompson", position: "Middle Blocker", kills: 61, aces: 7, blocks: 45, isCaptain: true },
      { id: "20", name: "Nina Rodriguez", position: "Setter", kills: 11, aces: 35, blocks: 4 },
      { id: "21", name: "Jake Miller", position: "Outside Hitter", kills: 68, aces: 21, blocks: 10 },
      { id: "22", name: "Sophie Turner", position: "Libero", kills: 4, aces: 13, blocks: 1 },
      { id: "23", name: "Aaron Kim", position: "Opposite", kills: 49, aces: 12, blocks: 31 },
      { id: "24", name: "Olivia Jones", position: "Outside Hitter", kills: 59, aces: 16, blocks: 14 }
    ]
  },
  {
    id: "5",
    name: "Spike Squad",
    wins: 4,
    losses: 6,
    playerCount: 6,
    captain: "Isabella Garcia",
    color: "#FFEAA7",
    pointsFor: 189,
    pointsAgainst: 228,
    players: [
      { id: "25", name: "Isabella Garcia", position: "Outside Hitter", kills: 71, aces: 19, blocks: 7, isCaptain: true },
      { id: "26", name: "Noah Williams", position: "Setter", kills: 9, aces: 32, blocks: 6 },
      { id: "27", name: "Ava Johnson", position: "Middle Blocker", kills: 54, aces: 5, blocks: 29 },
      { id: "28", name: "Ethan Davis", position: "Libero", kills: 1, aces: 11, blocks: 0 },
      { id: "29", name: "Mia Chen", position: "Opposite", kills: 43, aces: 14, blocks: 19 },
      { id: "30", name: "Lucas Brown", position: "Outside Hitter", kills: 62, aces: 18, blocks: 12 }
    ]
  },
  {
    id: "6",
    name: "Dig Deep",
    wins: 2,
    losses: 8,
    playerCount: 6,
    captain: "Grace Kim",
    color: "#DDA0DD",
    pointsFor: 167,
    pointsAgainst: 254,
    players: [
      { id: "31", name: "Grace Kim", position: "Libero", kills: 3, aces: 16, blocks: 0, isCaptain: true },
      { id: "32", name: "Tyler Martinez", position: "Setter", kills: 7, aces: 28, blocks: 3 },
      { id: "33", name: "Chloe Wilson", position: "Outside Hitter", kills: 58, aces: 15, blocks: 9 },
      { id: "34", name: "Brandon Lee", position: "Middle Blocker", kills: 47, aces: 6, blocks: 26 },
      { id: "35", name: "Natalie Anderson", position: "Opposite", kills: 41, aces: 11, blocks: 17 },
      { id: "36", name: "Austin Taylor", position: "Outside Hitter", kills: 52, aces: 13, blocks: 6 }
    ]
  }
];

export const getAllPlayers = (): Player[] => {
  return mockTeams.flatMap(team => team.players);
};

export const getTopPerformers = () => {
  const allPlayers = getAllPlayers();
  
  return {
    topKillers: allPlayers.sort((a, b) => b.kills - a.kills).slice(0, 5),
    topAces: allPlayers.sort((a, b) => b.aces - a.aces).slice(0, 5),
    topBlockers: allPlayers.sort((a, b) => b.blocks - a.blocks).slice(0, 5)
  };
};