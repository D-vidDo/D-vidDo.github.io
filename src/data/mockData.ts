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
  { id: "1", name: "Sarah Johnson", position: "Hitter", plusMinus: 24, gamesPlayed: 10 },
  { id: "2", name: "Mike Chen", position: "Setter", plusMinus: 18, gamesPlayed: 10 },
  { id: "3", name: "Emma Davis", position: "Blocker", plusMinus: 15, gamesPlayed: 9 },
  { id: "4", name: "Alex Rodriguez", position: "Defensive", plusMinus: 12, gamesPlayed: 10 },
  { id: "5", name: "Jordan Kim", position: "Hitter", plusMinus: 21, gamesPlayed: 10 },
  { id: "6", name: "Taylor Brown", position: "All-Around", plusMinus: 8, gamesPlayed: 8 },
  { id: "7", name: "David Lee", position: "Blocker", plusMinus: 19, gamesPlayed: 10 },
  { id: "8", name: "Lisa Wang", position: "Setter", plusMinus: 16, gamesPlayed: 9 },
  { id: "9", name: "Carlos Martinez", position: "Hitter", plusMinus: 22, gamesPlayed: 10 },
  { id: "10", name: "Jessica Brown", position: "Defensive", plusMinus: 9, gamesPlayed: 10 },
  { id: "11", name: "Ryan O'Connor", position: "All-Around", plusMinus: 14, gamesPlayed: 9 },
  { id: "12", name: "Zoe Anderson", position: "Hitter", plusMinus: 17, gamesPlayed: 10 },
  { id: "13", name: "Rachel Green", position: "Setter", plusMinus: 13, gamesPlayed: 8 },
  { id: "14", name: "Kevin Zhang", position: "Blocker", plusMinus: 11, gamesPlayed: 9 },
  { id: "15", name: "Maya Patel", position: "Hitter", plusMinus: 20, gamesPlayed: 10 },
  { id: "16", name: "Chris Johnson", position: "Defensive", plusMinus: 6, gamesPlayed: 7 },
  { id: "17", name: "Samantha Wu", position: "All-Around", plusMinus: 25, gamesPlayed: 10 },
  { id: "18", name: "Tom Wilson", position: "Hitter", plusMinus: 10, gamesPlayed: 8 }
];

// 3 teams with 6 players each
export const mockTeams: Team[] = [
  {
    id: "1",
    name: "Thunder Spikes",
    wins: 8,
    losses: 2,
    pointsFor: 245,
    pointsAgainst: 221,
    captain: "Sarah Johnson",
    color: "#FF6B35",
    playerIds: ["1", "2", "3", "4", "5", "6"] // Sarah, Mike, Emma, Alex, Jordan, Taylor
  },
  {
    id: "2", 
    name: "Net Ninjas",
    wins: 7,
    losses: 3,
    pointsFor: 238,
    pointsAgainst: 225,
    captain: "David Lee",
    color: "#4ECDC4",
    playerIds: ["7", "8", "9", "10", "11", "12"] // David, Lisa, Carlos, Jessica, Ryan, Zoe
  },
  {
    id: "3",
    name: "Ace Avengers", 
    wins: 5,
    losses: 5,
    pointsFor: 220,
    pointsAgainst: 232,
    captain: "Rachel Green",
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