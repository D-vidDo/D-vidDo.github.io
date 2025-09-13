import React, { useEffect, useState } from "react";
import StandingsTable from "@/components/StandingsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  captain: string;
  color: string;
  player_ids: string[];
  streak?: number;
}

const Standings = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);

      const { data: teamsData, error: teamsError } = await supabase.from<Team>("teams").select("*");
      if (teamsError) {
        setError(teamsError.message);
        setLoading(false);
        return;
      }

      const { data: setsData, error: setsError } = await supabase
        .from("sets")
        .select("game_id, result, id")
        .order("id", { ascending: true }); // chronological order

      if (setsError) {
        setError(setsError.message);
        setLoading(false);
        return;
      }

      // Calculate current win streak
      const streaks: Record<string, number> = {};
      for (const team of teamsData) {
        const { data: teamGames, error: teamGamesError } = await supabase
          .from("games")
          .select("id")
          .eq("team_id", team.id);

        if (teamGamesError) continue;

        const gameIds = teamGames.map((g) => g.id);
        const teamSets = setsData?.filter((s) => gameIds.includes(s.game_id)) || [];

        let current = 0;
        for (let i = teamSets.length - 1; i >= 0; i--) {
          if (teamSets[i].result === "W") {
            current++;
          } else {
            break; // stop streak at first non-win
          }
        }
        streaks[team.id] = current;
      }

      const enrichedTeams = teamsData.map((t) => ({
        ...t,
        streak: streaks[t.id] || 0,
      }));

      setTeams(enrichedTeams);
      setLoading(false);
    };

    fetchTeams();
  }, []);

  if (loading) return <div className="text-center mt-20">Loading teams...</div>;
  if (error) return <div className="text-center mt-20 text-red-600">Error: {error}</div>;

  const sortedTeams = teams
    .map((team) => ({
      ...team,
      winPercentage: team.wins + team.losses > 0 ? team.wins / (team.wins + team.losses) : 0,
      pointDifferential: team.points_for - team.points_against,
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.points_for !== a.points_for) return b.points_for - a.points_for;
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.pointDifferential - a.pointDifferential;
    });

  const leaderTeam = sortedTeams[0] || null;
  const totalGames = teams.reduce((sum, team) => sum + team.wins + team.losses, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            League Standings
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-6">
            Current team rankings and performance statistics
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {leaderTeam && (
              <Badge variant="secondary" className="text-lg px-4 py-2 flex items-center">
                <Trophy className="mr-2 h-4 w-4" />
                Leader: {leaderTeam.name}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-lg px-4 py-2 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground"
            >
              {totalGames} Games Completed
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Leader Card */}
        {leaderTeam && (
          <Card className="bg-gradient-card shadow-primary border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-6 w-6 text-primary" />
                Current League Leader
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{ backgroundColor: leaderTeam.color }}
                  >
                    {leaderTeam.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-card-foreground">{leaderTeam.name}</h3>
                    <p className="text-muted-foreground">Captain: {leaderTeam.captain}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {(leaderTeam.winPercentage * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Win Percentage</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {Math.max(...teams.map((t) => t.streak || 0))}
              </div>
              <div className="text-sm text-muted-foreground">Longest Win Streak</div>
              <div className="text-xs text-muted-foreground mt-1">
                {teams.find((t) => t.streak === Math.max(...teams.map((team) => team.streak || 0)))
                  ?.name || "-"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {Math.max(...sortedTeams.map((t) => t.points_for))}
              </div>
              <div className="text-sm text-muted-foreground">Highest Scoring</div>
              <div className="text-xs text-muted-foreground mt-1">
                {sortedTeams.find((t) => t.points_for === Math.max(...sortedTeams.map((team) => team.points_for)))
                  ?.name || "-"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                +{Math.max(...sortedTeams.map((t) => t.pointDifferential))}
              </div>
              <div className="text-sm text-muted-foreground">Best Differential</div>
              <div className="text-xs text-muted-foreground mt-1">
                {sortedTeams.find((t) => t.pointDifferential === Math.max(...sortedTeams.map((team) => team.pointDifferential)))
                  ?.name || "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Standings Table */}
        <StandingsTable teams={teams} />
      </div>
    </div>
  );
};

export default Standings;
