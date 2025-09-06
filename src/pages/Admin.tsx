import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AdminGameEntry = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [games, setGames] = useState<{ id: string; label: string }[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [sets, setSets] = useState<
    { set_no: number; points_for: number; points_against: number; result: "W" | "L" }[]
  >([]);
  const [set_no, setSetNo] = useState<number>(1);
  const [set_points_for, setSetPointsFor] = useState("");
  const [set_points_against, setSetPointsAgainst] = useState("");
  const [set_result, setSetResult] = useState<"W" | "L">("W");

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
    async function loadGamesForTeam() {
      if (!teamId) return;
      const { data, error } = await supabase
        .from("games")
        .select("id, opponent, date, time, court")
        .eq("team_id", teamId);

      if (error || !data) {
        setGames([]);
        return;
      }

      const formattedGames = data.map((g) => {
        const rawTime = g.time?.slice(0, 5) || "";
        const [hourStr, minute] = rawTime.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        const formattedTime = `${hour}:${minute} ${ampm}`;
        const label = `${g.opponent} — ${g.date} ${formattedTime} (Court ${g.court ?? "?"})`;
        return { id: g.id, label };
      });

      setGames(formattedGames);
      if (formattedGames.length > 0) setSelectedGameId(formattedGames[0].id);
    }

    loadGamesForTeam();
  }, [teamId]);

  const handleAddSet = () => {
    if (!set_no || !set_points_for || !set_points_against) {
      setMessage("Please fill out all set fields.");
      return;
    }

    if (sets.some((s) => s.set_no === set_no)) {
      setMessage(`Set ${set_no} already exists.`);
      return;
    }

    setSets([
      ...sets,
      {
        set_no: Number(set_no),
        points_for: Number(set_points_for),
        points_against: Number(set_points_against),
        result: set_result,
      },
    ]);
    setSetNo(set_no + 1);
    setSetPointsFor("");
    setSetPointsAgainst("");
    setSetResult("W");
    setMessage("");
  };

  const handleRemoveSet = (idx: number) => {
    setSets(sets.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId) {
      setMessage("Please select a game.");
      return;
    }

    if (sets.length === 0) {
      setMessage("Please add at least one set.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const setsPayload = sets.map((set) => ({
        game_id: selectedGameId,
        set_no: set.set_no,
        points_for: set.points_for,
        points_against: set.points_against,
        result: set.result,
      }));

      const { error: setError } = await supabase.from("sets").insert(setsPayload);

      if (setError) {
        setMessage(`Failed to add sets: ${setError.message}`);
        setLoading(false);
        return;
      }

      // Calculate match result
      let wins = 0;
      let losses = 0;
      let ties = 0;

      sets.forEach((s) => {
        if (s.points_for === s.points_against) {
          ties += 1;
        } else if (s.points_for > s.points_against) {
          wins += 1;
        } else {
          losses += 1;
        }
      });

      let matchResult = "Draw";
      if (wins > losses) matchResult = "Win";
      else if (losses > wins) matchResult = "Loss";

      setMessage(`Sets added! Match result: ${matchResult} (${wins}W - ${losses}L - ${ties}T)`);
      setSets([]);
      setSetNo(1);
      setSetPointsFor("");
      setSetPointsAgainst("");
      setSetResult("W");
    } catch (error) {
      setMessage("Unexpected error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-card rounded-lg shadow space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-4">Secret Admin: Add Sets to Game</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Selection */}
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

          {/* Game Selection */}
          <div>
            <label className="block mb-1 font-semibold">Select Game</label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="w-full border rounded px-2 py-1"
              disabled={loading}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sets Entry */}
          <div>
            <label className="block mb-2 font-semibold">Add Sets</label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={set_no}
                onChange={(e) => setSetNo(Number(e.target.value))}
                min={1}
                placeholder="Set Number"
                className="border rounded px-2 py-1"
              />
              <input
                type="number"
                value={set_points_for}
                onChange={(e) => setSetPointsFor(e.target.value)}
                min={0}
                placeholder="Points For"
                className="border rounded px-2 py-1"
              />
              <input
                type="number"
                value={set_points_against}
                onChange={(e) => setSetPointsAgainst(e.target.value)}
                min={0}
                placeholder="Points Against"
                className="border rounded px-2 py-1"
              />
              <select
                value={set_result}
                onChange={(e) => setSetResult(e.target.value as "W" | "L")}
                className="border rounded px-2 py-1"
              >
                <option value="W">Win</option>
                <option value="L">Loss</option>
              </select>
              <button
                type="button"
                onClick={handleAddSet}
                className="bg-primary text-primary-foreground py-1 px-4 rounded font-bold"
              >
                Add Set
              </button>
            </div>
            <div>
              {sets.map((set, idx) => (
                <div key={idx} className="mb-1 flex items-center gap-2">
                  <span>
                    Set {set.set_no}: {set.points_for} - {set.points_against} ({set.result === "W" ? "Win" : "Loss"})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(idx)}
                    className="text-xs text-red-600 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Sets"}
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
