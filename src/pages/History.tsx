import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PlayerCard from "@/components/PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ================= TYPES ================= */

interface Season {
  season_id: number;
  name: string;
}

interface Team {
  team_id: number;
  name: string;
  wins: number;
  losses: number;
  captain: string | null;
  color?: string;
  color2?: string;
  points_for: number;
  points_against: number;
}

interface PlayerOld {
  id: number;
  name: string;
  games_played: number;
  plus_minus: number;
  primary_position: string;
  secondary_position: string | null;
  dominant_hand: string | null;
  height: string | null;
}

interface Game {
  id: number;
  team_id: number | null;
  date: string | null;
  time: string | null;
  opponent: string | null;
  sets: SetRow[];
}

interface SetRow {
  id: number;
  game_id: number;
  set_no: number | null;
  points_for: number | null;
  points_against: number | null;
  result: string | null;
  vod_link?: string | null;
}

/* ================= HELPERS ================= */

const formatTime12H = (time?: string) => {
  if (!time) return "—";
  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute} ${suffix}`;
};

/* ================= PAGE ================= */

export default function History({ seasonId }: { seasonId: number }) {
  const [season, setSeason] = useState<Season | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerOld[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamFilter, setTeamFilter] = useState<number | "all">("all");
  const [playerFilter, setPlayerFilter] = useState<number | "all">("all");

  const getTeamColors = (teamId?: number) => {
    const team = teams.find((t) => t.team_id === teamId);
    return {
      bg: team?.color || "#f3f4f6", // fallback to a light gray
      fg: team?.color2 || "#000000", // fallback to black
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch season
        const { data: seasonData } = await supabase
          .from("seasons")
          .select("*")
          .eq("season_id", seasonId)
          .single();
        setSeason(seasonData ?? null);

        // Fetch teams
        const { data: teamsData } = await supabase
          .from("teams")
          .select("*")
          .eq("season_id", seasonId)
          .order("wins", { ascending: false });
        setTeams(teamsData ?? []);

        // Fetch players
        const { data: playersData } = await supabase
          .from("players_old")
          .select("*")
          .eq("season_id", seasonId)
          .order("plus_minus", { ascending: false });
        setPlayers(playersData ?? []);

        // Fetch games
        const { data: gamesData } = await supabase
          .from("games")
          .select("*")
          .eq("season_id", seasonId)
          .order("date", { ascending: true })
          .order("time", { ascending: true });

        // Fetch sets
        const { data: setsData } = await supabase
          .from("sets")
          .select("*")
          .eq("season_id", seasonId)
          .order("set_no", { ascending: true });

        // Map sets to games
        const gamesWithSets: Game[] = (gamesData ?? []).map((g: any) => ({
          ...g,
          sets: (setsData ?? [])
            .filter((s: any) => s.game_id === g.id)
            .map((s: any) => ({
              ...s,
              result:
                s.points_for === s.points_against
                  ? "T"
                  : s.points_for! > s.points_against!
                  ? "W"
                  : "L",
            })),
        }));

        setGames(gamesWithSets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  if (loading) return <div>Loading season…</div>;
  if (!season) return <div>Season not found</div>;

  const filteredPlayers = players.filter(
    (p) => playerFilter === "all" || p.id === playerFilter
  );
  const filteredTeams = teams.filter(
    (t) => teamFilter === "all" || t.team_id === teamFilter
  );
  const filteredGames = games.filter(
    (g) => teamFilter === "all" || g.team_id === teamFilter
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold mb-2">{season.name}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <select
          value={teamFilter}
          onChange={(e) =>
            setTeamFilter(
              e.target.value === "all" ? "all" : Number(e.target.value)
            )
          }
          className="border px-2 py-1 rounded-md"
        >
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.team_id} value={t.team_id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={playerFilter}
          onChange={(e) =>
            setPlayerFilter(
              e.target.value === "all" ? "all" : Number(e.target.value)
            )
          }
          className="border px-2 py-1 rounded-md"
        >
          <option value="all">All Players</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Player Stats */}
      <Card>
        <CardHeader>
          <CardTitle>
            <CalendarDays className="h-5 w-5 inline mr-2" /> Player Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <div className="text-muted-foreground">No players found.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match History */}
      <Card>
        <CardHeader>
          <CardTitle>
            <CalendarDays className="h-5 w-5 inline mr-2" /> Match History
            (Set-by-Set)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGames.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">
              No games played yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Team</th>
                    <th className="px-4 py-2">Opponent</th>
                    <th className="px-4 py-2 text-center">Set</th>
                    <th className="px-4 py-2 text-center">PF</th>
                    <th className="px-4 py-2 text-center">PA</th>
                    <th className="px-4 py-2 text-center">Diff</th>
                    <th className="px-4 py-2 text-center">Result</th>
                    <th className="px-4 py-2 text-center">VOD</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) =>
                    game.sets.map((set, idx) => (
                      <tr
                        key={`${game.id}-set-${set.set_no}`}
                        style={{
                          background: `linear-gradient(90deg, #ffffff
             85%, ${getTeamColors(game.team_id).bg || "#ffffff"} 100%)`,
                        }}
                        className="border-b border-muted"
                      >
                        <td className="px-4 py-2">{game.date}</td>
                        <td className="px-4 py-2">
                          {formatTime12H(game.time)}
                        </td>
                        <td className="px-4 py-2 font-semibold">
                          {game.team_id
                            ? teams.find((t) => t.team_id === game.team_id)
                                ?.name
                            : "N/A"}
                        </td>
                        <td className="px-4 py-2 font-semibold">
                          {game.opponent}
                        </td>
                        <td className="px-4 py-2 text-center">{set.set_no}</td>
                        <td className="px-4 py-2 text-center text-green-700 font-bold">
                          {set.points_for}
                        </td>
                        <td className="px-4 py-2 text-center text-red-600 font-bold">
                          {set.points_against}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {set.points_for! - set.points_against!}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              set.result === "W"
                                ? "bg-green-100 text-green-700"
                                : set.result === "L"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {set.result}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {set.vod_link ? (
                            <Button
                              size="sm"
                              variant="default"
                              className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() =>
                                window.open(
                                  set.vod_link,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                              title="Watch VOD"
                            >
                              <PlayCircle className="h-4 w-4" />
                              Watch
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
