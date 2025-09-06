import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = 'https://bqqotvjpvaznkjfldcgm.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AdminGameEntry = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [opponents, setOpponents] = useState<{ label: string; value: string }[]>([]);
  const [points_for, setpoints_for] = useState("");
  const [points_against, setpoints_against] = useState("");
  const [result, setResult] = useState<"W" | "L">("W");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTeams() {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) {
        setMessage(`Error loading teams: ${error.message}`);
      } else {
        setTeams(data ?? []);
        if (data && data.length > 0) setTeamId(data[0].team_id);
      }
    }

    loadTeams();
  }, []);

  useEffect(() => {
    async function loadOpponentsForTeam() {
      if (!teamId) return;

      const { data, error } = await supabase
        .from("games")
        .select("opponent, date, time, court")
        .eq("team_id", teamId)
        .neq("opponent", null);

      if (error) {
        console.error("Error loading opponents:", error.message);
        setOpponents([]);
      } else {
        const formatted = data.map((g) => {
          const rawTime = g.time?.slice(0, 5) || "";
          const [hourStr, minute] = rawTime.split(":");
          let hour = parseInt(hourStr, 10);
          const ampm = hour >= 12 ? "PM" : "AM";
          hour = hour % 12 || 12;
          const formattedTime = `${hour}:${minute} ${ampm}`;
          const label = `${g.opponent} — ${g.date} ${formattedTime} (Court ${g.court ?? "?"})`;

          return {
            label,
            value: g.opponent,
          };
        });

        const unique = Array.from(
          new Map(formatted.map((item) => [item.value, item])).values()
        );

        setOpponents(unique);
      }
    }

    loadOpponentsForTeam();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId || !date || !opponent || !points_for || !points_against || !result) {
      setMessage("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    const newGame = {
      id: "g" + Date.now(),
      date,
      opponent,
      points_for: Number(points_for),
      points_against: Number(points_against),
      result,
    };

    try {
      const { data: teamData, error: fetchError } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", teamId)
        .single();

      if (fetchError || !teamData) {
        setMessage(`Failed to fetch team data: ${fetchError?.message || "No data"}`);
        setLoading(false);
        return;
      }

      const updatedGames = [...(teamData.games || []), newGame];

      let wins = teamData.wins ?? 0;
      let losses = teamData.losses ?? 0;
      let points_for_total = teamData.points_for ?? 0;
      let points_against_total = teamData.points_against ?? 0;

      if (result === "W") wins += 1;
      else if (result === "L") losses += 1;

      points_for_total += newGame.points_for;
      points_against_total += newGame.points_against;

      const { error: updateError } = await supabase
        .from("teams")
        .update({
          games: updatedGames,
          wins,
          losses,
          points_for: points_for_total,
          points_against: points_against_total,
        })
        .eq("team_id", teamId);

      if (updateError) {
        setMessage(`Failed to update team: ${updateError.message}`);
        setLoading(false);
        return;
      }

      if (teamData.player_ids && teamData.player_ids.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("*")
          .in("id", teamData.player_ids);

        if (playersError) {
          setMessage(`Failed to fetch players: ${playersError.message}`);
          setLoading(false);
          return;
        }

        for (const player of playersData) {
          const updatedplus_minus = (player.plus_minus ?? 0) + (newGame.points_for - newGame.points_against);
          const updatedGamesPlayed = (player.games_played ?? 0) + 1;

          const { error: updatePlayerError } = await supabase
            .from("players")
            .update({ plus_minus: updatedplus_minus, games_played: updatedGamesPlayed })
            .eq("id", player.id);

          if (updatePlayerError) {
            setMessage(`Failed to update player ${player.name}: ${updatePlayerError.message}`);
            setLoading(false);
            return;
          }
        }
      }

      setMessage("Game added and stats synced!");
      setDate("");
      setOpponent("");
      setpoints_for("");
      setpoints_against("");
      setResult("W");

      const { data: refreshedTeams } = await supabase.from("teams").select("*");
      setTeams(refreshedTeams ?? []);
    } catch (error) {
      setMessage("Unexpected error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-card rounded-lg shadow space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-4">Secret Admin: Add Game Result</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Selection with Logos */}
          <div>
            <label className="block mb-2 font-semibold">Select Team</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {teams.map((team) => (
                <label
                  key={team.team_id}
                  className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center justify-center transition ${
                    teamId === team.team_id ? "border-primary ring-2 ring-primary" : "border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="team"
                    value={team.team_id}
                    checked={teamId === team.team_id}
                    onChange={() => setTeamId(team.team_id)}
                    className="hidden"
                  />
                  <img
                    src={`/logos/${team.team_id}.jpg`}
                    alt={team.name}
                    className="w-16 h-16 object-contain mb-2"
                  />
                  <span className="text-sm font-medium text-center">{team.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block mb-1 font-semibold">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded px-2 py-1"
              disabled={loading}
            />
          </div>

          {/* Opponent Dropdown */}
          <div>
            <label className="block mb-1 font-semibold">Opponent</label>
            <select
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="w-full border rounded px-2 py-1 mb-2"
              disabled={loading}
            >
              <option value="">Select opponent</option>
              {opponents.map((oppo, idx) => (
                <option key={idx} value={oppo.value}>
                  {oppo.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="Or enter a new opponent"
              disabled={loading}
            />
          </div>

          {/* Points */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-semibold">Points For</label>
              <input
                type="number"
                value={points_for}
                onChange={(e) => setpoints_for(e.target.value)}
                className="w-full border rounded px-2 py-1"
                min={0}
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-semibold">Points Against</label>
              <input
                type="number"
                value={points_against}
                onChange={(e) => setpoints_against(e.target.value)}
                className="w-full border rounded px-2 py-1"
                min={0}
                disabled={loading}
              />
            </div>
          </div>

          {/* Result */}
          <div>
            <label className="block mb-1 font-semibold">Result</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value as "W" | "L")}
              className="w-full border rounded px-2 py-1"
              disabled={loading}
            >
              <option value="W">Win</option>
              <option value="L">Loss</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit & Sync Stats"}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`mt-2 text-center font-semibold ${
                message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </section>
    </div>
  );
};

export default AdminGameEntry;
