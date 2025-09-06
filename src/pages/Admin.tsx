import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AdminGameEntry = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [opponents, setOpponents] = useState<{ label: string; value: string }[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // State for sets entry
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
    async function loadOpponentsForTeam() {
      if (!teamId) return;
      const { data, error } = await supabase
        .from("games")
        .select("opponent, date, time, court")
        .eq("team_id", teamId)
        .neq("opponent", null);
      if (error) {
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
          return { label, value: g.opponent };
        });
        const unique = Array.from(
          new Map(formatted.map((item) => [item.value, item])).values()
        );
        setOpponents(unique);
      }
    }
    loadOpponentsForTeam();
  }, [teamId]);

  // Add set to local array
  const handleAddSet = () => {
    if (!set_no || !set_points_for || !set_points_against) {
      setMessage("Please fill out all set fields.");
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

  // Remove set from local array
  const handleRemoveSet = (idx: number) => {
    setSets(sets.filter((_, i) => i !== idx));
  };

  // Submit game and sets
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !date || !opponent) {
      setMessage("Please fill out all game fields.");
      return;
    }
    if (sets.length === 0) {
      setMessage("Please add at least one set.");
      return;
    }
    setLoading(true);
    setMessage("");
    const newGameId = "g" + Date.now();
    const newGame = {
      id: newGameId,
      date,
      opponent,
      team_id: teamId,
    };
    try {
      // Insert new game
      const { error: gameError } = await supabase.from("games").insert([newGame]);
      if (gameError) {
        setMessage(`Failed to add game: ${gameError.message}`);
        setLoading(false);
        return;
      }
      // Insert sets
      const setsPayload = sets.map((set) => ({
        id: newGameId,
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
      setMessage("Game and sets added!");
      setDate("");
      setOpponent("");
      setSets([]);
      setSetNo(1);
    } catch (error) {
      setMessage("Unexpected error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-card rounded-lg shadow space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-4">Secret Admin: Add Game Result & Sets</h2>
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
          {/* Sets Entry */}
          <div>
            <label className="block mb-2 font-semibold">Add Sets</label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={set_no}
                onChange={e => setSetNo(Number(e.target.value))}
                min={1}
                placeholder="Set Number"
                className="border rounded px-2 py-1"
              />
              <input
                type="number"
                value={set_points_for}
                onChange={e => setSetPointsFor(e.target.value)}
                min={0}
                placeholder="Points For"
                className="border rounded px-2 py-1"
              />
              <input
                type="number"
                value={set_points_against}
                onChange={e => setSetPointsAgainst(e.target.value)}
                min={0}
                placeholder="Points Against"
                className="border rounded px-2 py-1"
              />
              <select
                value={set_result}
                onChange={e => setSetResult(e.target.value as "W" | "L")}
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
            {/* List of sets to add */}
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
            {loading ? "Submitting..." : "Submit Game & Sets"}
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
