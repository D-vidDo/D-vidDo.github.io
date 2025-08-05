import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Team, Player, Trade, mockTeams, allPlayers, mockTrades } from '@/data/mockData';

interface LeagueContextType {
  teams: Team[];
  players: Player[];
  trades: Trade[];
  movePlayer: (playerId: string, fromTeamId: string | null, toTeamId: string | null) => void;
  announceTradeRecord: (trade: Omit<Trade, 'id'>) => void;
  updatePlayerStats: (playerId: string, plusMinus: number, gamesPlayed: number) => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};

interface LeagueProviderProps {
  children: ReactNode;
}

export const LeagueProvider: React.FC<LeagueProviderProps> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [players, setPlayers] = useState<Player[]>(allPlayers);
  const [trades, setTrades] = useState<Trade[]>(mockTrades);

  const movePlayer = (playerId: string, fromTeamId: string | null, toTeamId: string | null) => {
    // Update teams
    setTeams(prevTeams => 
      prevTeams.map(team => {
        if (team.id === fromTeamId) {
          return {
            ...team,
            playerIds: team.playerIds.filter(id => id !== playerId)
          };
        }
        if (team.id === toTeamId) {
          return {
            ...team,
            playerIds: [...team.playerIds, playerId]
          };
        }
        return team;
      })
    );

    // Update player
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId 
          ? { ...player, teamId: toTeamId || undefined }
          : player
      )
    );
  };

  const announceTradeRecord = (trade: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...trade,
      id: Date.now().toString()
    };
    setTrades(prev => [newTrade, ...prev]);
  };

  const updatePlayerStats = (playerId: string, plusMinus: number, gamesPlayed: number) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId 
          ? { ...player, plusMinus, gamesPlayed }
          : player
      )
    );
  };

  return (
    <LeagueContext.Provider value={{
      teams,
      players,
      trades,
      movePlayer,
      announceTradeRecord,
      updatePlayerStats
    }}>
      {children}
    </LeagueContext.Provider>
  );
};