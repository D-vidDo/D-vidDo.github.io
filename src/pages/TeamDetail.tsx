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

      /* ---------------- TEAM ---------------- */

      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", teamId)
        .single();

      setTeam(teamData);

      /* ---------------- PLAYERS ---------------- */

      const { data: playersData } = await supabase
        .from("players_public")
        .select("*")
        .in("id", teamData?.player_ids ?? []);

      setPlayers(playersData ?? []);

      /* ---------------- GAMES ---------------- */

      const { data: gameData } = await supabase
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
        .order("time", { ascending: false })
        .order("set_no", { foreignTable: "sets", ascending: true });

      const playedGames = (gameData ?? [])
        .filter((g) => g.sets && g.sets.length > 0)
        .map((g) => {

          const orderedSets = [...g.sets].sort((a, b) => a.set_no - b.set_no);

          const totalPF = orderedSets.reduce((sum, s) => sum + s.points_for, 0);
          const totalPA = orderedSets.reduce((sum, s) => sum + s.points_against, 0);

          const result: "W" | "L" | "T" =
            totalPF > totalPA ? "W" : totalPF < totalPA ? "L" : "T";

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
        })
        .sort((a, b) => {
          const aDateTime = new Date(`${a.date}T${a.time}`);
          const bDateTime = new Date(`${b.date}T${b.time}`);
          return aDateTime.getTime() - bDateTime.getTime();
        });

      setGames(playedGames);

      /* ---------------- ROSTER HISTORY (NEW) ---------------- */

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
  }

  fetchTeamData();
}, [teamId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading team...</div>;

  if (error || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link to="/teams">
          <Button>Back to Teams</Button>
        </Link>
      </div>
    );
  }

  const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);
  const teamplus_minus = players.reduce((sum, p) => sum + (p.plus_minus || 0), 0);
  const teamGames = players.reduce((sum, p) => sum + (p.games_played || 0), 0);
  const teamAverage = teamGames > 0 ? (teamplus_minus / teamGames).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-background">

      {/* HERO */}
      <section
        className="py-16 px-4"
        style={{
          background: `linear-gradient(135deg, ${team.color} 0%, ${team.color2} 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto">

          <Link to="/teams" className="text-white flex items-center gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Teams
          </Link>

          <div className="flex items-center gap-6">

            <img
              src={`/logos/${team.team_id}.png`}
              className="w-48 h-48 object-contain"
            />

            <div>
              <h1 className="text-5xl font-bold text-white">{team.name}</h1>
              <p className="text-white/90">Captain: {team.captain}</p>

              <div className="flex gap-3 mt-3">

                <Badge>{team.wins}W - {team.losses}L</Badge>

                <Badge variant="outline">
                  {winPercentage}% Win Rate
                </Badge>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">

        {/* ROSTER */}
        <Card>
          <CardHeader>
            <CardTitle>Team Roster</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={{ ...player, isCaptain: player.name === team.captain }}
                />
              ))}

            </div>
          </CardContent>
        </Card>

        {/* ROSTER HISTORY */}
        <Card>

          <CardHeader>
            <CardTitle>Roster History</CardTitle>
          </CardHeader>

          <CardContent>

            {trades.length === 0 ? (
              <div className="text-muted-foreground">
                No roster changes yet.
              </div>
            ) : (

              <div className="space-y-6">

                {trades.map((trade) => (

                  <div key={trade.id} className="border-b pb-4">

                    <div className="font-semibold text-primary mb-1">
                      {trade.date} — {trade.description}
                    </div>

                    <ul>

                      {trade.playersTraded.map((pt, idx) => {

                        const isIncoming = pt.toTeam === team.name;
                        const isOutgoing = pt.fromTeam === team.name;

                        return (
                          <li key={idx} className="text-sm py-1">

                            <span className="font-bold">
                              {pt.player.name}
                            </span>{" "}

                            {isIncoming
                              ? `acquired from ${pt.fromTeam}`
                              : `traded to ${pt.toTeam}`}

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

export default TeamDetail;