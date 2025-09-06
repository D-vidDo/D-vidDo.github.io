import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

  // New state for set entry
  const [newGameId, setNewGameId] = useState<string | null>(null);
  const [setsToAdd, setSetsToAdd] = useState<{ set_no: number; points_for: number; points_against: number }[]>([]);
  const [set_no, setSetNo] = useState(1);
  const [set_points_for, setSetPointsFor] = useState("");
  const [set_points_against, setSetPointsAgainst] = useState("");

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

  // Submit new game
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
      team_id: teamId,
    };
    try {
      const { error: gameError } = await supabase.from("games").insert([newGame]);
      if (gameError) {
        setMessage(`Failed to add game: ${gameError.message}`);
        setLoading(false);
        return;
      }
      setNewGameId(newGame.id); // Save new game id for set entry
      setMessage("Game added! Now enter sets for this game.");
      setDate("");
      setOpponent("");
      setpoints_for("");
      setpoints_against("");
      setResult("W");
    } catch (error) {
      setMessage("Unexpected error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Add set to local array
  const handleAddSet = () => {
    if (!set_no || !set_points_for || !set_points_against) {
      setMessage("Please fill out all set fields.");
      return;
    }
    setSetsToAdd([
      ...setsToAdd,
      {
        set_no: Number(set_no),
        points_for: Number(set_points_for),
        points_against: Number(set_points_against),
      },
    ]);
    setSetNo(set_no + 1);
    setSetPointsFor("");
    setSetPointsAgainst("");
    setMessage("");
  };

  // Submit all sets to DB
  const handleSubmitSets = async () => {
    if (!newGameId || setsToAdd.length === 0) {
      setMessage("No sets to submit.");
      return;
    }
    setLoading(true);
    try {
      const setsPayload = setsToAdd.map((set) => ({
        id: newGameId,
        set_no: set.set_no,
        points_for: set.points_for,
        points_against: set.points_against,
      }));
      const { error } = await supabase.from("sets").insert(setsPayload);
      if (error) {
        setMessage(`Failed to add sets: ${error.message}`);
      } else {
        setMessage("Sets added!");
        setNewGameId(null);
        setSetsToAdd([]);
        setSetNo(1);
      }
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

      {/* Set Entry Section */}
      {newGameId && (
        <section>
          <h2 className="text-xl font-bold mb-4">Add Sets for This Game</h2>
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
            <button
              onClick={handleAddSet}
              className="bg-primary text-primary-foreground py-1 px-4 rounded font-bold"
            >
              Add Set
            </button>
          </div>
          {/* List of sets to add */}
          <div>
            {setsToAdd.map((set, idx) => (
              <div key={idx} className="mb-1">
                Set {set.set_no}: {set.points_for} - {set.points_against}
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmitSets}
            className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit All Sets"}
          </button>
        </section>
      )}
    </div>
  );
};

export default AdminGameEntry;
