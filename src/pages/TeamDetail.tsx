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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading team details...
          </p>
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error || "Team not found"}.
          </h1>

          <Link to="/teams">
            <Button>Back to Teams</Button>
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
    <div className="min-h-screen bg-background">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="relative isolate py-12 md:py-16 px-4 min-h-[300px] md:min-h-[370px] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${team.color} 0%, ${team.color2} 100%)`,
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{
            backgroundColor: "#ffffff",
          }}
        />

        <div
          className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{
            backgroundColor: "#ffffff",
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <Link
            to="/teams"
            className="inline-flex items-center text-primary-foreground/90 hover:text-primary-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8">
            {/* Team Logo */}

            <div className="shrink-0">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center p-4">
                <img
                  src={`/logos/${team.team_id}.png`}
                  alt={`${team.name} logo`}
                  className="w-full h-full object-contain drop-shadow-xl"
                  onError={(e) => {
                    (
                      e.target as HTMLImageElement
                    ).style.display = "none";
                  }}
                />
              </div>
            </div>

            {/* Team Info */}

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Badge className="bg-white/15 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                  TEAM PROFILE
                </Badge>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-3 tracking-tight">
                {team.name}
              </h1>

              <p className="text-base md:text-lg text-primary-foreground/85 mb-5">
                Captain:{" "}
                <span className="font-semibold text-primary-foreground">
                  {team.captain}
                </span>
              </p>

              <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                <Badge
                  variant="secondary"
                  className="text-base md:text-lg px-4 py-2 shadow-sm"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {team.wins}W - {team.losses}L
                </Badge>

                <Badge
                  variant="outline"
                  className="text-base md:text-lg px-4 py-2 bg-white/10 border-white/25 text-white backdrop-blur-sm"
                >
                  {winPercentage}% Win Rate
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12 space-y-8">

        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Points For"
            icon={<Trophy />}
            value={team.points_for}
          />

          <StatCard
            title="Team +/-"
            icon={<TrendingUp />}
            value={teamplus_minus}
            isplus_minus
          />

          <StatCard
            title="Total Games"
            icon={<Users />}
            value={teamGames}
          />

          <StatCard
            title="Team Average"
            icon={<Trophy />}
            value={teamAverage.toFixed(1)}
            isplus_minus
          />
        </div>

        {/* ===================================================
            QUICK TEAM SUMMARY
        =================================================== */}

        <Card className="bg-gradient-card shadow-card border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 md:grid-cols-4">
              <SummaryItem
                label="Wins"
                value={team.wins}
                color="text-green-600"
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
                    ? "text-green-600"
                    : pointDifferential < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* ===================================================
            ROSTER
        =================================================== */}

        <Card className="bg-gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Roster
              <Badge
                variant="secondary"
                className="ml-1"
              >
                {players.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {players.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No players currently listed.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={{
                      ...player,
                      isCaptain:
                        player.name === team.captain,
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===================================================
            MATCH HISTORY
        =================================================== */}

        <Card className="bg-gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Match History
              {games.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1"
                >
                  {games.length}
                </Badge>
              )}
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Set-by-set results and available game VODs.
            </p>
          </CardHeader>

          <CardContent>
            {games.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No games played yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/50">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">
                        Date
                      </th>

                      <th className="px-4 py-3 font-semibold text-muted-foreground">
                        Time
                      </th>

                      <th className="px-4 py-3 font-semibold text-muted-foreground">
                        Opponent
                      </th>

                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                        Set
                      </th>

                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                        PF
                      </th>

                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                        PA
                      </th>

                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                        Diff
                      </th>

                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                        Result
                      </th>

                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
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
                              border-b border-border/30
                              transition-colors
                              hover:bg-muted/30
                              ${
                                idx % 2 === 0
                                  ? "bg-muted/5"
                                  : "bg-transparent"
                              }
                            `}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              {formatDate(game.date)}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                              {formatTime12H(game.time)}
                            </td>

                            <td className="px-4 py-3 font-semibold">
                              {game.opponent}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-semibold">
                                {set.set_no}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center text-green-600 font-bold">
                              {set.points_for}
                            </td>

                            <td className="px-4 py-3 text-center text-red-500 font-bold">
                              {set.points_against}
                            </td>

                            <td
                              className={`px-4 py-3 text-center font-bold ${
                                difference > 0
                                  ? "text-green-600"
                                  : difference < 0
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {difference > 0
                                ? "+"
                                : ""}
                              {difference}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <Badge
                                className={`
                                  px-3 py-1 rounded-full
                                  text-xs font-bold border-0
                                  ${
                                    result === "W"
                                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                      : result === "L"
                                      ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                                  }
                                `}
                              >
                                {result}
                              </Badge>
                            </td>

                            <td className="px-4 py-3 text-center">
                              {set.vod_link ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="inline-flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                                  onClick={() =>
                                    window.open(
                                      set.vod_link as string,
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                  title="Watch VOD"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    Watch
                                  </span>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">
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
            )}
          </CardContent>
        </Card>

        {/* ===================================================
            ROSTER HISTORY
        =================================================== */}

        <Card className="bg-gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Roster History
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Player movements and trades involving this team.
            </p>
          </CardHeader>

          <CardContent>
            {trades.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No roster changes or trades for this team yet.
              </div>
            ) : (
              <div className="space-y-5">
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
                      className="rounded-2xl overflow-hidden border border-border/50 bg-background/40 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {/* Trade Header */}

                      <div
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                        style={{
                          background: `linear-gradient(90deg, ${team.color}12 0%, ${team.color2}12 100%)`,
                        }}
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {trade.description}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            Roster transaction
                          </div>
                        </div>

                        <Badge
                          variant="secondary"
                          className="w-fit"
                        >
                          {formatDate(trade.date)}
                        </Badge>
                      </div>

                      {/* Trade Content */}

                      <div className="grid md:grid-cols-2">
                        {/* OUTGOING */}

                        <div className="p-5 border-t md:border-t-0 md:border-r border-border/40">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                              <ArrowDown className="h-4 w-4 text-red-600" />
                            </div>

                            <div>
                              <h4 className="font-semibold text-foreground">
                                Outgoing
                              </h4>

                              <p className="text-xs text-muted-foreground">
                                Players leaving
                              </p>
                            </div>
                          </div>

                          {outgoingPlayers.length ===
                          0 ? (
                            <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                              No outgoing players
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {outgoingPlayers.map(
                                (pt, idx) => (
                                  <div
                                    key={`${trade.id}-out-${idx}`}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/25 hover:bg-muted/40 transition-colors px-4 py-3"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="h-8 w-8 shrink-0 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                                        <ArrowDown className="h-4 w-4 text-red-600" />
                                      </div>

                                      <span className="font-semibold truncate">
                                        {pt.player.name}
                                      </span>
                                    </div>

                                    <span
                                      className="text-sm font-medium text-right shrink-0"
                                      style={{
                                        color:
                                          pt.toColor,
                                      }}
                                    >
                                      {pt.toTeam}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {/* INCOMING */}

                        <div className="p-5 border-t border-border/40">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                              <ArrowUp className="h-4 w-4 text-green-600" />
                            </div>

                            <div>
                              <h4 className="font-semibold text-foreground">
                                Incoming
                              </h4>

                              <p className="text-xs text-muted-foreground">
                                Players joining
                              </p>
                            </div>
                          </div>

                          {incomingPlayers.length ===
                          0 ? (
                            <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                              No incoming players
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {incomingPlayers.map(
                                (pt, idx) => (
                                  <div
                                    key={`${trade.id}-in-${idx}`}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/25 hover:bg-muted/40 transition-colors px-4 py-3"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="h-8 w-8 shrink-0 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                                        <ArrowUp className="h-4 w-4 text-green-600" />
                                      </div>

                                      <span className="font-semibold truncate">
                                        {pt.player.name}
                                      </span>
                                    </div>

                                    <span
                                      className="text-sm font-medium text-right shrink-0"
                                      style={{
                                        color:
                                          pt.fromColor,
                                      }}
                                    >
                                      {pt.fromTeam}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ============================================================
   STAT CARD
============================================================ */

const StatCard = ({
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
      ? "text-green-600"
      : numeric < 0
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <Card className="bg-gradient-stats shadow-card border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-5 md:p-6 text-center">
        <div className="h-9 w-9 mx-auto mb-3 text-primary">
          {icon}
        </div>

        <div
          className={`text-2xl md:text-3xl font-bold text-card-foreground ${
            isplus_minus ? color : ""
          }`}
        >
          {isplus_minus && numeric > 0 ? "+" : ""}
          {value}
        </div>

        <div className="text-sm text-muted-foreground mt-1">
          {title}
        </div>
      </CardContent>
    </Card>
  );
};

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
}) => {
  return (
    <div className="p-5 text-center border-b md:border-b-0 md:border-r last:border-r-0 border-border/40">
      <div
        className={`text-2xl font-bold ${color}`}
      >
        {value}
      </div>

      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
};

export default TeamDetail;
