import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import TeamCard from "@/components/TeamCard";
import UpcomingGames from "@/components/UpcomingGames";
import BillOfTheDay from "@/components/BillOfTheDay";

// Initialize Supabase client
const supabaseUrl = 'https://bqqotvjpvaznkjfldcgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW90dmpwdmF6bmtqZmxkY2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDE4NjEsImV4cCI6MjA3MDAxNzg2MX0.VPClABOucYEo-bVPg_brc6WvSx17zR4LADC2FEWdI5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Player = {
  id: string;
  name: string;
  primary_position: string; // or primaryprimary_position if you want
  plus_minus: number;
  games_played: number;
};

type Team = {
  team_id: string;
  name: string;
  wins: number;            // kept for other UI, not used for sorting
  losses: number;          // kept for other UI, not used for sorting
  points_for: number;
  points_against: number;
  captain: string;
  color: string;
  player_ids: string[];
  games: { id: string; date: string; opponent: string; pointsFor: number; pointsAgainst: number; result: string }[];
};

// Games with nested sets (for deriving match results)
type GameRow = {
  id: string;
  team_id: string;
  sets: { set_no: number; points_for: number; points_against: number }[] | null;
};

const Home = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived GAME-level wins/losses/ties by team
  const [gameWLT, setGameWLT] = useState<Record<string, { w: number; l: number; t: number }>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      // Fetch teams
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*");

      // Fetch players
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*");

      // Fetch games with nested sets (for match-level aggregation)
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("id, team_id, sets ( set_no, points_for, points_against )");

      if (teamError) {
        setError(`Error loading teams: ${teamError.message}`);
        setLoading(false);
        return;
      }
      if (playerError) {
        setError(`Error loading players: ${playerError.message}`);
        setLoading(false);
        return;
      }
      if (gamesError) {
        setError(`Error loading games: ${gamesError.message}`);
        setLoading(false);
        return;
      }

      setTeams(teamData ?? []);
      setPlayers(playerData ?? []);

      // Build GAME-level W/L/T (same logic as StandingsTable)
      const stats: Record<string, { w: number; l: number; t: number }> = {};

      // initialize every team so they sort deterministically even with 0 games
      for (const t of teamData ?? []) {
        stats[t.team_id] = { w: 0, l: 0, t: 0 };
      }

      (gamesData as GameRow[] | null)?.forEach((g) => {
        const sets = g.sets ?? [];
        if (sets.length === 0) return;

        let setWins = 0;
        let setLosses = 0;

        for (const s of sets) {
          if (s.points_for > s.points_against) setWins += 1;
          else if (s.points_for < s.points_against) setLosses += 1;
          // per-set ties ignored; overall tie decided below
        }

        if (!stats[g.team_id]) stats[g.team_id] = { w: 0, l: 0, t: 0 };

        if (setWins > setLosses) stats[g.team_id].w += 1;
        else if (setLosses > setWins) stats[g.team_id].l += 1;
        else stats[g.team_id].t += 1; // overall set tie -> match tie
      });

      setGameWLT(stats);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  // ---------- Standings order (matches StandingsTable) ----------
  // 1) Game Wins (desc)
  // 2) Point Differential (PF - PA) (desc)
  // 3) Points For (desc)
  const topTeams = [...teams]
    .sort((a, b) => {
      const winsA = gameWLT[a.team_id]?.w ?? 0;
      const winsB = gameWLT[b.team_id]?.w ?? 0;
      if (winsB !== winsA) return winsB - winsA;

      const diffA = (a.points_for ?? 0) - (a.points_against ?? 0);
      const diffB = (b.points_for ?? 0) - (b.points_against ?? 0);
      if (diffB !== diffA) return diffB - diffA;

      return (b.points_for ?? 0) - (a.points_for ?? 0);
    })
    .slice(0, 3);

  // Top performers (unchanged)
  function getTopPerformers() {
    const validPlayers = players.filter((p) => p.games_played > 0);
    const topplus_minus = [...players].sort((a, b) => b.plus_minus - a.plus_minus);
    const topAverage = [...validPlayers].sort(
      (a, b) => b.plus_minus / b.games_played - a.plus_minus / a.games_played
    );
    return { topplus_minus, topAverage };
  }

  const { topplus_minus, topAverage } = getTopPerformers();

  // Total games (left as-is from your original code)
  const totalGames = teams.reduce((sum, team) => sum + team.wins + team.losses, 0) ;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="flex flex-col items-center text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
             <img
    src="/logo.png"  // or .svg if that's your file type
    alt="NCL Logo"
    className="h-24 w-24 md:h-32 md:w-32 mb-4" // Bigger logo + spacing below
  />
            <span>Northeast Community League</span>
          </h1>

          <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Welcome to the NCL hub. Track teams, players, standings, and statistics all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/teams">
              <Button size="lg" variant="secondary" className="font-semibold">
                <Users className="mr-2 h-5 w-5" />
                View All Teams
              </Button>
            </Link>
            <Link to="/standings">
              <Button
                size="lg"
                variant="outline"
                className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <Trophy className="mr-2 h-5 w-5" />
                League Standings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* League Stats */}
        <section className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{teams.length}</div>
              <div className="text-sm text-muted-foreground">Teams</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {teams.reduce((sum, team) => sum + team.player_ids.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{totalGames}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {Math.round(teams.reduce((sum, team) => sum + team.points_for, 0) / (teams.length || 1))}
              </div>
              <div className="text-sm text-muted-foreground">Avg Points</div>
            </CardContent>
          </Card>
        </section>

        <UpcomingGames/>

        {/* Top Teams (Standings) */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Standings</h2>
            <Link to="/teams">
              <Button variant="outline">View All Teams</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {topTeams.map((team, index) => (
              <div key={team.team_id} className="relative">
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-hero">🏆 #1</Badge>
                )}
                {index === 1 && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-yellow-400 text-black">🥈 #2</Badge>
                )}
                {index === 2 && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-orange-400 text-black">🥉 #3</Badge>
                )}
                <TeamCard team={team} />
              </div>
            ))}
          </div>
        </section>

        {/* Player Highlights */}
        <section className="grid md:grid-cols-2 gap-8">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Top +/-
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topplus_minus.slice(0, 3).map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.primary_position}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          player.plus_minus > 0
                            ? "text-green-600"
                            : player.plus_minus < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {player.plus_minus > 0 ? "+" : ""}
                        {player.plus_minus}
                      </div>
                      <div className="text-xs text-muted-foreground">+/-</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                Best Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAverage.slice(0, 3).map((player, index) => {
                  const average = player.games_played > 0 ? player.plus_minus / player.games_played : 0;
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                        <div>
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.primary_position}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            average > 0
                              ? "text-green-600"
                              : average < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {average > 0 ? "+" : ""}
                          {average.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">avg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <BillOfTheDay/>
    </div>
  );
};

export default Home;
