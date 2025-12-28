import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ================= TYPES ================= */

interface Season {
  season_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
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
}

/* ================= PAGE ================= */

export default function History({ seasonId }: { seasonId: number }) {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeason = async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("season_id, name, start_date, end_date")
        .eq("season_id", seasonId)
        .single();

      if (!error) setSeason(data);
      setLoading(false);
    };

    fetchSeason();
  }, [seasonId]);

  if (loading) return <div>Loading season…</div>;
  if (!season) return <div>Season not found</div>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold">{season.name}</h1>
        <p className="text-sm text-muted-foreground">
          {season.start_date} – {season.end_date}
        </p>
      </header>

      <TeamStats seasonId={seasonId} />
      <PlayerStats seasonId={seasonId} />
      <MatchHistory seasonId={seasonId} />
    </div>
  );
}

/* ================= TEAM STATS ================= */

function TeamStats({ seasonId }: { seasonId: number }) {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    supabase
      .from("teams")
      .select("team_id, name, wins, losses, points_for, points_against, captain")
      .eq("season_id", seasonId)
      .order("wins", { ascending: false })
      .then(({ data }) => setTeams((data as Team[]) || []));
  }, [seasonId]);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Team Stats</h2>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-1">Team</th>
            <th>W</th>
            <th>L</th>
            <th>PF</th>
            <th>PA</th>
            <th>Captain</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.team_id} className="border-b">
              <td className="py-1">{team.name}</td>
              <td>{team.wins}</td>
              <td>{team.losses}</td>
              <td>{team.points_for}</td>
              <td>{team.points_against}</td>
              <td>{team.captain ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ================= PLAYER STATS ================= */

function PlayerStats({ seasonId }: { seasonId: number }) {
  const [players, setPlayers] = useState<PlayerOld[]>([]);

  useEffect(() => {
    supabase
      .from("players_old")
      .select(
        "id, name, games_played, plus_minus, primary_position, secondary_position, dominant_hand, height"
      )
      .eq("season_id", seasonId)
      .order("plus_minus", { ascending: false })
      .then(({ data }) => setPlayers((data as PlayerOld[]) || []));
  }, [seasonId]);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Player Stats</h2>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-1">Player</th>
            <th>Pos</th>
            <th>GP</th>
            <th>+/-</th>
            <th>Avg</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-1">{p.name}</td>
              <td>{p.primary_position}</td>
              <td>{p.games_played}</td>
              <td>{p.plus_minus}</td>
              <td>
                {p.games_played > 0
                  ? (p.plus_minus / p.games_played).toFixed(2)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ================= MATCH HISTORY ================= */

function MatchHistory({ seasonId }: { seasonId: number }) {
  const [sets, setSets] = useState<SetRow[]>([]);

  useEffect(() => {
    supabase
      .from("sets")
      .select("id, game_id, set_no, points_for, points_against, result")
      .eq("season_id", seasonId)
      .order("game_id", { ascending: false })
      .order("set_no", { ascending: true })
      .then(({ data }) => setSets((data as SetRow[]) || []));
  }, [seasonId]);

  const grouped = sets.reduce<Record<number, SetRow[]>>((acc, set) => {
    acc[set.game_id] = acc[set.game_id] || [];
    acc[set.game_id].push(set);
    return acc;
  }, {});

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Match History</h2>
      <div className="space-y-4">
        {Object.entries(grouped).map(([gameId, gameSets]) => (
          <div key={gameId} className="border rounded p-3">
            <div className="font-medium mb-1">Game #{gameId}</div>
            <ul className="text-sm">
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
  );
}
