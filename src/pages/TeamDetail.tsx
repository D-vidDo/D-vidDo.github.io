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
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#050506] text-black dark:text-white overflow-hidden">
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full blur-[140px] opacity-[0.13]"
          style={{ backgroundColor: team.color }}
        />

        <div
          className="absolute top-1/3 -right-40 h-[550px] w-[550px] rounded-full blur-[160px] opacity-[0.10]"
          style={{ backgroundColor: team.color2 }}
        />

        <div
          className="absolute bottom-0 left-0 h-[450px] w-[450px] rounded-full blur-[150px] opacity-[0.06]"
          style={{ backgroundColor: team.color }}
        />
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative px-4 pt-5 md:pt-8">
        <div
          className="relative max-w-7xl mx-auto overflow-hidden rounded-[32px] md:rounded-[42px] border border-white/30 dark:border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.12)]"
          style={{
            background: `
              linear-gradient(
                135deg,
                ${team.color}f2 0%,
                ${team.color2}e8 100%
              )
            `,
          }}
        >
          {/* Glass highlight */}

          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-black/10 pointer-events-none" />

          <div className="absolute -top-40 -right-20 h-[500px] w-[500px] rounded-full bg-white/20 blur-[100px]" />

          <div className="absolute -bottom-60 -left-20 h-[500px] w-[500px] rounded-full bg-white/10 blur-[120px]" />

          <div className="relative px-6 py-7 md:px-12 md:py-10">
            <Link
              to="/teams"
              className="inline-flex items-center gap-2 text-white/75 hover:text-white text-sm font-medium transition-colors mb-10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Teams
            </Link>

            <div className="flex flex-col md:flex-row items-center md:items-end gap-7 md:gap-10">
              {/* Team Logo */}

              <div className="shrink-0">
                <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-[30px] md:rounded-[38px] bg-white/15 backdrop-blur-2xl border border-white/25 shadow-2xl flex items-center justify-center p-5">
                  <div className="absolute inset-2 rounded-[24px] md:rounded-[30px] border border-white/10" />

                  <img
                    src={`/logos/${team.team_id}.png`}
                    alt={`${team.name} logo`}
                    className="relative w-full h-full object-contain drop-shadow-2xl"
                    onError={(e) => {
                      (
                        e.target as HTMLImageElement
                      ).style.display = "none";
                    }}
                  />
                </div>
              </div>

              {/* Team Info */}

              <div className="text-center md:text-left flex-1">
                <div className="inline-flex items-center rounded-full bg-white/15 border border-white/20 backdrop-blur-xl px-3.5 py-1.5 mb-4">
                  <span className="text-[11px] font-semibold tracking-[0.16em] text-white/90">
                    TEAM PROFILE
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] text-white mb-3">
                  {team.name}
                </h1>

                <p className="text-base md:text-lg text-white/70 mb-6">
                  Captain{" "}
                  <span className="font-semibold text-white">
                    {team.captain}
                  </span>
                </p>

                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 backdrop-blur-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
                    <Trophy className="h-4 w-4" />
                    {team.wins}W – {team.losses}L
                  </div>

                  <div className="inline-flex items-center rounded-full bg-black/10 border border-white/20 backdrop-blur-xl px-4 py-2.5 text-sm font-semibold text-white">
                    {winPercentage}% Win Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-6 md:space-y-8">

        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          <GlassStatCard
            title="Points For"
            icon={<Trophy />}
            value={team.points_for}
          />

          <GlassStatCard
            title="Team +/-"
            icon={<TrendingUp />}
            value={teamplus_minus}
            isplus_minus
          />

          <GlassStatCard
            title="Total Games"
            icon={<Users />}
            value={teamGames}
          />

          <GlassStatCard
            title="Team Average"
            icon={<Trophy />}
            value={teamAverage.toFixed(1)}
            isplus_minus
          />
        </div>

        {/* ===================================================
            QUICK SUMMARY
        =================================================== */}

        <GlassPanel>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-black/5 dark:divide-white/10">
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
                  : "text-black/40 dark:text-white/40"
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

          <p className="text-sm text-black/45 dark:text-white/45 mb-6">
            Current players on the team.
          </p>

          {players.length === 0 ? (
            <EmptyState text="No players currently listed." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-[24px] overflow-hidden border border-black/5 dark:border-white/10 bg-white/35 dark:bg-white/[0.04] backdrop-blur-xl shadow-sm hover:shadow-xl hover:bg-white/50 dark:hover:bg-white/[0.07] transition-all duration-300"
                >
                  <PlayerCard
                    player={{
                      ...player,
                      isCaptain:
                        player.name === team.captain,
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

          <p className="text-sm text-black/45 dark:text-white/45 mb-6">
            Set-by-set results and available game VODs.
          </p>

          {games.length === 0 ? (
            <EmptyState text="No games played yet." />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-black/5 dark:border-white/10 bg-white/25 dark:bg-white/[0.025] backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-black/[0.025] dark:bg-white/[0.035] border-b border-black/5 dark:border-white/10">
                      <th className="px-5 py-4 font-medium text-black/45 dark:text-white/45">
                        Date
                      </th>

                      <th className="px-5 py-4 font-medium text-black/45 dark:text-white/45">
                        Time
                      </th>

                      <th className="px-5 py-4 font-medium text-black/45 dark:text-white/45">
                        Opponent
                      </th>

                      <th className="px-5 py-4 text-center font-medium text-black/45 dark:text-white/45">
                        Set
                      </th>

                      <th className="px-5 py-4 text-center font-medium text-black/45 dark:text-white/45">
                        PF
                      </th>

                      <th className="px-5 py-4 text-center font-medium text-black/45 dark:text-white/45">
                        PA
                      </th>

                      <th className="px-5 py-4 text-center font-medium text-black/45 dark:text-white/45">
                        Diff
                      </th>

                      <th className="px-5 py-4 text-center font-medium text-black/45 dark:text-white/45">
                        Result
                      </th>

                      <th className="px-5 py-4 text-center font-medium text-black/45 dark:text-white/45">
                        VOD
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {games.map((game) =>
                      game.sets.map((set, idx) => {
                        const result =
                          set.points_for ===
                          set.points_against
                            ? "T"
                            : set.points_for >
                              set.points_against
                            ? "W"
                            : "L";

                        const difference =
                          set.points_for -
                          set.points_against;

                        return (
                          <tr
                            key={`${game.id}-set-${set.set_no}`}
                            className={`
                              border-b border-black/5 dark:border-white/5
                              transition-colors
                              hover:bg-black/[0.025] dark:hover:bg-white/[0.035]
                              ${
                                idx % 2 === 0
                                  ? "bg-black/[0.01] dark:bg-white/[0.01]"
                                  : ""
                              }
                            `}
                          >
                            <td className="px-5 py-4 whitespace-nowrap">
                              {formatDate(game.date)}
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap text-black/45 dark:text-white/45">
                              {formatTime12H(game.time)}
                            </td>

                            <td className="px-5 py-4 font-semibold">
                              {game.opponent}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold">
                                {set.set_no}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center text-emerald-500 font-semibold">
                              {set.points_for}
                            </td>

                            <td className="px-5 py-4 text-center text-red-500 font-semibold">
                              {set.points_against}
                            </td>

                            <td
                              className={`px-5 py-4 text-center font-semibold ${
                                difference > 0
                                  ? "text-emerald-500"
                                  : difference < 0
                                  ? "text-red-500"
                                  : "text-black/40 dark:text-white/40"
                              }`}
                            >
                              {difference > 0
                                ? "+"
                                : ""}
                              {difference}
                            </td>

                            <td className="px-5 py-4 text-center">
                              <span
                                className={`
                                  inline-flex items-center justify-center
                                  min-w-9 px-3 py-1.5
                                  rounded-full
                                  text-xs font-semibold
                                  backdrop-blur-xl
                                  border
                                  ${
                                    result === "W"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15"
                                      : result === "L"
                                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/15"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15"
                                  }
                                `}
                              >
                                {result}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-center">
                              {set.vod_link ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-full h-9 px-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
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
                                <span className="text-black/25 dark:text-white/25">
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

          <p className="text-sm text-black/45 dark:text-white/45 mb-6">
            Player movements and trades involving this team.
          </p>

          {trades.length === 0 ? (
            <EmptyState text="No roster changes or trades for this team yet." />
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => {
                const outgoingPlayers =
                  trade.playersTraded.filter(
                    (pt) =>
                      pt.fromTeam === team.name
                  );

                const incomingPlayers =
                  trade.playersTraded.filter(
                    (pt) =>
                      pt.toTeam === team.name
                  );

                return (
                  <div
                    key={trade.id}
                    className="overflow-hidden rounded-[28px] border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/[0.035] backdrop-blur-2xl shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    {/* Trade Header */}

                    <div
                      className="px-5 py-5 md:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/5 dark:border-white/10"
                      style={{
                        background: `linear-gradient(90deg, ${team.color}10 0%, ${team.color2}10 100%)`,
                      }}
                    >
                      <div>
                        <div className="font-semibold tracking-tight">
                          {trade.description}
                        </div>

                        <div className="text-xs text-black/40 dark:text-white/40 mt-1">
                          Roster transaction
                        </div>
                      </div>

                      <span className="inline-flex w-fit rounded-full bg-black/5 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-black/55 dark:text-white/55">
                        {formatDate(trade.date)}
                      </span>
                    </div>

                    {/* Trade Content */}

                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/10">
                      {/* OUTGOING */}

                      <TradeColumn
                        type="outgoing"
                        players={outgoingPlayers}
                      />

                      {/* INCOMING */}

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
   GLASS PANEL
============================================================ */

const GlassPanel = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <section className="rounded-[30px] md:rounded-[34px] border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/[0.045] backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-5 md:p-7">
        {children}
      </div>
    </section>
  );
};

/* ============================================================
   GLASS STAT CARD
============================================================ */

const GlassStatCard = ({
  title,
  icon,
  value,
  isplus_minus = false,
}: {
  title: string;
  icon: JSX.Element;
  value: number | string;
  isplus_minus?: boolean;
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
      : "text-black/35 dark:text-white/35";

  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/[0.045] backdrop-blur-2xl p-5 md:p-6 shadow-[0_8px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/[0.06] pointer-events-none" />

      <div className="relative">
        <div className="h-9 w-9 mb-4 text-black/40 dark:text-white/40">
          {icon}
        </div>

        <div
          className={`text-2xl md:text-3xl font-semibold tracking-tight ${
            isplus_minus
              ? color
              : "text-black dark:text-white"
          }`}
        >
          {isplus_minus && numeric > 0 ? "+" : ""}
          {value}
        </div>

        <div className="text-xs md:text-sm text-black/40 dark:text-white/40 mt-1.5">
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
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.07] flex items-center justify-center text-black/55 dark:text-white/60">
        {icon}
      </div>

      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
        {title}
      </h2>

      {count !== undefined && (
        <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-black/45 dark:text-white/45">
          {count}
        </span>
      )}
    </div>
  );
};

/* ============================================================
   SUMMARY ITEM
============================================================ */

const SummaryItem = ({
  label,
  value,
  color = "text-black dark:text-white",
}: {
  label: string;
  value: number | string;
  color?: string;
}) => {
  return (
    <div className="p-5 md:p-6 text-center">
      <div
        className={`text-2xl md:text-3xl font-semibold tracking-tight ${color}`}
      >
        {value}
      </div>

      <div className="text-[10px] md:text-xs text-black/40 dark:text-white/40 mt-1.5 uppercase tracking-[0.12em]">
        {label}
      </div>
    </div>
  );
};

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = ({ text }: { text: string }) => {
  return (
    <div className="rounded-[24px] border border-dashed border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02] py-12 text-center">
      <p className="text-sm text-black/40 dark:text-white/40">
        {text}
      </p>
    </div>
  );
};

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

          <p className="text-xs text-black/40 dark:text-white/40">
            {outgoing
              ? "Players leaving"
              : "Players joining"}
          </p>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="rounded-2xl bg-black/[0.025] dark:bg-white/[0.035] px-4 py-4 text-sm text-black/35 dark:text-white/35">
          No {outgoing ? "outgoing" : "incoming"} players
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((pt, idx) => (
            <div
              key={`${type}-${idx}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 dark:border-white/5 bg-white/30 dark:bg-white/[0.025] px-4 py-3.5 hover:bg-white/55 dark:hover:bg-white/[0.05] transition-colors"
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
                className="text-sm font-medium text-right shrink-0"
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
