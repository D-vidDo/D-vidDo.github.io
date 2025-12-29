import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import  PlayerCard from "@/components/PlayerCard"; // reuse your PlayerCard component

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
  points_for: number;
  points_against: number;
  captain: string | null;
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

interface SetRow {
  id: number;
  game_id: number;
  set_no: number | null;
  points_for: number | null;
  points_against: number | null;
  result: string | null;
  team_id: number | null;
}

/* ================= PAGE ================= */

export default function History({ seasonId }: { seasonId: number }) {
  const [season, setSeason] = useState<Season | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerOld[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamFilter, setTeamFilter] = useState<number | "all">("all");
  const [playerFilter, setPlayerFilter] = useState<number | "all">("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch season
      const { data: seasonData } = await supabase
        .from("seasons")
        .select("season_id, name")
        .eq("season_id", seasonId)
        .single();
      setSeason(seasonData);

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

      // Fetch sets
      const { data: setsData } = await supabase
        .from("sets")
        .select("*")
        .eq("season_id", seasonId)
        .order("game_id", { ascending: false })
        .order("set_no", { ascending: true });
      setSets(setsData ?? []);

      setLoading(false);
    };
    fetchData();
  }, [seasonId]);

  if (loading) return <div>Loading season…</div>;
  if (!season) return <div>Season not found</div>;

  return (
    <div className="space-y-12 px-4 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary-foreground">{season.name}</h1>
        <p className="text-muted-foreground">
          Historical stats and match info
        </p>
      </header>

      {/* ================= FILTERS ================= */}
      <section className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="font-medium mr-2">Filter by Team:</label>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="border px-2 py-1 rounded-md"
          >
            <option value="all">All</option>
            {teams.map((t) => (
              <option key={t.team_id} value={t.team_id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium mr-2">Filter by Player:</label>
          <select
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="border px-2 py-1 rounded-md"
          >
            <option value="all">All</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ================= TEAM STATS ================= */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Team Stats</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-md">
            <thead className="bg-primary-foreground/10">
              <tr>
                <th className="p-2 text-left">Team</th>
                <th>W</th>
                <th>L</th>
                <th>PF</th>
                <th>PA</th>
                <th>Captain</th>
              </tr>
            </thead>
            <tbody>
              {teams
                .filter((t) => teamFilter === "all" || t.team_id === teamFilter)
                .map((team) => (
                  <tr key={team.team_id} className="border-t hover:bg-primary-foreground/10 transition">
                    <td className="p-2">{team.name}</td>
                    <td className="text-center">{team.wins}</td>
                    <td className="text-center">{team.losses}</td>
                    <td className="text-center">{team.points_for}</td>
                    <td className="text-center">{team.points_against}</td>
                    <td className="text-center">{team.captain ?? "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= PLAYER STATS ================= */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Player Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players
            .filter((p) => playerFilter === "all" || p.id === playerFilter)
            .map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
        </div>
      </section>

      {/* ================= MATCH HISTORY ================= */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Match History</h2>
        {sets.length === 0 && <p className="text-muted-foreground">No match data</p>}
        <div className="space-y-3">
          {Object.entries(
            sets.reduce<Record<number, SetRow[]>>((acc, set) => {
              if (!teamFilter || teamFilter === "all" || set.team_id === teamFilter) {
                acc[set.game_id] = acc[set.game_id] || [];
                acc[set.game_id].push(set);
              }
              return acc;
            }, {})
          ).map(([gameId, gameSets]) => (
            <div key={gameId} className="border rounded-md p-3 shadow-sm hover:shadow-md transition">
              <div className="font-medium mb-1">Game #{gameId}</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {gameSets.map((s) => (
                  <li key={s.id}>
                    Set {s.set_no}: {s.points_for}–{s.points_against} ({s.result})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
