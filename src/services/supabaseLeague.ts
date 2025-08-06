import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { mockTeams, allPlayers } from "@/data/mockData";

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

// Migrate mock data to Supabase
export async function migrateMockDataToSupabase() {
  try {
    // First, clear existing data
    await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert teams
    const { error: teamsError } = await supabase.from('teams').insert(
      mockTeams.map(team => ({
        id: team.id,
        name: team.name,
        wins: team.wins,
        losses: team.losses,
        points_for: team.pointsFor,
        points_against: team.pointsAgainst,
        captain: team.captain,
        color: team.color
      }))
    );
    if (teamsError) throw teamsError;

    // Insert players
    const { error: playersError } = await supabase.from('players').insert(
      allPlayers.map(player => ({
        id: player.id,
        name: player.name,
        primary_position: player.primaryPosition,
        team_id: player.teamId || null,
        plus_minus: player.plusMinus,
        games_played: player.gamesPlayed,
        points: player.stats.Hitting || 0,
        rebounds: player.stats.Blocking || 0,
        assists: player.stats.Setting || 0,
        steals: player.stats['Defensive Positioning'] || 0,
        skill_level: Math.round(Object.values(player.stats).reduce((a, b) => a + b, 0) / 10)
      }))
    );
    if (playersError) throw playersError;

    // Insert games
    const allGames = mockTeams.flatMap(team => 
      (team.games || []).map(game => ({
        id: game.id,
        team_id: team.id,
        date: game.date,
        opponent: game.opponent,
        points_for: game.pointsFor,
        points_against: game.pointsAgainst,
        result: game.result
      }))
    );

    if (allGames.length > 0) {
      const { error: gamesError } = await supabase.from('games').insert(allGames);
      if (gamesError) throw gamesError;
    }

    return { success: true, message: 'Mock data migrated successfully!' };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, message: 'Migration failed: ' + (error as Error).message };
  }
}