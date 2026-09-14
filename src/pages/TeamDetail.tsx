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
  ArrowUpRight,
  ArrowDownRight,
  Swords,
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
  player: { name: string };
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

        const { data: teamData, error: teamErr } = await supabase
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

        const { data: playersData, error: playersErr } = await supabase
          .from("players_public")
          .select("*")
          .in("id", teamData.player_ids ?? []);

        if (playersErr) throw playersErr;

        setPlayers(playersData ?? []);

        /* ================= GAMES ================= */

        const { data: gameData, error: gameErr } = await supabase
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
              new Date(`${a.date}T${a.time ?? "00:00:00"}`).getTime() -
              new Date(`${b.date}T${b.time ?? "00:00:00"}`).getTime()
          );

        setGames(playedGames);

        /* ================= TRADES ================= */

        const { data: tradeRows, error: tradeErr } = await supabase
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

        if (tradeErr) {
          console.warn("Trade history could not be loaded:", tradeErr);
        }

        /* ================= TRADE TEAM COLORS ================= */

        const tradeTeamNames = Array.from(
          new Set(
            (tradeRows ?? []).flatMap((row: any) => [
              row.from_team,
              row.to_team,
            ])
          )
        );

        let teamsData: any[] = [];

        if (tradeTeamNames.length > 0) {
          const { data } = await supabase
            .from("teams")
            .select("name,color,color2")
            .in("name", tradeTeamNames);

          teamsData = data ?? [];
        }

        const teamColorsMap: Record<string, string> = {};

        teamsData.forEach((t: any) => {
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
            fromColor: teamColorsMap[row.from_team] ?? "#64748b",
            toColor: teamColorsMap[row.to_team] ?? "#64748b",
          });
        });

        setTrades(Object.values(tradeMap));
      } catch (err) {
        setError(
          "Unexpected error: " +
            ((err as Error)?.message || "Something went wrong")
        );
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
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
          <div className="text-6xl mb-4">🏒</div>

          <h1 className="text-2xl font-bold mb-4">
            {error || "Team not found"}.
          </h1>

          <Link to="/teams">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ================= CALCULATIONS ================= */

  const totalGames = team.wins + team.losses;

  const winPercentage =
    totalGames > 0
      ? ((team.wins / totalGames) * 100).toFixed(1)
      : "0.0";

  const pointDifferential =
    (team.points_for ?? 0) - (team.points_against ?? 0);

  const teamPlusMinus = players.reduce(
    (sum, player) => sum + (player.plus_minus || 0),
    0
  );

  const teamGames = players.reduce(
    (sum, player) => sum + (player.games_played || 0),
    0
  );

  const teamAverage =
    teamGames > 0
      ? parseFloat((teamPlusMinus / teamGames).toFixed(1))
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ================= HERO ================= */}

      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${team.color} 0%, ${team.color2} 100%)`,
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            backgroundColor: "#ffffff",
          }}
        />

        <div
          className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            backgroundColor: "#ffffff",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
          {/* Back button */}

          <Link
            to="/teams"
            className="inline-flex items-center text-primary-foreground/90 hover:text-primary-foreground mb-10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Link>

          {/* Team identity */}

          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Logo */}

            <div className="shrink-0">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center p-5">
                <img
                  src={`/logos/${team.team_id}.png`}
                  alt={`${team.name} logo`}
                  className="w-full h-full object-contain drop-shadow-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              </div>
            </div>

            {/* Team info */}

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">
                  <Swords className="h-3.5 w-3.5 mr-1.5" />
                  NCL Team
                </Badge>

                {team.wins > team.losses && (
                  <Badge className="bg-white text-black">
                    <Trophy className="h-3.5 w-3.5 mr-1.5" />
                    Winning Record
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-3">
                {team.name}
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-6">
                Captain:{" "}
                <span className="font-semibold text-white">
                  {team.captain}
                </span>
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="px-5 py-2.5 rounded-full bg-white text-black font-bold shadow-lg">
                  {team.wins}W - {team.losses}L
                </div>

                <div className="px-5 py-2.5 rounded-full bg-black/15 text-white border border-white/20 backdrop-blur-sm font-semibold">
                  {winPercentage}% Win Rate
                </div>

                <div
                  className={`px-5 py-2.5 rounded-full border border-white/20 backdrop-blur-sm font-semibold ${
                    pointDifferential > 0
                      ? "bg-green-500/20 text-white"
                      : pointDifferential < 0
                      ? "bg-red-500/20 text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {pointDifferential > 0 ? "+" : ""}
                  {pointDifferential} Diff
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTENT ================= */}

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12 space-y-10">
        {/* ================= STATS ================= */}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Points For"
            icon={<Trophy />}
            value={team.points_for}
            accent="primary"
          />

          <StatCard
            title="Team +/-"
            icon={<TrendingUp />}
            value={teamPlusMinus}
            isPlusMinus
            accent="green"
          />

          <StatCard
            title="Total Games"
            icon={<Users />}
            value={teamGames}
            accent="blue"
          />

          <StatCard
            title="Team Average"
            icon={<TrendingUp />}
            value={teamAverage.toFixed(1)}
            isPlusMinus
            accent="purple"
          />
        </section>

        {/* ================= ROSTER ================= */}

        <Card className="bg-gradient-card shadow-card border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>

              Team Roster

              <Badge variant="secondary" className="ml-1">
                {players.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No players on this roster yet.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={{
                      ...player,
                      isCaptain: player.name === team.captain,
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================= MATCH HISTORY ================= */}

        <Card className="bg-gradient-card shadow-card border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>

              Match History

              <Badge variant="secondary" className="ml-1">
                Set-by-Set
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {games.length === 0 ? (
              <div className="text-muted-foreground text-center py-12">
                No games played yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-4 text-left font-semibold text-muted-foreground">
                        Date
                      </th>

                      <th className="px-4 py-4 text-left font-semibold text-muted-foreground">
                        Time
                      </th>

                      <th className="px-4 py-4 text-left font-semibold text-muted-foreground">
                        Opponent
                      </th>

                      <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
                        Set
                      </th>

                      <th className="px-4 py-4 text-center font-semibold text-green-600">
                        PF
                      </th>

                      <th className="px-4 py-4 text-center font-semibold text-red-500">
                        PA
                      </th>

                      <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
                        Diff
                      </th>

                      <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
                        Result
                      </th>

                      <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
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

                        const diff =
                          set.points_for - set.points_against;

                        return (
                          <tr
                            key={`${game.id}-set-${set.set_no}`}
                            className={`
                              border-b border-border/40
                              transition-colors
                              hover:bg-muted/40
                              ${
                                idx % 2 === 0
                                  ? "bg-muted/10"
                                  : ""
                              }
                            `}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              {formatDate(game.date)}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                              {formatTime12H(game.time)}
                            </td>

                            <td className="px-4 py-3 font-semibold whitespace-nowrap">
                              {game.opponent}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-muted text-xs font-bold">
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
                                diff > 0
                                  ? "text-green-600"
                                  : diff < 0
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {diff > 0 ? "+" : ""}
                              {diff}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <Badge
                                className={`
                                  px-3 py-1 rounded-full text-xs font-bold border
                                  ${
                                    result === "W"
                                      ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900"
                                      : result === "L"
                                      ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
                                      : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900"
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
                                  className="inline-flex items-center gap-1.5 shadow-sm"
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

        {/* ================= ROSTER HISTORY ================= */}

        <Card className="bg-gradient-card shadow-card border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>

              Roster History
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {trades.length === 0 ? (
              <div className="text-muted-foreground text-center py-10">
                No roster changes or trades for this team yet.
              </div>
            ) : (
              <div className="space-y-6">
                {trades.map((trade) => {
                  const outgoingPlayers =
                    trade.playersTraded.filter(
                      (pt) => pt.fromTeam === team.name
                    );

                  const incomingPlayers =
                    trade.playersTraded.filter(
                      (pt) => pt.toTeam === team.name
                    );

                  return (
                    <div
                      key={trade.id}
                      className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all"
                      style={{
                        borderColor: `${team.color}55`,
                        background: `linear-gradient(135deg, ${team.color}08 0%, ${team.color2}08 100%)`,
                      }}
                    >
                      {/* Trade header */}

                      <div
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b"
                        style={{
                          background: `linear-gradient(90deg, ${team.color}15 0%, ${team.color2}15 100%)`,
                          borderColor: `${team.color}20`,
                        }}
                      >
                        <div>
                          <div className="font-bold text-base">
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

                      {/* Players */}

                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                        {/* Outgoing */}

                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-950/40">
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            </div>

                            <h4 className="font-bold">
                              Outgoing
                            </h4>

                            {outgoingPlayers.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {outgoingPlayers.length}
                              </Badge>
                            )}
                          </div>

                          {outgoingPlayers.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-3">
                              No players sent out.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {outgoingPlayers.map((pt, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                                    </div>

                                    <span className="font-semibold truncate">
                                      {pt.player.name}
                                    </span>
                                  </div>

                                  <span
                                    className="text-sm font-semibold whitespace-nowrap"
                                    style={{
                                      color:
                                        pt.toColor ??
                                        "#64748b",
                                    }}
                                  >
                                    {pt.toTeam}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Incoming */}

                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-950/40">
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                            </div>

                            <h4 className="font-bold">
                              Incoming
                            </h4>

                            {incomingPlayers.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {incomingPlayers.length}
                              </Badge>
                            )}
                          </div>

                          {incomingPlayers.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-3">
                              No players received.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {incomingPlayers.map((pt, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-950/40"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center shrink-0">
                                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    </div>

                                    <span className="font-semibold truncate">
                                      {pt.player.name}
                                    </span>
                                  </div>

                                  <span
                                    className="text-sm font-semibold whitespace-nowrap"
                                    style={{
                                      color:
                                        pt.fromColor ??
                                        "#64748b",
                                    }}
                                  >
                                    {pt.fromTeam}
                                  </span>
                                </div>
                              ))}
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

/* ================= STAT CARD ================= */

const StatCard = ({
  title,
  icon,
  value,
  isPlusMinus = false,
  accent = "primary",
}: {
  title: string;
  icon: JSX.Element;
  value: number | string;
  isPlusMinus?: boolean;
  accent?: "primary" | "green" | "blue" | "purple";
}) => {
  const numeric =
    typeof value === "number" ? value : parseFloat(value);

  const color =
    numeric > 0
      ? "text-green-600"
      : numeric < 0
      ? "text-red-500"
      : "text-muted-foreground";

  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-600 dark:bg-green-950/40",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-950/40",
  };

  return (
    <Card className="bg-gradient-stats shadow-card border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-5 md:p-6 text-center">
        <div
          className={`h-10 w-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${accentClasses[accent]}`}
        >
          {icon}
        </div>

        <div
          className={`text-2xl md:text-3xl font-black ${
            isPlusMinus ? color : "text-card-foreground"
          }`}
        >
          {isPlusMinus && numeric > 0 ? "+" : ""}
          {value}
        </div>

        <div className="text-sm text-muted-foreground mt-1">
          {title}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamDetail;
