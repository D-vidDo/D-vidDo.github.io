// TeamDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  Trophy,
  TrendingUp,
  Users,
  CalendarDays,
  PlayCircle,
} from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";

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
  position?: string;
}

interface TradePlayer {
  player: { name: string; position?: string };
  fromTeam: string;
  toTeam: string;
}

interface Trade {
  id: number;
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

const formatTime12H = (time: string) => {
  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute} ${suffix}`;
};

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optional: team color map for trades
  const [teamColorMap, setTeamColorMap] = useState<Record<string, string>>({});
  const getTeamColor = (teamName: string) => teamColorMap[teamName] || "#6b7280";

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1️⃣ Fetch team
        const { data: teamData, error: teamErr } = await supabase
          .from("teams")
          .select("*")
          .eq("team_id", teamId)
          .single();
        if (teamErr || !teamData) throw teamErr || new Error("Team not found");
        setTeam(teamData);

        // 2️⃣ Fetch players
        const { data: playersData } = await supabase
          .from("players_public")
          .select("*")
          .in("id", teamData.player_ids ?? []);
        setPlayers(playersData ?? []);

        // 3️⃣ Fetch games + sets
        const { data: gameData, error: gameErr } = await supabase
          .from("games")
          .select(`
            id,
            date,
            time,
            opponent,
            sets (
              set_no,
              points_for,
              points_against,
              vod_link
            )
          `)
          .eq("team_id", teamId)
          .order("date", { ascending: true })
          .order("time", { ascending: false });
        if (gameErr) throw gameErr;

        const playedGames: Game[] = (gameData ?? [])
          .filter((g) => g.sets?.length > 0)
          .map((g) => {
            const orderedSets = [...g.sets].sort((a, b) => a.set_no - b.set_no);
            const totalPF = orderedSets.reduce((sum, s) => sum + s.points_for, 0);
            const totalPA = orderedSets.reduce((sum, s) => sum + s.points_against, 0);
            const result: "W" | "L" | "T" = totalPF > totalPA ? "W" : totalPF < totalPA ? "L" : "T";

            return {
              id: String(g.id),
              date: g.date,
              time: g.time,
              opponent: g.opponent,
              points_for: totalPF,
              points_against: totalPA,
              result,
              sets: orderedSets,
            };
          });
        setGames(playedGames);

        // 4️⃣ Fetch trades for this team
        const { data: tradeRows } = await supabase
          .from("players_traded")
          .select(`
            from_team,
            to_team,
            trades (
              id,
              date,
              description
            ),
            player:player_id (
              id,
              name,
              position
            )
          `)
          .or(`to_team.eq.${teamData.name},from_team.eq.${teamData.name}`)
          .order("created_at", { ascending: false });

        const tradeMap: Record<string, Trade> = {};
        (tradeRows ?? []).forEach((row: any) => {
          const tradeId = row.trades.id;
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
          });
        });
        setTrades(Object.values(tradeMap));

      } catch (err) {
        setError("Unexpected error: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading team details...
      </div>
    );

  if (error || !team)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Team not found"}</h1>
          <Link to="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );

  // Stats
  const teamplus_minus = players.reduce((sum, p) => sum + (p.plus_minus || 0), 0);
  const teamGames = players.reduce((sum, p) => sum + (p.games_played || 0), 0);
  const teamAverage = teamGames > 0 ? parseFloat((teamplus_minus / teamGames).toFixed(1)) : 0;
  const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header section */}
      <section
        className="py-16 px-4 min-h-[280px] md:min-h-[360px]"
        style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color2})` }}
      >
        <div className="max-w-6xl mx-auto">
          <Link to="/teams" className="inline-flex items-center mb-6 text-primary-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teams
          </Link>
          <div className="flex items-center space-x-6">
            <img
              src={`/logos/${team.team_id}.png`}
              alt={`${team.name} logo`}
              className="w-48 h-48 object-contain rounded-xl"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
            <div>
              <h1 className="text-5xl font-bold text-primary-foreground mb-2">{team.name}</h1>
              <p className="text-lg text-primary-foreground/90 mb-4">Captain: {team.captain}</p>
              <div className="flex gap-3 flex-wrap">
                <Badge variant="secondary">{team.wins}W - {team.losses}L</Badge>
                <Badge variant="outline">{winPercentage}% Win Rate</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Stat cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard title="Points For" icon={<Trophy />} value={team.points_for} />
          <StatCard title="Team +/-" icon={<TrendingUp />} value={teamplus_minus} isplus_minus />
          <StatCard title="Total Games" icon={<Users />} value={teamGames} />
          <StatCard title="Team Average" icon={<Trophy />} value={teamAverage} isplus_minus />
        </div>

        {/* Players roster */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Team Roster ({players.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((p) => (
                <PlayerCard key={p.id} player={{ ...p, isCaptain: p.name === team.captain }} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Match History (Set-by-Set)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">No games played yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Opponent</th>
                      <th className="px-4 py-2 text-center">Set</th>
                      <th className="px-4 py-2 text-center">PF</th>
                      <th className="px-4 py-2 text-center">PA</th>
                      <th className="px-4 py-2 text-center">Diff</th>
                      <th className="px-4 py-2 text-center">Result</th>
                      <th className="px-4 py-2 text-center">VOD</th> {/* 👈 new column */}
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

                        return (
                          <tr key={`${game.id}-set-${set.set_no}`} className={idx % 2 === 0 ? "bg-muted/10" : ""}>
                            <td className="px-4 py-2">{game.date}</td>
                            <td className="px-4 py-2">{formatTime12H(game.time)}</td> {/* 👈 Formatted time */}
                            <td className="px-4 py-2 font-semibold">{game.opponent}</td>
                            <td className="px-4 py-2 text-center">{set.set_no}</td>
                            <td className="px-4 py-2 text-center text-green-700 font-bold">{set.points_for}</td>
                            <td className="px-4 py-2 text-center text-red-600 font-bold">{set.points_against}</td>
                            <td className="px-4 py-2 text-center font-semibold">
  {set.points_for - set.points_against}
</td>
                            <td className="px-4 py-2 text-center">
                              <Badge
                                className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  result === "W"
                                    ? "bg-green-100 text-green-700"
                                    : result === "L"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {result}
                              </Badge>
                            </td>

                            {/* VOD cell with brand-colored button */}
                            <td className="px-4 py-2 text-center">
                              {set.vod_link ? (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                  onClick={() =>
                                    window.open(set.vod_link as string, "_blank", "noopener,noreferrer")
                                  }
                                  title="Watch VOD"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                  Watch
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
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

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Roster History
            </CardTitle>
          </CardHeader>
<CardContent>
<div className="space-y-6">
  {trades
    .filter((trade) =>
      trade.playersTraded.some(
        (pt) => pt.from_team === team.name || pt.to_team === team.name
      )
    )
    .map((trade) => (
      <Card key={trade.id} className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Trade Record
            </CardTitle>

            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(trade.date).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-card-foreground font-medium">
              {trade.description}
            </p>
          </div>

          <div className="space-y-3">

            {trade.playersTraded
              .filter(
                (pt) =>
                  pt.from_team === team.name || pt.to_team === team.name
              )
              .map((pt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gradient-stats rounded-lg"
                >
                  <div className="text-left">
                    <div className="font-semibold text-card-foreground">
                      {pt.player.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pt.player.position}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">

                    <span
                      style={{
                        color: getTeamColor(pt.from_team),
                        fontWeight: "bold",
                      }}
                    >
                      {pt.from_team}
                    </span>

                    <span className="mx-1">→</span>

                    <span
                      style={{
                        color: getTeamColor(pt.to_team),
                        fontWeight: "bold",
                      }}
                    >
                      {pt.to_team}
                    </span>

                  </div>
                </div>
              ))}

          </div>
        </CardContent>
      </Card>
    ))}
</div>
</CardContent>
        </Card>
      </div>
    </div>
  );
};

// StatCard
const StatCard = ({ title, icon, value, isplus_minus = false }: { title: string; icon: JSX.Element; value: number; isplus_minus?: boolean }) => {
  const colorClass = isplus_minus
    ? value > 0
      ? "text-green-600"
      : value < 0
      ? "text-red-500"
      : "text-muted-foreground"
    : "";
  return (
    <Card>
      <CardContent className="text-center">
        <div className="mx-auto mb-2 w-8 h-8 text-primary">{icon}</div>
        <div className={`text-2xl font-bold ${colorClass}`}>{isplus_minus && value > 0 ? "+" : ""}{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
};

export default TeamDetail;