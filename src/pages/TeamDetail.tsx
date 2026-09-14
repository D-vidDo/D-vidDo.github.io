import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Users,
  CalendarDays,
  PlayCircle,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";

/* ================= TYPES ================= */

interface Set {
  set_no: number;
  points_for: number;
  points_against: number;
  vod_link?: string | null;
}

interface Game {
  id: string;
  date: string;
  time: string;
  opponent: string;
  points_for: number;
  points_against: number;
  result: "W" | "L" | "T";
  sets: Set[];
}

interface Player {
  id: string;
  name: string;
  plus_minus: number;
  games_played: number;
}

interface TradePlayer {
  player: {
    name: string;
  };
  fromTeam: string;
  toTeam: string;
  fromColor?: string;
  toColor?: string;
}

interface Trade {
  id: string;
  date: string;
  description: string;
  playersTraded: TradePlayer[];
}

interface Team {
  team_id: string;
  name: string;
  wins: number;
  losses: number;
  captain: string;
  color: string;
  color2: string;
  points_for: number;
  points_against: number;
  player_ids: string[];
}

/* ================= HELPERS ================= */

const formatTime12H = (time?: string | null) => {
  if (!time) return "—";

  const parts = time.split(":");

  if (parts.length < 2) return time;

  const [hourStr, minute] = parts;
  const hour = parseInt(hourStr, 10);

  if (isNaN(hour)) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minute} ${suffix}`;
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* ================= MAIN COMPONENT ================= */

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamData() {
      setLoading(true);
      setError(null);

      try {
        /* ================= TEAM ================= */

        const {
          data: teamData,
          error: teamErr,
        } = await supabase
          .from("teams")
          .select("*")
          .eq("team_id", teamId)
          .single();

        if (teamErr) throw teamErr;

        if (!teamData) {
          throw new Error("Team not found");
        }

        setTeam(teamData);

        /* ================= PLAYERS ================= */

        const {
          data: playersData,
          error: playersErr,
        } = await supabase
          .from("players_public")
          .select("*")
          .in("id", teamData.player_ids ?? []);

        if (playersErr) throw playersErr;

        setPlayers(playersData ?? []);

        /* ================= GAMES ================= */

        const {
          data: gameData,
          error: gameErr,
        } = await supabase
          .from("games")
          .select(
            `
            id,
            date,
            time,
            opponent,
            team_id,
            sets (
              set_no,
              points_for,
              points_against,
              vod_link
            )
          `
          )
          .eq("team_id", teamId)
          .order("date", { ascending: true })
          .order("time", {
            ascending: false,
            nullsFirst: false,
          })
          .order("set_no", {
            foreignTable: "sets",
            ascending: true,
          });

        if (gameErr) throw gameErr;

        const playedGames = (gameData ?? [])
          .filter((g) => g.sets && g.sets.length > 0)
          .map((g) => {
            const orderedSets = [...g.sets].sort(
              (a, b) => (a.set_no ?? 0) - (b.set_no ?? 0)
            );

            const totalPF = orderedSets.reduce(
              (sum, s) => sum + s.points_for,
              0
            );

            const totalPA = orderedSets.reduce(
              (sum, s) => sum + s.points_against,
              0
            );

            const result: "W" | "L" | "T" =
              totalPF > totalPA
                ? "W"
                : totalPF < totalPA
                ? "L"
                : "T";

            return {
              id: String(g.id),
              date: g.date as string,
              time: g.time as string,
              opponent: g.opponent as string,
              points_for: totalPF,
              points_against: totalPA,
              result,
              sets: orderedSets,
            };
          })
          .sort(
            (a, b) =>
              new Date(`${a.date}T${a.time}`).getTime() -
              new Date(`${b.date}T${b.time}`).getTime()
          );

        setGames(playedGames);

        /* ================= TRADES ================= */

        const {
          data: tradeRows,
          error: tradeErr,
        } = await supabase
          .from("players_traded")
          .select(
            `
            from_team,
            to_team,
            trades (
              id,
              date,
              description
            ),
            player:player_id (
              id,
              name
            )
          `
          )
          .in("trade_id", [7, 8, 9, 10, 11, 12])
          .or(
            `to_team.eq.${teamData.name},from_team.eq.${teamData.name}`
          )
          .order("created_at", { ascending: false });

        if (tradeErr) throw tradeErr;

        /* ================= TRADE TEAM COLORS ================= */

        const tradeTeamNames = Array.from(
          new Set(
            (tradeRows ?? []).flatMap((row: any) => [
              row.from_team,
              row.to_team,
            ])
          )
        );

        const { data: teamsData } = await supabase
          .from("teams")
          .select("name,color,color2")
          .in("name", tradeTeamNames);

        const teamColorsMap: Record<string, string> = {};

        (teamsData ?? []).forEach((t: any) => {
          teamColorsMap[t.name] = t.color;
        });

        /* ================= ORGANIZE TRADES ================= */

        const tradeMap: Record<string, Trade> = {};

        (tradeRows ?? []).forEach((row: any) => {
          if (!row.trades) return;

          const tradeId = String(row.trades.id);

          if (!tradeMap[tradeId]) {
            tradeMap[tradeId] = {
              id: tradeId,
              date: row.trades.date,
              description: row.trades.description,
              playersTraded: [],
            };
          }

          tradeMap[tradeId].playersTraded.push({
            player: row.player,
            fromTeam: row.from_team,
            toTeam: row.to_team,
            fromColor:
              teamColorsMap[row.from_team] ?? "#64748b",
            toColor:
              teamColorsMap[row.to_team] ?? "#64748b",
          });
        });

        setTrades(Object.values(tradeMap));
      } catch (err) {
        setError(
          "Unexpected error: " + (err as Error).message
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTeamData();
  }, [teamId]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#050506] flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-12 w-12 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-[3px] border-black/5 dark:border-white/10" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-black dark:border-t-white animate-spin" />
          </div>

          <p className="text-sm text-black/50 dark:text-white/50">
            Loading team details…
          </p>
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#050506] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-3xl bg-white/70 dark:bg-white/10 border border-black/5 dark:border-white/10 backdrop-blur-xl flex items-center justify-center shadow-xl">
            <Trophy className="h-7 w-7 text-black/40 dark:text-white/40" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight mb-5 text-black dark:text-white">
            {error || "Team not found"}.
          </h1>

          <Link to="/teams">
            <Button className="rounded-full px-6 shadow-lg">
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ================= TEAM STATS ================= */

  const totalTeamGames = team.wins + team.losses;

  const winPercentage =
    totalTeamGames > 0
      ? ((team.wins / totalTeamGames) * 100).toFixed(1)
      : "0.0";

  const teamplus_minus = players.reduce(
    (sum, p) => sum + (p.plus_minus || 0),
    0
  );

  const teamGames = players.reduce(
    (sum, p) => sum + (p.games_played || 0),
    0
  );

  const teamAverage =
    teamGames > 0
      ? parseFloat(
          (teamplus_minus / teamGames).toFixed(1)
        )
      : 0;

  const pointDifferential =
    (team.points_for ?? 0) -
    (team.points_against ?? 0);

   return (
    <div className="min-h-screen text-foreground overflow-hidden">
      {/* =====================================================
          AMBIENT TEAM ATMOSPHERE
      ===================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-48 left-[15%] h-[600px] w-[600px] rounded-full blur-[150px] opacity-[0.14]"
          style={{ backgroundColor: team.color }}
        />

        <div
          className="absolute top-[35%] -right-48 h-[650px] w-[650px] rounded-full blur-[170px] opacity-[0.10]"
          style={{ backgroundColor: team.color2 }}
        />

        <div
          className="absolute -bottom-48 left-[10%] h-[550px] w-[550px] rounded-full blur-[170px] opacity-[0.07]"
          style={{ backgroundColor: team.color }}
        />
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative px-4 pt-5 md:pt-8">
        <div
          className="relative max-w-7xl mx-auto overflow-hidden rounded-[32px] md:rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.14)]"
          style={{
            background: `
              linear-gradient(
                135deg,
                ${team.color} 0%,
                ${team.color2} 100%
              )
            `,
          }}
        >
          {/* Material layers */}

          <div className="absolute inset-0 bg-white/[0.08]" />

          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />

          <div className="absolute -top-48 -right-20 h-[550px] w-[550px] rounded-full bg-white/20 blur-[120px]" />

          <div className="absolute -bottom-56 -left-24 h-[500px] w-[500px] rounded-full bg-black/10 blur-[120px]" />

          {/* Decorative rings */}

          <div className="absolute -right-20 top-1/2 hidden md:block h-[360px] w-[360px] -translate-y-1/2 rounded-full border border-white/10" />

          <div className="absolute -right-8 top-1/2 hidden md:block h-[270px] w-[270px] -translate-y-1/2 rounded-full border border-white/[0.08]" />

          <div className="relative px-6 py-6 md:px-12 md:py-9">
            <Link
              to="/teams"
              className="group inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-2 text-sm font-medium text-white/80 backdrop-blur-xl hover:bg-white/20 hover:text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Teams
            </Link>

            <div className="mt-10 md:mt-14 flex flex-col md:flex-row md:items-center gap-7 md:gap-10">
              {/* Logo */}

              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="relative h-32 w-32 md:h-44 md:w-44 rounded-[30px] md:rounded-[38px] bg-white/15 border border-white/25 backdrop-blur-2xl shadow-2xl flex items-center justify-center p-5">
                  <div className="absolute inset-2.5 rounded-[24px] md:rounded-[30px] border border-white/10" />

                  <div className="absolute inset-0 rounded-[30px] md:rounded-[38px] bg-gradient-to-br from-white/20 to-transparent" />

                  <img
                    src={`/logos/${team.team_id}.png`}
                    alt={`${team.name} logo`}
                    className="relative z-10 h-full w-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.25)]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>

              {/* Team identity */}

              <div className="relative flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl px-3 py-1.5 mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

                  <span className="text-[10px] font-bold tracking-[0.18em] text-white/85">
                    TEAM PROFILE
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.055em] text-white leading-[0.95]">
                  {team.name}
                </h1>

                <p className="mt-4 text-sm md:text-base text-white/65">
                  Captained by{" "}
                  <span className="font-semibold text-white">
                    {team.captain}
                  </span>
                </p>

                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-xl shadow-lg">
                    <Trophy className="h-4 w-4" />
                    {team.wins}W – {team.losses}L
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-black/10 border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/85 backdrop-blur-xl">
                    <span className="text-white/60">Win rate</span>
                    {winPercentage}%
                  </div>
                </div>
              </div>

              {/* Desktop record */}

              <div className="hidden lg:flex shrink-0 flex-col items-end text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/50">
                  Season Record
                </div>

                <div className="mt-1 text-5xl font-semibold tracking-tight text-white">
                  {team.wins}
                  <span className="text-white/35">–</span>
                  {team.losses}
                </div>

                <div className="mt-2 text-xs text-white/50">
                  {teamGames} player games
                </div>
              </div>
            </div>

            {/* Hero bottom stats */}

            <div className="relative mt-10 md:mt-14 pt-5 md:pt-6 border-t border-white/15">
              <div className="grid grid-cols-3 gap-3 md:gap-8">
                <HeroMiniStat
                  label="Points For"
                  value={team.points_for}
                />

                <HeroMiniStat
                  label="Points Against"
                  value={team.points_against}
                />

                <HeroMiniStat
                  label="Point Diff"
                  value={
                    pointDifferential > 0
                      ? `+${pointDifferential}`
                      : pointDifferential
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative max-w-7xl mx-auto px-4 py-7 md:py-10 space-y-5 md:space-y-7">

        {/* ===================================================
            STATS
        =================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <GlassStatCard
            title="Points For"
            icon={<Trophy />}
            value={team.points_for}
            accent={team.color}
          />

          <GlassStatCard
            title="Team +/-"
            icon={<TrendingUp />}
            value={teamplus_minus}
            isplus_minus
            accent={team.color}
          />

          <GlassStatCard
            title="Total Games"
            icon={<Users />}
            value={teamGames}
            accent={team.color2}
          />

          <GlassStatCard
            title="Team Average"
            icon={<TrendingUp />}
            value={teamAverage.toFixed(1)}
            isplus_minus
            accent={team.color2}
          />
        </div>

        {/* ===================================================
            RECORD SUMMARY
        =================================================== */}

        <GlassPanel>
          <div className="grid grid-cols-2 md:grid-cols-4">
            <SummaryItem
              label="Wins"
              value={team.wins}
              color="text-emerald-500"
            />

            <SummaryItem
              label="Losses"
              value={team.losses}
              color="text-red-500"
            />

            <SummaryItem
              label="Points Against"
              value={team.points_against}
            />

            <SummaryItem
              label="Point Differential"
              value={
                pointDifferential > 0
                  ? `+${pointDifferential}`
                  : pointDifferential
              }
              color={
                pointDifferential > 0
                  ? "text-emerald-500"
                  : pointDifferential < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }
            />
          </div>
        </GlassPanel>

        {/* ===================================================
            ROSTER
        =================================================== */}

        <GlassPanel>
          <SectionHeader
            icon={<Users />}
            title="Team Roster"
            count={players.length}
          />

          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Current players on the team.
          </p>

          {players.length === 0 ? (
            <EmptyState text="No players currently listed." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="group relative overflow-hidden rounded-[24px] border border-border/50 bg-white/35 dark:bg-white/[0.035] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/55 dark:hover:bg-white/[0.06] hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)]"
                >
                  {/* Accent line */}

                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 opacity-60"
                    style={{
                      background: `linear-gradient(to bottom, ${team.color}, ${team.color2})`,
                    }}
                  />

                  <PlayerCard
                    player={{
                      ...player,
                      isCaptain: player.name === team.captain,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* ===================================================
            MATCH HISTORY
        =================================================== */}

        <GlassPanel>
          <SectionHeader
            icon={<CalendarDays />}
            title="Match History"
            count={games.length}
          />

          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Set-by-set results and available game VODs.
          </p>

          {games.length === 0 ? (
            <EmptyState text="No games played yet." />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-border/50 bg-white/20 dark:bg-white/[0.025]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-black/[0.025] dark:bg-white/[0.035] border-b border-border/50">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Date
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Time
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Opponent
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Set
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        PF
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        PA
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Diff
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Result
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        VOD
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {games.map((game) =>
                      game.sets.map((set, idx) => {
                        const result =
                          set.points_for === set.points_against
                            ? "T"
                            : set.points_for > set.points_against
                            ? "W"
                            : "L";

                        const difference =
                          set.points_for - set.points_against;

                        return (
                          <tr
                            key={`${game.id}-set-${set.set_no}`}
                            className="group/row border-b border-border/30 last:border-0 hover:bg-white/30 dark:hover:bg-white/[0.035] transition-colors"
                          >
                            <td className="px-5 py-4 whitespace-nowrap font-medium">
                              {formatDate(game.date)}
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                              {formatTime12H(game.time)}
                            </td>

                            <td className="px-5 py-4 font-semibold">
                              {game.opponent}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-xs font-bold">
                                {set.set_no}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="font-bold text-emerald-500">
                                {set.points_for}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="font-bold text-red-500">
                                {set.points_against}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span
                                className={`font-bold ${
                                  difference > 0
                                    ? "text-emerald-500"
                                    : difference < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {difference > 0 ? "+" : ""}
                                {difference}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <ResultBadge result={result} />
                            </td>

                            <td className="px-5 py-4 text-center">
                              {set.vod_link ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-full h-9 px-3 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.10]"
                                  onClick={() =>
                                    window.open(
                                      set.vod_link as string,
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                  title="Watch VOD"
                                >
                                  <PlayCircle className="h-4 w-4 mr-1.5" />
                                  <span className="hidden sm:inline">
                                    Watch
                                  </span>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground/40">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* ===================================================
            ROSTER HISTORY
        =================================================== */}

        <GlassPanel>
          <SectionHeader
            icon={<Users />}
            title="Roster History"
          />

          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Player movements and trades involving this team.
          </p>

          {trades.length === 0 ? (
            <EmptyState text="No roster changes or trades for this team yet." />
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => {
                const outgoingPlayers = trade.playersTraded.filter(
                  (pt) => pt.fromTeam === team.name
                );

                const incomingPlayers = trade.playersTraded.filter(
                  (pt) => pt.toTeam === team.name
                );

                return (
                  <div
                    key={trade.id}
                    className="overflow-hidden rounded-[28px] border border-border/50 bg-white/25 dark:bg-white/[0.035] backdrop-blur-2xl shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div
                      className="relative px-5 py-5 md:px-6 border-b border-border/40 overflow-hidden"
                      style={{
                        background: `linear-gradient(
                          100deg,
                          ${team.color}12 0%,
                          ${team.color2}12 100%
                        )`,
                      }}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{
                          background: `linear-gradient(
                            to bottom,
                            ${team.color},
                            ${team.color2}
                          )`,
                        }}
                      />

                      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="font-semibold tracking-tight">
                            {trade.description}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            Roster transaction
                          </div>
                        </div>

                        <span className="inline-flex w-fit rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                          {formatDate(trade.date)}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                      <TradeColumn
                        type="outgoing"
                        players={outgoingPlayers}
                      />

                      <TradeColumn
                        type="incoming"
                        players={incomingPlayers}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>
      </main>
    </div>
  );
};

/* ============================================================
   HERO MINI STAT
============================================================ */

const HeroMiniStat = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="text-center md:text-left">
    <div className="text-lg md:text-xl font-semibold text-white">
      {value}
    </div>

    <div className="mt-0.5 text-[10px] md:text-xs uppercase tracking-[0.12em] text-white/50">
      {label}
    </div>
  </div>
);

/* ============================================================
   GLASS PANEL
============================================================ */

const GlassPanel = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <section className="glass">
    <div className="p-5 md:p-7">
      {children}
    </div>
  </section>
);

/* ============================================================
   GLASS STAT CARD
============================================================ */

const GlassStatCard = ({
  title,
  icon,
  value,
  isplus_minus = false,
  accent,
}: {
  title: string;
  icon: JSX.Element;
  value: number | string;
  isplus_minus?: boolean;
  accent?: string;
}) => {
  const numeric =
    typeof value === "number"
      ? value
      : parseFloat(value);

  const color =
    numeric > 0
      ? "text-emerald-500"
      : numeric < 0
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <div className="glass-stat group relative overflow-hidden p-5 md:p-6 hover:-translate-y-0.5 transition-all duration-300">
      {accent && (
        <div
          className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-[35px] opacity-20 transition-opacity group-hover:opacity-35"
          style={{ backgroundColor: accent }}
        />
      )}

      <div className="relative">
        <div
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.035] dark:bg-white/[0.07] text-muted-foreground"
        >
          <div className="h-4.5 w-4.5">
            {icon}
          </div>
        </div>

        <div
          className={`text-2xl md:text-3xl font-semibold tracking-tight ${
            isplus_minus
              ? color
              : "text-foreground"
          }`}
        >
          {isplus_minus && numeric > 0 ? "+" : ""}
          {value}
        </div>

        <div className="text-xs md:text-sm text-muted-foreground mt-1.5">
          {title}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SECTION HEADER
============================================================ */

const SectionHeader = ({
  icon,
  title,
  count,
}: {
  icon: JSX.Element;
  title: string;
  count?: number;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] dark:bg-white/[0.07] text-muted-foreground">
      {icon}
    </div>

    <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
      {title}
    </h2>

    {count !== undefined && (
      <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        {count}
      </span>
    )}
  </div>
);

/* ============================================================
   SUMMARY ITEM
============================================================ */

const SummaryItem = ({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: number | string;
  color?: string;
}) => (
  <div className="relative p-5 md:p-6 text-center">
    <div
      className={`text-2xl md:text-3xl font-semibold tracking-tight ${color}`}
    >
      {value}
    </div>

    <div className="text-[10px] md:text-xs text-muted-foreground mt-1.5 uppercase tracking-[0.12em]">
      {label}
    </div>
  </div>
);

/* ============================================================
   RESULT BADGE
============================================================ */

const ResultBadge = ({
  result,
}: {
  result: "W" | "L" | "T";
}) => {
  const styles = {
    W: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
    L: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/15",
    T: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15",
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-9 px-3 py-1.5
        rounded-full
        text-xs font-bold
        border backdrop-blur-xl
        ${styles[result]}
      `}
    >
      {result}
    </span>
  );
};

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-[24px] border border-dashed border-border/60 bg-black/[0.015] dark:bg-white/[0.02] py-12 text-center">
    <div className="mx-auto mb-3 h-9 w-9 rounded-xl bg-black/[0.035] dark:bg-white/[0.06] flex items-center justify-center">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
    </div>

    <p className="text-sm text-muted-foreground">
      {text}
    </p>
  </div>
);

/* ============================================================
   TRADE COLUMN
============================================================ */

const TradeColumn = ({
  type,
  players,
}: {
  type: "outgoing" | "incoming";
  players: TradePlayer[];
}) => {
  const outgoing = type === "outgoing";

  return (
    <div className="p-5 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`
            h-9 w-9 rounded-xl flex items-center justify-center
            ${
              outgoing
                ? "bg-red-500/10 text-red-500"
                : "bg-emerald-500/10 text-emerald-500"
            }
          `}
        >
          {outgoing ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </div>

        <div>
          <h4 className="font-semibold tracking-tight">
            {outgoing ? "Outgoing" : "Incoming"}
          </h4>

          <p className="text-xs text-muted-foreground">
            {outgoing
              ? "Players leaving"
              : "Players joining"}
          </p>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="rounded-2xl border border-border/30 bg-black/[0.02] dark:bg-white/[0.025] px-4 py-4 text-sm text-muted-foreground">
          No {outgoing ? "outgoing" : "incoming"} players
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((pt, idx) => (
            <div
              key={`${type}-${idx}`}
              className="group/player flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-white/25 dark:bg-white/[0.025] px-4 py-3.5 hover:bg-white/50 dark:hover:bg-white/[0.055] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`
                    h-8 w-8 shrink-0 rounded-full
                    flex items-center justify-center
                    ${
                      outgoing
                        ? "bg-red-500/10 text-red-500"
                        : "bg-emerald-500/10 text-emerald-500"
                    }
                  `}
                >
                  {outgoing ? (
                    <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </div>

                <span className="font-medium truncate">
                  {pt.player.name}
                </span>
              </div>

              <span
                className="text-xs md:text-sm font-semibold text-right shrink-0"
                style={{
                  color: outgoing
                    ? pt.toColor
                    : pt.fromColor,
                }}
              >
                {outgoing
                  ? pt.toTeam
                  : pt.fromTeam}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
