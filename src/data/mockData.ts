export interface Player {
  id: string;
  name: string;
  primaryPosition: string;
  secondaryPosition: string;
  plusMinus: number;
  gamesPlayed: number;
  teamId?: string;
  isCaptain?: boolean; // Add isCaptain property
  // Add 10 stat attributes
  stats: {
    Serving: number;
    Receiving: number;
    "Defensive Positioning": number;
    Setting: number;
    Blocking: number;
    Hitting: number;
    Hustle: number;
    Stamina: number;
    "Vertical Jump": number;
    Communication: number;
  };
}

export interface GameStats {
  id: string;
  date: string;
  opponent: string; // team name or id
  pointsFor: number;
  pointsAgainst: number;
  result: "W" | "L";
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
  playerIds: string[];
  games?: GameStats[]; // Add this line
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
  { id: "1", name: "David Do", primaryPosition: "Opposite", secondaryPosition: "Middle", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "2", name: "Brian Nguyen", primaryPosition: "Setter", secondaryPosition: "Power", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "3", name: "Vivian Tran", primaryPosition: "Middle", secondaryPosition: "Power", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "4", name: "Justin Huynh", primaryPosition: "Power", secondaryPosition: "Middle", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "5", name: "Nikka Stephens", primaryPosition: "Setter", secondaryPosition: "Opposite", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "6", name: "Vince Echano ", primaryPosition: "Power", secondaryPosition: "Middle", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "7", name: "Tim Anderson", primaryPosition: "Setter", secondaryPosition: "Middle", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "8", name: "Jaydon Fernandes", primaryPosition: "Middle", secondaryPosition: "Opposite", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "9", name: "Kevin Nguyen", primaryPosition: "Power", secondaryPosition: "Middle", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "10", name: "Jeosh Domingo", primaryPosition: "Middle", secondaryPosition: "Opposite", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "11", name: "Justine Telan", primaryPosition: "Opposite", secondaryPosition: "Power", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "12", name: "Bill Luu", primaryPosition: "Power", secondaryPosition: "Middle", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "13", name: "Pauline ", primaryPosition: "Power", secondaryPosition: "Middle", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "14", name: "Lucy Huang", primaryPosition: "Middle", secondaryPosition: "Power", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "15", name: "Brandon Sangalang", primaryPosition: "Opposite", secondaryPosition: "Setter", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "16", name: "Duy Huynh", primaryPosition: "Setter", secondaryPosition: "Power", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "17", name: "Tristan Idolor", primaryPosition: "Middle", secondaryPosition: "Opposite", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } },
  { id: "18", name: "Alyssa Echano", primaryPosition: "Opposite", secondaryPosition: "Setter", plusMinus: 0, gamesPlayed: 0, stats: { Serving: 4, Receiving: 3, "Defensive Positioning": 5, Setting: 2, Blocking: 3, Hitting: 4, Hustle: 5, Stamina: 4, "Vertical Jump": 3, Communication: 5 } }
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
    playerIds: [],
    games: [
      { id: "g1", date: "2025-08-01", opponent: "Bull Luu", pointsFor: 25, pointsAgainst: 20, result: "W" },
      { id: "g2", date: "2025-08-03", opponent: "Cuck Luu", pointsFor: 18, pointsAgainst: 25, result: "L" }
    ]
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
    playerIds: [] // <-- leave empty!
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
    playerIds: [] // <-- leave empty!
  }
];

// Assign team IDs to players
// allPlayers.forEach(player => {
//   const team = mockTeams.find(t => t.playerIds.includes(player.id));
//   if (team) {
//     player.teamId = team.id;
//   }
// });

