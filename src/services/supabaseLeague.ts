import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Team = Database['public']['Tables']['teams']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type Game = Database['public']['Tables']['games']['Row'];

// Team functions
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('wins', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateTeamStats(teamId: string, gameData: {
  pointsFor: number;
  pointsAgainst: number;
  result: 'W' | 'L';
}) {
  // Get current team stats
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (teamError) throw teamError;

  // Calculate new stats
  const newWins = team.wins + (gameData.result === 'W' ? 1 : 0);
  const newLosses = team.losses + (gameData.result === 'L' ? 1 : 0);
  const newPointsFor = team.points_for + gameData.pointsFor;
  const newPointsAgainst = team.points_against + gameData.pointsAgainst;

  // Update team
  const { error } = await supabase
    .from('teams')
    .update({
      wins: newWins,
      losses: newLosses,
      points_for: newPointsFor,
      points_against: newPointsAgainst
    })
    .eq('id', teamId);

  if (error) throw error;
}

// Game functions
export async function addGame(gameData: {
  teamId: string;
  date: string;
  opponent: string;
  pointsFor: number;
  pointsAgainst: number;
  result: 'W' | 'L';
}) {
  const { error } = await supabase
    .from('games')
    .insert({
      team_id: gameData.teamId,
      date: gameData.date,
      opponent: gameData.opponent,
      points_for: gameData.pointsFor,
      points_against: gameData.pointsAgainst,
      result: gameData.result
    });

  if (error) throw error;
}

export async function getTeamGames(teamId: string): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('team_id', teamId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Player functions
export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*');
  
  if (error) throw error;
  return data || [];
}

export async function updatePlayerStats(playerId: string, updates: {
  gamesPlayed?: number;
  plusMinus?: number;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
}) {
  const { error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId);

  if (error) throw error;
}