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

  // New state for editing games/sets
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [sets, setSets] = useState<any[]>([]);

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
    async function loadGames() {
      const { data, error } = await supabase.from("games").select("*");
      if (!error) setGames(data ?? []);
    }
    loadTeams();
    loadGames();
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

  useEffect(() => {
    async function fetchSets() {
      if (!selectedGame) return;
      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .eq("id", selectedGame.id);
      if (!error) setSets(data ?? []);
    }
    fetchSets();
  }, [selectedGame]);

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
      // Insert new game
      const { error: gameError } = await supabase.from("games").insert([newGame]);
      if (gameError) {
        setMessage(`Failed to add game: ${gameError.message}`);
        setLoading(false);
        return;
      }
      // Insert initial set
      const { error: setError } = await supabase.from("sets").insert([
        {
          id: newGame.id,
          set_no: 1,
          points_for: Number(points_for),
          points_against: Number(points_against),
        },
      ]);
      if (setError) {
        setMessage(`Failed to add set: ${setError.message}`);
        setLoading(false);
        return;
      }
      setMessage("Game and set added!");
      setDate("");
      setOpponent("");
      setpoints_for("");
      setpoints_against("");
      setResult("W");
      // Refresh games
      const { data: refreshedGames } = await supabase.from("games").select("*");
      setGames(refreshedGames ?? []);
    } catch (error) {
      setMessage("Unexpected error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Edit game info
  const handleGameUpdate = async (field: string, value: any) => {
    if (!selectedGame) return;
    const { error } = await supabase
      .from("games")
      .update({ [field]: value })
      .eq("id", selectedGame.id);
    if (!error) setMessage("Game updated!");
    else setMessage(error.message);
  };

  // Edit set info
  const handleSetUpdate = async (setNo: number, field: string, value: any) => {
    const { error } = await supabase
      .from("sets")
      .update({ [field]: value })
      .eq("id", selectedGame.id)
      .eq("set_no", setNo);
    if (!error) setMessage("Set updated!");
    else setMessage(error.message);
  };

  // Add new set
  const handleAddSet = async () => {
    if (!selectedGame) return;
    const newSetNo = sets.length + 1;
    const { error } = await supabase
      .from("sets")
      .insert([{ id: selectedGame.id, set_no: newSetNo, points_for: 0, points_against: 0 }]);
    if (!error) setMessage("Set added!");
    else setMessage(error.message);
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

      {/* Game/Set Editor Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Edit Existing Games & Sets</h2>
        <div>
          <label>Select Game:</label>
          <select
            onChange={e => setSelectedGame(games.find(g => g.id === e.target.value))}
            className="w-full border rounded px-2 py-1 mb-2"
          >
            <option value="">-- Select --</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>
                {game.opponent} ({game.date})
              </option>
            ))}
          </select>
        </div>
        {selectedGame && (
          <div className="space-y-2">
            <h3 className="font-semibold">Game Info</h3>
            <div>
              <label>Date:</label>
              <input
                type="date"
                value={selectedGame.date}
                onChange={e => handleGameUpdate("date", e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <label>Opponent:</label>
              <input
                type="text"
                value={selectedGame.opponent}
                onChange={e => handleGameUpdate("opponent", e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <label>Court:</label>
              <input
                type="number"
                value={selectedGame.court || ""}
                onChange={e => handleGameUpdate("court", Number(e.target.value))}
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <label>Time:</label>
              <input
                type="time"
                value={selectedGame.time || ""}
                onChange={e => handleGameUpdate("time", e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <h3 className="font-semibold mt-4">Sets</h3>
            {sets.map(set => (
              <div key={set.set_no} className="flex gap-2 items-center mb-2">
                <span>Set {set.set_no}:</span>
                <input
                  type="number"
                  value={set.points_for}
                  onChange={e => handleSetUpdate(set.set_no, "points_for", Number(e.target.value))}
                  placeholder="Points For"
                  className="border rounded px-2 py-1"
                />
                <input
                  type="number"
                  value={set.points_against}
                  onChange={e => handleSetUpdate(set.set_no, "points_against", Number(e.target.value))}
                  placeholder="Points Against"
                  className="border rounded px-2 py-1"
                />
              </div>
            ))}
            <button
              onClick={handleAddSet}
              className="bg-primary text-primary-foreground py-1 px-4 rounded font-bold"
            >
              Add Set
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminGameEntry;
