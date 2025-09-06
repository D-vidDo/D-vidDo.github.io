import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp, Users, CalendarDays } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  plus_minus: number;
  games_played: number;
}

interface Game {
  id: string;
  date: string;
  opponent: string;
  points_for: number;
  points_against: number;
  result: "W" | "L" | "T";
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
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("*")
          .eq("team_id", teamId)
          .single();

        if (teamError || !teamData) {
          setError("Team not found");
          setLoading(false);
          return;
        }
        setTeam(teamData);

        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("*")
          .in("id", teamData.player_ids ?? []);

        if (playersError) {
          setError("Failed to load players");
          setLoading(false);
          return;
        }
        setPlayers(playersData ?? []);

        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select(`
            id,
            date,
            opponent,
            team_id,
            sets (
              points_for,
              points_against
            )
          `)
          .eq("team_id", teamId);

        if (gameError) {
          setError("Failed to load games");
          setLoading(false);
          return;
        }

        const playedGames = (gameData ?? [])
          .filter((g) => g.sets && g.sets.length > 0)
          .map((g) => {
            const totalPF = g.sets.reduce((sum, s) => sum + s.points_for, 0);
            const totalPA = g.sets.reduce((sum, s) => sum + s.points_against, 0);
            const result = totalPF > totalPA ? "W" : totalPF < totalPA ? "L" : "T";

            return {
              id: g.id,
              date: g.date,
              opponent: g.opponent,
              points_for: totalPF,
              points_against: totalPA,
              result,
            };
          });

        setGames(playedGames);

        const { data: tradesData, error: tradesError } = await supabase
          .from("trades")
          .select("id, date, description")
          .order("date", { ascending: false });

        if (tradesError) {
          setError("Failed to load trades");
          setLoading(false);
          return;
        }

        const tradesWithPlayers = await Promise.all(
          (tradesData ?? []).map(async (trade) => {
            const { data: playersTradedData, error: playersTradedError } = await supabase
              .from("players_traded")
              .select(`
                from_team,
                to_team,
                player:player_id (
                  id,
                  name
                )
              `)
              .eq("trade_id", trade.id);

            if (playersTradedError) {
              setError(`Failed to load players traded for trade ${trade.id}: ${playersTradedError.message}`);
              setLoading(false);
              return null;
            }

            return {
              id: trade.id,
              date: trade.date,
              description: trade.description,
              playersTraded: playersTradedData ?? [],
            };
          })
        );

        const filteredTrades = tradesWithPlayers.filter(Boolean) as Trade[];

        const teamTrades = filteredTrades.filter((trade) =>
          trade.playersTraded.some(
            (pt) => pt.toTeam === teamData.name || pt.fromTeam === teamData.name
          )
        );

        setTrades(teamTrades);
      } catch (err) {
        setError("Unexpected error: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading team details...</div>;
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Team not found"}</h1>
          <Link to="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <Link to="/teams" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Teams
          </Link>
          <div className="flex items-center space-x-6">
            <img
              src={`/logos/${team.team_id}.jpg`}
              alt={`${team.name} logo`}
              className="w-24 h-24 rounded-xl object-contain shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <h1 className="text-5xl font-bold text-primary-foreground mb-2">{team.name}</h1>
              <p className="text-lg text-primary-foreground/90 mb-4">Captain: {team.captain}</p>
              <div className="flex gap-3 flex-wrap">
                <Badge variant="secondary" className="text-lg px-4 py-2">{team.wins}W - {team.losses}L</Badge>
                <Badge variant="outline" className="text-lg px-4 py-2 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground">{winPercentage}% Win Rate</Badge>
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
              <CalendarDays className="h-5 w-5 text-primary" /> Match History
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
                      <th className="px-4 py-2 text-muted-foreground font-medium">Date</th>
                      <th className="px-4 py-2 text-muted-foreground font-medium">Opponent</th>
                      <th className="px-4 py-2 text-muted-foreground font-medium">Score</th>
                      <th className="px-4 py-2 text-muted-foreground font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game, index) => (
                      <tr key={game.id} className={index % 2 === 0 ? "bg-muted/10" : ""}>
                        <td className="px-4 py-2">{game.date}</td>
                        <td className="px-4 py-2">{game.opponent}</td>
                        <td className="px-4 py-2">{game.points_for} - {game.points_against}</td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={game.result === "W" ? "secondary" : "outline"}
                            className={
                              game.result === "W"
                                ? "bg-green-100 text-green-800"
                                : game.result === "L"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {game.result}
                          </Badge>
                        </td>
                      </tr>
                    ))}
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
              <div className="text-muted-foreground text-center py-4">No roster changes or trades for this team yet.</div>
            ) : (
              <div className="space-y-6">
                {trades.map((trade) => (
                  <div key={trade.id} className="border-b pb-4">
                    <div className="font-semibold text-primary mb-1">{trade.date} — {trade.description}</div>
                    <ul className="ml-2">
                      {trade.playersTraded.map((pt, idx) => {
                        const isIncoming = pt.toTeam === team.name;
                        const isOutgoing = pt.fromTeam === team.name;
                        if (!isIncoming && !isOutgoing) return null;
                        return (
                          <li key={idx} className="text-sm flex items-center gap-2 py-1">
                            <span className="font-bold">{pt.player.name}</span>
                            <span>{isIncoming ? `acquired from ${pt.fromTeam}` : `traded to ${pt.toTeam}`}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
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
  const color =
    numeric > 0 ? "text-green-600" : numeric < 0 ? "text-red-500" : "text-muted-foreground";
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
