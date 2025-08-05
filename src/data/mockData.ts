export interface Player {
  id: string;
  name: string;
  position: string;
  plusMinus: number; // Match +/- from final scores
  gamesPlayed: number;
  teamId?: string; // For tracking which team they're currently on
}

export interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  captain: string;
  color: string;
  playerIds: string[]; // References to player IDs
}

export interface Trade {
  id: string;
  date: string;
  description: string;
  playersTraded: {
    player: Player;
    fromTeam: string;
    toTeam: string;
  }[];
}

// 18 players total for the league
export const allPlayers: Player[] = [
  // Free agents initially, will be assigned to teams
  { id: "1", name: "David Do", position: "Opposite", plusMinus: 0, gamesPlayed: 0 },
  { id: "2", name: "Brian Nguyen", position: "Setter", plusMinus: 0, gamesPlayed: 0 },
  { id: "3", name: "Vivian Tran", position: "Middle", plusMinus: 0, gamesPlayed: 0 },
  { id: "4", name: "Justin Huynh", position: "Power", plusMinus: 0, gamesPlayed: 0 },
  { id: "5", name: "Nikka Stephens", position: "Setter", plusMinus: 0, gamesPlayed: 0 },
  { id: "6", name: "Vince Echano ", position: "Power", plusMinus: 0, gamesPlayed: 0 },
  { id: "7", name: "Tim Anderson", position: "Middle", plusMinus: 0, gamesPlayed: 0 },
  { id: "8", name: "Jaydon Fernandes", position: "Middle", plusMinus: 0, gamesPlayed: 0 },
  { id: "9", name: "Kevin Nguyen", position: "Power", plusMinus: 0, gamesPlayed: 0 },
  { id: "10", name: "Jeosh Domingo", position: "Middle", plusMinus: 0, gamesPlayed: 0 },
  { id: "11", name: "Justine Telan", position: "Opposite", plusMinus: 0, gamesPlayed: 0 },
  { id: "12", name: "Bill Luu", position: "Power", plusMinus: 0, gamesPlayed: 0 },
  { id: "13", name: "Pauline ", position: "Power", plusMinus: 0, gamesPlayed: 0 },
  { id: "14", name: "Lucy Huang", position: "Middle", plusMinus: 0, gamesPlayed: 0 },
  { id: "15", name: "Brandon Sangalang", position: "Opposite", plusMinus: 0, gamesPlayed: 0 },
  { id: "16", name: "Duy Huynh", position: "Setter", plusMinus: 0, gamesPlayed: 0 },
  { id: "17", name: "Tristan Idolor", position: "Middle", plusMinus: 0, gamesPlayed: 0 },
  { id: "18", name: "Alyssa Echano", position: "Opposite", plusMinus: 0, gamesPlayed: 0 }
];

// 3 teams with 6 players each
export const mockTeams: Team[] = [
  {
    id: "1",
    name: "Brawl Luu",
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    captain: "Justin Huynh",
    color: "#FF6B35",
    playerIds: ["1", "2", "3", "4", "5", "6"] // Sarah, Mike, Emma, Alex, Jordan, Taylor
  },
  {
    id: "2", 
    name: "Bull Luu",
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    captain: "Jaydon Fernandes",
    color: "#4ECDC4",
    playerIds: ["7", "8", "9", "10", "11", "12"] // David, Lisa, Carlos, Jessica, Ryan, Zoe
  },
  {
    id: "3",
    name: "Cuck Luu", 
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    captain: "Vince Echano",
    color: "#45B7D1",
    playerIds: ["13", "14", "15", "16", "17", "18"] // Rachel, Kevin, Maya, Chris, Samantha, Tom
  }
];

// Assign team IDs to players
allPlayers.forEach(player => {
  const team = mockTeams.find(t => t.playerIds.includes(player.id));
  if (team) {
    player.teamId = team.id;
  }
});

export const mockTrades: Trade[] = [
  {
    id: "1",
    date: "2024-08-01",
    description: "Pre-season roster adjustment",
    playersTraded: [
      {
        player: allPlayers.find(p => p.id === "6")!,
        fromTeam: "Free Agency",
        toTeam: "Thunder Spikes"
      },
      {
        player: allPlayers.find(p => p.id === "1")!,
        fromTeam: "Free Agency",
        toTeam: "Bull Luu"
      }
    ]
  },
  {
    id: "2",
    date: "2025-08-01",
    description: "Week 1 Trades",
    playersTraded: [
      {
        player: allPlayers.find(p => p.id === "6")!,
        fromTeam: "Free Agency",
        toTeam: "Thunder Spikes"
      },
      {
        player: allPlayers.find(p => p.id === "1")!,
        fromTeam: "Bull Luu",
        toTeam: "Cuck Luu"
      }
    ]
  }
];

// Helper functions
export const getPlayersByTeam = (teamId: string): Player[] => {
  const team = mockTeams.find(t => t.id === teamId);
  if (!team) return [];
  return team.playerIds.map(id => allPlayers.find(p => p.id === id)!).filter(Boolean);
};

export const getPlayerById = (playerId: string): Player | undefined => {
  return allPlayers.find(p => p.id === playerId);
};

export const getTeamById = (teamId: string): Team | undefined => {
  return mockTeams.find(t => t.id === teamId);
};

export const getFreeAgents = (): Player[] => {
  return allPlayers.filter(p => !p.teamId);
};

export const getTopPerformers = () => {
  const sortedByPlusMinus = [...allPlayers].sort((a, b) => b.plusMinus - a.plusMinus);
  const sortedByAverage = [...allPlayers]
    .filter(p => p.gamesPlayed > 0)
    .sort((a, b) => (b.plusMinus / b.gamesPlayed) - (a.plusMinus / a.gamesPlayed));
    
  return {
    topPlusMinus: sortedByPlusMinus.slice(0, 10),
    topAverage: sortedByAverage.slice(0, 10)
  };
};