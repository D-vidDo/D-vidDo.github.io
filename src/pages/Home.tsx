import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Target,
  Calendar,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import TeamCard from "@/components/TeamCard";
import UpcomingGames from "@/components/UpcomingGames";
import BillOfTheDay from "@/components/BillOfTheDay";
import MatchupCard from "@/components/MatchupCard";

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE SEASON
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_SEASON_ID = 5;

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = "https://bqqotvjpvaznkjfldcgm.supabase.co";

const supabaseAnonKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW90dmpwdmF6bmtqZmxkY2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDE4NjEsImV4cCI6MjA3MDAxNzg2MX0.VPClABOucYEo-bVPg_brc6WvSx17zR4LADC2FEWdI5Q";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Player = {
  id: string;
  name: string;
  primary_position: string;
  plus_minus: number;
  games_played: number;
};

type Team = {
  team_id: string;
  name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  captain: string;
  color: string;
  player_ids: string[];
  games: {
    id: string;
    date: string;
    opponent: string;
    pointsFor: number;
    pointsAgainst: number;
    result: string;
  }[];
};

type GameRow = {
  id: string;
  team_id: string;
  sets:
    | {
        set_no: number;
        points_for: number;
        points_against: number;
      }[]
    | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getPlayerAverage = (player: Player) =>
  player.games_played > 0
    ? player.plus_minus / player.games_played
    : 0;

const getSignedValue = (value: number) =>
  `${value > 0 ? "+" : ""}${value}`;

const getValueColor = (value: number) =>
  value > 0
    ? "text-emerald-500"
    : value < 0
    ? "text-rose-500"
    : "text-muted-foreground";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Home = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gameWLT, setGameWLT] = useState<
    Record<string, { w: number; l: number; t: number }>
  >({});

  // ───────────────────────────────────────────────────────────────────────────
  // DATA
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("season_id", ACTIVE_SEASON_ID);

      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*");

      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select(
          `
            id,
            team_id,
            sets (
              set_no,
              points_for,
              points_against
            )
          `
        )
        .eq("season_id", ACTIVE_SEASON_ID);

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

      const stats: Record<string, { w: number; l: number; t: number }> = {};

      for (const team of teamData ?? []) {
        stats[team.team_id] = {
          w: 0,
          l: 0,
          t: 0,
        };
      }

      (gamesData as GameRow[] | null)?.forEach((game) => {
        const sets = game.sets ?? [];

        if (sets.length === 0) return;

        let setWins = 0;
        let setLosses = 0;

        for (const set of sets) {
          if (set.points_for > set.points_against) {
            setWins += 1;
          } else if (set.points_for < set.points_against) {
            setLosses += 1;
          }
        }

        if (!stats[game.team_id]) {
          stats[game.team_id] = {
            w: 0,
            l: 0,
            t: 0,
          };
        }

        if (setWins > setLosses) {
          stats[game.team_id].w += 1;
        } else if (setLosses > setWins) {
          stats[game.team_id].l += 1;
        } else {
          stats[game.team_id].t += 1;
        }
      });

      setGameWLT(stats);
      setLoading(false);
    }

    fetchData();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // LOADING / ERROR
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading the league...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Target className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-semibold mb-2">
            Something went wrong
          </h2>

          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STANDINGS
  // ───────────────────────────────────────────────────────────────────────────

  const topTeams = [...teams]
    .sort((a, b) => {
      const winsA = gameWLT[a.team_id]?.w ?? 0;
      const winsB = gameWLT[b.team_id]?.w ?? 0;

      if (winsB !== winsA) {
        return winsB - winsA;
      }

      const diffA =
        (a.points_for ?? 0) - (a.points_against ?? 0);

      const diffB =
        (b.points_for ?? 0) - (b.points_against ?? 0);

      if (diffB !== diffA) {
        return diffB - diffA;
      }

      return (b.points_for ?? 0) - (a.points_for ?? 0);
    })
    .slice(0, 3);

  // ───────────────────────────────────────────────────────────────────────────
  // PLAYER LEADERS
  // ───────────────────────────────────────────────────────────────────────────

  const validPlayers = players.filter(
    (player) => player.games_played > 0
  );

  const topPlusMinus = [...players].sort(
    (a, b) => b.plus_minus - a.plus_minus
  );

  const topAverage = [...validPlayers].sort(
    (a, b) => getPlayerAverage(b) - getPlayerAverage(a)
  );

  // ───────────────────────────────────────────────────────────────────────────
  // LEAGUE STATS
  // ───────────────────────────────────────────────────────────────────────────

  const totalGames = teams.reduce(
    (sum, team) => sum + team.wins + team.losses,
    0
  );

  const totalPlayers = teams.reduce(
    (sum, team) => sum + (team.player_ids?.length ?? 0),
    0
  );

  const averagePoints = Math.round(
    teams.reduce(
      (sum, team) => sum + (team.points_for ?? 0),
      0
    ) / (teams.length || 1)
  );

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND ORBS
          ═══════════════════════════════════════════════════════════════════ */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />

        <div className="absolute top-[30%] -right-40 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[140px]" />

        <div className="absolute bottom-0 left-[30%] w-[500px] h-[500px] rounded-full bg-orange-400/5 blur-[130px]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════════ */}

      <section className="relative px-4 pt-8 sm:pt-12 pb-16">
        <div className="max-w-7xl mx-auto">

          <div className="relative overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/[0.04] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.10)]">

            {/* Hero gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/30 via-blue-400/20 to-indigo-600/30" />

            {/* Decorative glow */}
            <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/30 blur-3xl" />

            <div className="relative px-6 sm:px-10 lg:px-16 py-14 sm:py-20 lg:py-24">

              <div className="max-w-4xl">

                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/30 backdrop-blur-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-white/90 shadow-sm mb-7">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span>Season {ACTIVE_SEASON_ID}</span>
                  <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                  <span>Northeast Community League</span>
                </div>

                {/* Logo */}
                <img
                  src="/logo.png"
                  alt="NCL Logo"
                  className="h-20 w-20 sm:h-24 sm:w-24 mb-7 drop-shadow-xl"
                />

                {/* Main heading */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[0.95] text-slate-900 dark:text-white">
                  The NCL
                  <span className="block bg-gradient-to-r from-orange-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Fall 2026
                  </span>
                </h1>

                <p className="mt-7 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-700/90 dark:text-white/70">
                  Follow teams, players, standings, upcoming games, and
                  everything happening across the NCL season.
                </p>

                {/* Buttons */}
                <div className="mt-9 flex flex-col sm:flex-row gap-3">

                  <Link to="/teams">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto rounded-full px-7 h-12 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Explore Teams
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <Link to="/standings">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto rounded-full px-7 h-12 border-white/50 bg-white/25 hover:bg-white/40 backdrop-blur-xl text-slate-900 dark:text-white"
                    >
                      <Trophy className="mr-2 h-5 w-5" />
                      View Standings
                    </Button>
                  </Link>

                </div>
              </div>

              {/* Hero floating stat */}
              <div className="hidden lg:block absolute right-12 bottom-12 w-64">
                <div className="rounded-3xl border border-white/50 bg-white/30 dark:bg-white/10 backdrop-blur-2xl p-5 shadow-2xl">

                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-white/60">
                      League Snapshot
                    </span>

                    <div className="h-8 w-8 rounded-full bg-white/40 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>

                  <div className="text-4xl font-bold text-slate-900 dark:text-white">
                    {teams.length}
                  </div>

                  <div className="text-sm text-slate-600 dark:text-white/60 mt-1">
                    active teams
                  </div>

                  <div className="mt-5 h-px bg-white/30" />

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-white/60">
                      Players
                    </span>

                    <span className="font-semibold text-slate-900 dark:text-white">
                      {totalPlayers}
                    </span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONTENT
          ═══════════════════════════════════════════════════════════════════ */}

      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20 space-y-16">

        {/* ═══════════════════════════════════════════════════════════════════
            LEAGUE SNAPSHOT
            ═══════════════════════════════════════════════════════════════ */}

        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

            {/* Teams */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]">

              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-orange-400/10 blur-2xl" />

              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5">
                  <Trophy className="h-5 w-5 text-orange-500" />
                </div>

                <div className="text-3xl font-bold tracking-tight">
                  {teams.length}
                </div>

                <div className="text-sm text-muted-foreground mt-1">
                  Teams
                </div>
              </div>
            </div>

            {/* Players */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]">

              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-blue-400/10 blur-2xl" />

              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>

                <div className="text-3xl font-bold tracking-tight">
                  {totalPlayers}
                </div>

                <div className="text-sm text-muted-foreground mt-1">
                  Active Players
                </div>
              </div>
            </div>

            {/* Games */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]">

              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-indigo-400/10 blur-2xl" />

              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                </div>

                <div className="text-3xl font-bold tracking-tight">
                  {totalGames}
                </div>

                <div className="text-sm text-muted-foreground mt-1">
                  Games Played
                </div>
              </div>
            </div>

            {/* Average */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]">

              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />

              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-5">
                  <Target className="h-5 w-5 text-cyan-600" />
                </div>

                <div className="text-3xl font-bold tracking-tight">
                  {averagePoints}
                </div>

                <div className="text-sm text-muted-foreground mt-1">
                  Avg. Points
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            UPCOMING GAMES
            ═══════════════════════════════════════════════════════════════ */}

        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live League Schedule
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Upcoming games
              </h2>

              <p className="text-muted-foreground mt-2">
                See what’s coming up next.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/50 dark:border-white/10 bg-white/35 dark:bg-white/[0.03] backdrop-blur-xl p-2 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
            <UpcomingGames />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            STANDINGS
            ═══════════════════════════════════════════════════════════════ */}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-orange-500 mb-2">
                <Trophy className="h-4 w-4" />
                Current Season
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                League leaders
              </h2>

              <p className="text-muted-foreground mt-2">
                The top three teams right now.
              </p>
            </div>

            <Link to="/standings">
              <Button
                variant="outline"
                className="rounded-full border-border/60 bg-background/50 backdrop-blur-xl"
              >
                Full standings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

          </div>

          <div className="grid md:grid-cols-3 gap-5">

            {topTeams.map((team, index) => (
              <div
                key={team.team_id}
                className="relative"
              >

                {/* Ranking badge */}
                <div
                  className={`absolute -top-3 -right-2 z-20 h-10 min-w-10 px-3 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-background ${
                    index === 0
                      ? "bg-gradient-to-br from-amber-300 to-yellow-500 text-yellow-950"
                      : index === 1
                      ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800"
                      : "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950"
                  }`}
                >
                  #{index + 1}
                </div>

                {/* Glass shell */}
                <div className="rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/[0.03] backdrop-blur-xl p-1 shadow-[0_15px_50px_rgba(0,0,0,0.07)]">
                  <TeamCard team={team} />
                </div>

              </div>
            ))}

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            PLAYER LEADERS
            ═══════════════════════════════════════════════════════════════ */}

        <section>

          <div className="mb-7">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-500 mb-2">
              <Sparkles className="h-4 w-4" />
              Player spotlight
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              League leaders
            </h2>

            <p className="text-muted-foreground mt-2">
              The players making the biggest impact.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">

            {/* ═══════════════════════════════════════════════════════════════
                TOP +/-
                ═══════════════════════════════════════════════════════════ */}

            <div className="rounded-[2rem] border border-white/50 dark:border-white/10 bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 shadow-[0_15px_50px_rgba(0,0,0,0.06)]">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">
                    Top +/-
                  </h3>

                  <p className="text-sm text-muted-foreground mt-1">
                    Total impact
                  </p>
                </div>

                <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-orange-500" />
                </div>
              </div>

              <div className="space-y-2">

                {topPlusMinus.slice(0, 3).map((player, index) => (
                  <div
                    key={player.id}
                    className="group flex items-center justify-between rounded-2xl border border-transparent hover:border-white/40 dark:hover:border-white/10 bg-white/30 dark:bg-white/[0.03] hover:bg-white/50 dark:hover:bg-white/[0.06] p-3.5 transition-all duration-200"
                  >

                    <div className="flex items-center gap-3 min-w-0">

                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          index === 0
                            ? "bg-gradient-to-br from-amber-300 to-yellow-500 text-yellow-950"
                            : "bg-muted/70 text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {player.name}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {player.primary_position}
                        </div>
                      </div>

                    </div>

                    <div className="text-right ml-3">
                      <div
                        className={`text-lg font-bold ${getValueColor(
                          player.plus_minus
                        )}`}
                      >
                        {getSignedValue(player.plus_minus)}
                      </div>

                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        +/- 
                      </div>
                    </div>

                  </div>
                ))}

              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                BEST AVERAGE
                ═══════════════════════════════════════════════════════════ */}

            <div className="rounded-[2rem] border border-white/50 dark:border-white/10 bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 shadow-[0_15px_50px_rgba(0,0,0,0.06)]">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">
                    Best average
                  </h3>

                  <p className="text-sm text-muted-foreground mt-1">
                    Impact per set
                  </p>
                </div>

                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>

              <div className="space-y-2">

                {topAverage.slice(0, 3).map((player, index) => {
                  const average = getPlayerAverage(player);

                  return (
                    <div
                      key={player.id}
                      className="group flex items-center justify-between rounded-2xl border border-transparent hover:border-white/40 dark:hover:border-white/10 bg-white/30 dark:bg-white/[0.03] hover:bg-white/50 dark:hover:bg-white/[0.06] p-3.5 transition-all duration-200"
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            index === 0
                              ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white"
                              : "bg-muted/70 text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {player.name}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {player.primary_position}
                          </div>
                        </div>

                      </div>

                      <div className="text-right ml-3">

                        <div
                          className={`text-lg font-bold ${getValueColor(
                            average
                          )}`}
                        >
                          {getSignedValue(
                            Number(average.toFixed(1))
                          )}
                        </div>

                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          avg / set
                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            FINAL CTA
            ═══════════════════════════════════════════════════════════════ */}

        <section>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]">

            <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />

            <div className="relative px-6 sm:px-10 py-10 sm:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">

              <div>
                <div className="flex items-center gap-2 text-sm text-blue-300 font-medium mb-3">
                  <Sparkles className="h-4 w-4" />
                  Your league. Your season.
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Explore the NCL.
                </h2>

                <p className="mt-3 text-white/60 max-w-xl">
                  Dive deeper into the season, with teams, players, statistics, and
                  everything in between.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">

                <Link to="/players">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-white text-slate-900 hover:bg-white/90 px-7"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Players
                  </Button>
                </Link>

                <Link to="/standings">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto rounded-full border-white/20 bg-white/10 hover:bg-white/20 text-white px-7"
                  >
                    Standings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          BILL OF THE DAY
          ═══════════════════════════════════════════════════════════════════ */}

      <BillOfTheDay />

    </div>
  );
};

export default Home;
