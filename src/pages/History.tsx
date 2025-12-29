import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PlayerCard from "@/components/PlayerCard";

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
  const [playerSearch, setPlayerSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch season
        const { data: seasonData } = await supabase
          .from("seasons")
          .select("season_id, name")
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

        // Fetch sets
        const { data: setsData } = await supabase
          .from("sets")
          .select("*")
          .eq("season_id", seasonId)
          .order("game_id", { ascending: true })
          .order("set_no", { ascending: true });
        setSets(setsData ?? []);
      } catch (error) {
        console.error("Error fetching history data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  if (loading) return <div>Loading season…</div>;
  if (!season) return <div>Season not found</div>;

  // Filtered players
  const filteredPlayers = players
    .filter((p) => playerFilter === "all" || p.id === playerFilter)
    .filter((p) =>
      playerSearch ? p.name.toLowerCase().includes(playerSearch.toLowerCase()) : true
    );

  // Filtered teams
  const filteredTeams = teams.filter(
    (t) => teamFilter === "all" || t.team_id === teamFilter
  );

  // Group sets by game
  const groupedSets = sets.reduce<Record<number, SetRow[]>>((acc, s) => {
    if (teamFilter === "all" || s.team_id === teamFilter) {
      if (!acc[s.game_id]) acc[s.game_id] = [];
      acc[s.game_id].push(s);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-12 px-4 sm:px-6 lg:px-8">
      {/* HEADER */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary-foreground">{season.name}</h1>
        <p className="text-muted-foreground">Historical stats and match info</p>
      </header>

      {/* FILTERS */}
      <section className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="font-medium mr-2">Filter by Team:</label>
          <select
            value={teamFilter}
            onChange={(e) =>
              setTeamFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
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
            onChange={(e) =>
              setPlayerFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
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

        <div>
          <input
            type="text"
            placeholder="Search player..."
            className="border px-2 py-1 rounded-md"
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
          />
        </div>

        <div>
          <button
            onClick={() => {
              setTeamFilter("all");
              setPlayerFilter("all");
              setPlayerSearch("");
            }}
            className="bg-primary-foreground text-white px-3 py-1 rounded-md hover:bg-primary-foreground/80 transition"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* TEAM STATS */}
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
              {filteredTeams.map((team) => (
                <tr
                  key={team.team_id}
                  className="border-t hover:bg-primary-foreground/10 transition"
                >
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

      {/* PLAYER STATS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Player Stats</h2>
        {filteredPlayers.length === 0 ? (
          <p className="text-muted-foreground">No players found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPlayers.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        )}
      </section>

      {/* MATCH HISTORY */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Match History</h2>
        {Object.keys(groupedSets).length === 0 && (
          <p className="text-muted-foreground">No match data</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedSets).map(([gameId, gameSets]) => (
            <div
              key={gameId}
              className="bg-white border rounded-lg p-4 shadow hover:shadow-lg transition"
            >
              <div className="font-semibold text-lg mb-2">Game #{gameId}</div>
              {gameSets.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between text-sm py-1 border-b last:border-b-0"
                >
                  <span>Set {s.set_no}</span>
                  <span>{s.points_for}–{s.points_against}</span>
                  <span className="font-medium">{s.result}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