export const mockTrades: Trade[] = [
  {
    id: "1",
    date: "2025-09-01",
    description: "NCL Draft Fall 2025",
    playersTraded: [
      {
        player: allPlayers.find(p => p.id === "4")!,
        fromTeam: "Drafted",
        toTeam: "Cuck Luu"
      },
      {
        player: allPlayers.find(p => p.id === "6")!,
        fromTeam: "Drafted",
        toTeam: "Bull Luu"
      },
      {
        player: allPlayers.find(p => p.id === "8")!,
        fromTeam: "Drafted",
        toTeam: "Brawl Luu"
      },
      {
        player: allPlayers.find(p => p.id === "1")!,
        fromTeam: "Drafted",
        toTeam: "Brawl Luu"
      },
      {
        player: allPlayers.find(p => p.id === "5")!,
        fromTeam: "Drafted",
        toTeam: "Bull Luu"
      },
      {
        player: allPlayers.find(p => p.id === "2")!,
        fromTeam: "Drafted",
        toTeam: "Cuck Luu"
      },
      {
        player: allPlayers.find(p => p.id === "7")!,
        fromTeam: "Drafted",
        toTeam: "Cuck Luu"
      },
      {
        player: allPlayers.find(p => p.id === "3")!,
        fromTeam: "Drafted",
        toTeam: "Bull Luu"
      },
      {
        player: allPlayers.find(p => p.id === "9")!,
        fromTeam: "Drafted",
        toTeam: "Brawl Luu"
      },
      {
        player: allPlayers.find(p => p.id === "10")!,
        fromTeam: "Drafted",
        toTeam: "Brawl Luu"
      },
      {
        player: allPlayers.find(p => p.id === "11")!,
        fromTeam: "Drafted",
        toTeam: "Bull Luu"
      },
      {
        player: allPlayers.find(p => p.id === "12")!,
        fromTeam: "Drafted",
        toTeam: "Brawl Luu"
      },
      {
        player: allPlayers.find(p => p.id === "13")!,
        fromTeam: "Drafted",
        toTeam: "Cuck Luu"
      },
      {
        player: allPlayers.find(p => p.id === "14")!,
        fromTeam: "Drafted",
        toTeam: "Bull Luu"
      },
      {
        player: allPlayers.find(p => p.id === "15")!,
        fromTeam: "Drafted",
        toTeam: "Cuck Luu"
      },
      {
        player: allPlayers.find(p => p.id === "16")!,
        fromTeam: "Drafted",
        toTeam: "Bull Luu"
      },
      {
        player: allPlayers.find(p => p.id === "17")!,
        fromTeam: "Drafted",
        toTeam: "Brawl Luu"
      },
      {
        player: allPlayers.find(p => p.id === "18")!,
        fromTeam: "Drafted",
        toTeam: "Cuck Luu"
      }
    ]
  },
  {
    id: "2",
    date: "2025-08-05",
    description: "David Do and Pauline swapped teams",
    playersTraded: [
      {
        player: allPlayers.find(p => p.id === "1")!, // David Do
        fromTeam: "Brawl Luu",
        toTeam: "Cuck Luu"
      },
      {
        player: allPlayers.find(p => p.id === "13")!, // Pauline
        fromTeam: "Cuck Luu",
        toTeam: "Brawl Luu"
      }
    ]
  }
];

// Scramble stats for all players (for testing)
// const statKeys = [
//   "Serving",
//   "Receiving",
//   "Defensive Positioning",
//   "Setting",
//   "Blocking",
//   "Hitting",
//   "Hustle",
//   "Stamina",
//   "Vertical Jump",
//   "Communication"
// ];

// allPlayers.forEach(player => {
//   statKeys.forEach(key => {
//     player.stats[key] = Math.floor(Math.random() * 5) + 1;
//   });
// });

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
    topPlusMinus: sortedByPlusMinus.slice(0, 18),
    topAverage: sortedByAverage.slice(0, 18)
  };
};

export const applyTradesToRosters = () => {
  // Reset all team rosters
  mockTeams.forEach(team => {
    team.playerIds = [];
  });

  // Reset all player teamIds
  allPlayers.forEach(player => {
    player.teamId = undefined;
  });

  // Apply trades
  mockTrades.forEach(trade => {
    trade.playersTraded.forEach(({ player, fromTeam, toTeam }) => {
      // Remove player from old team
      const oldTeam = mockTeams.find(t => t.name === fromTeam);
      if (oldTeam) {
        oldTeam.playerIds = oldTeam.playerIds.filter(id => id !== player.id);
      }
      // Add player to new team
      const newTeam = mockTeams.find(t => t.name === toTeam);
      if (newTeam) {
        player.teamId = newTeam.id;
        if (!newTeam.playerIds.includes(player.id)) {
          newTeam.playerIds.push(player.id);
        }
      }
    });
  });
};

// Helper function
export const getTeamColorByName = (teamName: string): string => {
  const team = mockTeams.find(t => t.name === teamName);
  return team ? team.color : "#888";
};

// Call this function after defining mockTrades to sync rosters
applyTradesToRosters();

/**
 * Add a game result to a team and automatically update team stats.
 * Usage: addGameResult(teamId, { ...gameStats })
 */
export const addGameResult = (
  teamId: string,
  game: GameStats
) => {
  const team = mockTeams.find(t => t.id === teamId);
  if (!team) return;

  // Add game to team's games array
  if (!team.games) team.games = [];
  team.games.push(game);

  // Update points for/against
  team.pointsFor += game.pointsFor;
  team.pointsAgainst += game.pointsAgainst;

  // Update wins/losses
  if (game.result === "W") {
    team.wins += 1;
  } else if (game.result === "L") {
    team.losses += 1;
  }
};

/**
 * Recalculate all teams' stats from their games arrays.
 * Usage: recalculateTeamStats();
 */
export const recalculateTeamStats = () => {
  mockTeams.forEach(team => {
    team.wins = 0;
    team.losses = 0;
    team.pointsFor = 0;
    team.pointsAgainst = 0;
    if (team.games) {
      team.games.forEach(game => {
        team.pointsFor += game.pointsFor;
        team.pointsAgainst += game.pointsAgainst;
        if (game.result === "W") team.wins += 1;
        if (game.result === "L") team.losses += 1;
      });
    }
  });
};

// Example usage:
// addGameResult("1", { id: "g3", date: "2025-08-10", opponent: "Bull Luu", pointsFor: 22, pointsAgainst: 25, result: "L" });
 recalculateTeamStats();