import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp, Users, CalendarDays, PlayCircle } from "lucide-react";
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
}

interface TradePlayer {
  player: { name: string };
  fromTeam: string;
  toTeam: string;
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

useEffect(() => {
  async function fetchTeamData() {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Fetch the main team
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", teamId)
        .single();

      if (!teamData) throw new Error("Team not found");

      setTeam(teamData);

      // 2️⃣ Fetch players
      const { data: playersData } = await supabase
        .from("players_public")
        .select("*")
        .in("id", teamData.player_ids ?? []);

      setPlayers(playersData ?? []);

      // 3️⃣ Fetch games
      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select(`
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
        `)
        .eq("team_id", teamId)
        .order("date", { ascending: true })
        .order("time", { ascending: false, nullsFirst: false })
        .order("set_no", { foreignTable: "sets", ascending: true });

      if (gameErr) throw gameErr;

      const playedGames = (gameData ?? [])
        .filter((g) => g.sets && g.sets.length > 0)
        .map((g) => {
          const orderedSets = [...g.sets].sort((a, b) => (a.set_no ?? 0) - (b.set_no ?? 0));
          const totalPF = orderedSets.reduce((sum, s) => sum + s.points_for, 0);
          const totalPA = orderedSets.reduce((sum, s) => sum + s.points_against, 0);
          const result: "W" | "L" | "T" = totalPF > totalPA ? "W" : totalPF < totalPA ? "L" : "T";

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
        .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

      setGames(playedGames);

      // 4️⃣ Fetch trades involving this team
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
            name
          )
        `)
        .or(`to_team.eq.${teamData.name},from_team.eq.${teamData.name}`)
        .order("created_at", { ascending: false });

      // 5️⃣ Get unique team names in trades to fetch colors
      const tradeTeamNames = Array.from(
        new Set((tradeRows ?? []).flatMap((row: any) => [row.from_team, row.to_team]))
      );

      const { data: teamsData } = await supabase
        .from("teams")
        .select("name,color,color2")
        .in("name", tradeTeamNames);

      // Map of teamName → color
      const teamColorsMap: Record<string, string> = {};
      (teamsData ?? []).forEach((t: any) => {
        teamColorsMap[t.name] = t.color;
      });

      // 6️⃣ Organize trades
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

      // Attach team colors to trades for easy use in JSX
      const tradesWithColors = Object.values(tradeMap).map((trade) => ({
        ...trade,
        playersTraded: trade.playersTraded.map((pt) => ({
          ...pt,
          fromColor: teamColorsMap[pt.fromTeam] ?? "#000000",
          toColor: teamColorsMap[pt.toTeam] ?? "#000000",
        })),
      }));

      setTrades(tradesWithColors);
    } catch (err) {
      setError("Unexpected error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  fetchTeamData();
}, [teamId]);


  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading team details...
      </div>
    );

  if (error || !team)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Team not found"}.</h1>
          <Link to="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );

  const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);
  const teamplus_minus = players.reduce((sum, p) => sum + (p.plus_minus || 0), 0);
  const teamGames = players.reduce((sum, p) => sum + (p.games_played || 0), 0);
  const teamAverage = teamGames > 0 ? parseFloat((teamplus_minus / teamGames).toFixed(1)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative isolate py-16 px-4 min-h-[280px] md:min-h-[360px] rounded-none"
        style={{
          background: `linear-gradient(135deg, ${team.color} 0%, ${team.color2} 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <Link
            to="/teams"
            className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Teams
          </Link>
          <div className="flex items-center space-x-6">
            <img
              src={`/logos/${team.team_id}.png`}
              alt={`${team.name} logo`}
              className="w-48 h-48 rounded-xl object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <h1 className="text-5xl font-bold text-primary-foreground mb-2">{team.name}</h1>
              <p className="text-lg text-primary-foreground/90 mb-4">Captain: {team.captain}</p>
              <div className="flex gap-3 flex-wrap">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {team.wins}W - {team.losses}L
                </Badge>
                <Badge
                  variant="outline"
                  className="text-lg px-4 py-2 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground"
                >
                  {winPercentage}% Win Rate
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard title="Points For" icon={<Trophy />} value={team.points_for} />
          <StatCard title="Team +/-" icon={<TrendingUp />} value={teamplus_minus} isplus_minus />
          <StatCard title="Total Games" icon={<Users />} value={teamGames} />
          <StatCard title="Team Average" icon={<Trophy />} value={teamAverage.toFixed(1)} isplus_minus />
        </div>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Team Roster ({players.length} players)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((player) => (
                <PlayerCard key={player.id} player={{ ...player, isCaptain: player.name === team.captain }} />
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
    {trades.length === 0 ? (
      <div className="text-muted-foreground text-center py-4">
        No roster changes or trades for this team yet.
      </div>
    ) : (
      <div className="space-y-6">
        {trades.map((trade) => {
          const outgoingPlayers = trade.playersTraded.filter(pt => pt.fromTeam === team.name);
          const incomingPlayers = trade.playersTraded.filter(pt => pt.toTeam === team.name);

          return (
            <div
              key={trade.id}
              className="rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{
                borderColor: team.color + "55",
                background: `linear-gradient(90deg, ${team.color}10 0%, ${team.color2}10 100%)`,
              }}
            >
              {/* Trade header */}
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-black">{trade.description}</span>
                <span className="text-xs text-muted-foreground">{new Date(trade.date).toLocaleDateString()}</span>
              </div>

              {/* Players grid: Outgoing vs Incoming */}
              <div className="grid grid-cols-2 divide-x">
                {/* Outgoing */}
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold mb-2">Outgoing</h4>
                  {outgoingPlayers.length === 0 ? (
                    <div className="text-sm text-black/50">—</div>
                  ) : (
                    outgoingPlayers.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 border-b border-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-bold" title="Outgoing">↓</span>
                          <span className="font-bold text-black">{pt.player.name}</span>
                        </div>
<span
  className="text-sm font-medium"
  style={{ color: pt.toColor }}
>
  {pt.toTeam}
</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Incoming */}
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold mb-2">Incoming</h4>
                  {incomingPlayers.length === 0 ? (
                    <div className="text-sm text-black/50">—</div>
                  ) : (
                    incomingPlayers.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 border-b border-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-bold" title="Incoming">↑</span>
                          <span className="font-bold text-black">{pt.player.name}</span>
                        </div>
<span
  className="text-sm font-medium"
  style={{ color: pt.fromColor }}
>
  {pt.fromTeam}
</span>
                      </div>
                    ))
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
  const numeric = typeof value === "number" ? value : parseFloat(value);
  const color = numeric > 0 ? "text-green-600" : numeric < 0 ? "text-red-500" : "text-muted-foreground";
  return (
    <Card className="bg-gradient-stats shadow-card">
      <CardContent className="p-6 text-center">
        <div className="h-8 w-8 mx-auto mb-2 text-primary">{icon}</div>
        <div className={`text-2xl font-bold text-card-foreground ${isplus_minus ? color : ""}`}>
          {isplus_minus && numeric > 0 ? "+" : ""}
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
};

export default TeamDetail;
