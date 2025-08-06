import React, { useState } from "react";
import { mockTeams, addGameResult, recalculateTeamStats } from "@/data/mockData";

const AdminGameEntry = () => {
  const [teamId, setTeamId] = useState(mockTeams[0]?.id || "");
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [pointsFor, setPointsFor] = useState("");
  const [pointsAgainst, setPointsAgainst] = useState("");
  const [result, setResult] = useState<"W" | "L">("W");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !date || !opponent || !pointsFor || !pointsAgainst || !result) {
      setMessage("Please fill out all fields.");
      return;
    }
    const game = {
      id: "g" + Date.now(),
      date,
      opponent,
      pointsFor: Number(pointsFor),
      pointsAgainst: Number(pointsAgainst),
      result,
    };
    addGameResult(teamId, game);
    recalculateTeamStats();
    setMessage("Game added and stats synced!");
    setDate("");
    setOpponent("");
    setPointsFor("");
    setPointsAgainst("");
    setResult("W");
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-card rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Secret Admin: Add Game Result</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Team</label>
          <select
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            {mockTeams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Opponent</label>
          <input
            type="text"
            value={opponent}
            onChange={e => setOpponent(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="Opponent team name"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block mb-1 font-semibold">Points For</label>
            <input
              type="number"
              value={pointsFor}
              onChange={e => setPointsFor(e.target.value)}
              className="w-full border rounded px-2 py-1"
              min={0}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-semibold">Points Against</label>
            <input
              type="number"
              value={pointsAgainst}
              onChange={e => setPointsAgainst(e.target.value)}
              className="w-full border rounded px-2 py-1"
              min={0}
            />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Result</label>
          <select
            value={result}
            onChange={e => setResult(e.target.value as "W" | "L")}
            className="w-full border rounded px-2 py-1"
          >
            <option value="W">Win</option>
            <option value="L">Loss</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2"
        >
          Submit & Sync Stats
        </button>
        {message && (
          <div className="mt-2 text-center text-green-600 font-semibold">{message}</div>
        )}
      </form>
    </div>
  );
};

export default AdminGameEntry;