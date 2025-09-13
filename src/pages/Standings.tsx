import React, { useEffect, useState } from "react";
import StandingsTable from "@/components/StandingsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Team {
  team_id: number;
  name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  captain: string;
  color: string;
  player_ids: string[];
}

const Standings = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [longestStreakTeam, setLongestStreakTeam] = useState<{ name: string; streak: number } | null>(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1) Load teams (used for names/colors and to ensure we iterate all)
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*");
      if (teamError) throw teamError;
      if (!teamData) throw new Error("No teams returned");
      setTeams(teamData);

      // 2) Load sets joined to games, ORDERED chronologically
      const { data: setsData, error: setsError } = await supabase
        .from("sets")
        .select(`
          id,
          set_no,
          result,
          game_id,
          games (
            id,
            team_id,
            date
          )
        `)
        .order("date", { foreignTable: "games", ascending: true })
        .order("set_no", { ascending: true })
        .order("id", { ascending: true }); // tie-breaker
      if (setsError) throw setsError;

      // Handle bigint ids safely
      const keyOf = (v: unknown) => String(v ?? "");

      type JoinedSet = {
        id: number;
        set_no: number | null;
        result: string | null; // 'W'|'L'
        games: { id: number; team_id: string | number | null; date: string | null } | null;
      };

      // 3) Build: teamKey -> chronological [{date,set_no,result}]
      const teamResultsMap: Record<string, { date: string; set_no: number; result: "W"|"L" }[]> = {};
      for (const row of (setsData ?? []) as JoinedSet[]) {
        const g = row.games;
        if (!g || g.team_id == null || !g.date) continue;

        const teamKey = keyOf(g.team_id);
        const res = (row.result ?? "").trim().toUpperCase();
        if (res !== "W" && res !== "L") continue;

        (teamResultsMap[teamKey] ||= []).push({
          date: g.date,                    // DATE type ('YYYY-MM-DD'); lexical order works
          set_no: Number(row.set_no) || 0, // ensure numeric
          result: res as "W" | "L",
        });
      }

      // 4) Compute longest W streak per team
      let maxStreak = 0;
      let streakTeamKey = "";

      for (const t of teamData as any[]) {
        const tKey = keyOf(t.team_id);
        const results = (teamResultsMap[tKey] ?? []).slice();

        // Safety sort (already ordered by SQL, but fine to keep)
        results.sort((a, b) => (a.date === b.date ? a.set_no - b.set_no : a.date.localeCompare(b.date)));

        let cur = 0, best = 0;
        for (const r of results) {
          if (r.result === "W") {
            cur += 1;
            if (cur > best) best = cur;
          } else {
            cur = 0;
          }
        }

        if (best > maxStreak) {
          maxStreak = best;
          streakTeamKey = tKey;
        }
      }

      const team = (teamData as any[]).find((t) => keyOf(t.team_id) === streakTeamKey);
      setLongestStreakTeam({ name: team?.name ?? "-", streak: maxStreak });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);



  if (loading) return <div className="text-center mt-20">Loading teams...</div>;
  if (error) return <div className="text-center mt-20 text-red-600">Error: {error}</div>;

  // Calculate winPercentage and pointDifferential for sorting
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
      {/* Header Section */}
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
        {/* League Leader Highlight */}
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
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {Math.max(...sortedTeams.map((t) => t.wins))}
              </div>
              <div className="text-sm text-muted-foreground">Most Wins</div>
              <div className="text-xs text-muted-foreground mt-1">
                {sortedTeams.find((t) => t.wins === Math.max(...sortedTeams.map((team) => team.wins)))
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
                {sortedTeams.find(
                  (t) => t.points_for === Math.max(...sortedTeams.map((team) => team.points_for))
                )?.name || "-"}
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
                {sortedTeams.find(
                  (t) =>
                    t.pointDifferential === Math.max(...sortedTeams.map((team) => team.pointDifferential))
                )?.name || "-"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {longestStreakTeam?.streak || 0}
              </div>
              <div className="text-sm text-muted-foreground">Longest Win Streak</div>
              <div className="text-xs text-muted-foreground mt-1">
                {longestStreakTeam?.name || "-"}
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
