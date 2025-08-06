import React, { useState, useEffect } from "react";
import { getTeams, addGame, updateTeamStats, migrateMockDataToSupabase } from "@/services/supabaseLeague";
import type { Database } from "@/integrations/supabase/types";

type Team = Database['public']['Tables']['teams']['Row'];

const AdminGameEntry = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [pointsFor, setPointsFor] = useState("");
  const [pointsAgainst, setPointsAgainst] = useState("");
  const [result, setResult] = useState<"W" | "L">("W");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const teamsData = await getTeams();
      setTeams(teamsData);
      if (teamsData.length > 0 && !teamId) {
        setTeamId(teamsData[0].id);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      setMessage('Error loading teams');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !date || !opponent || !pointsFor || !pointsAgainst || !result) {
      setMessage("Please fill out all fields.");
      return;
    }
    
    setLoading(true);
    try {
      // Add the game record
      await addGame({
        teamId,
        date,
        opponent,
        pointsFor: Number(pointsFor),
        pointsAgainst: Number(pointsAgainst),
        result,
      });

      // Update team stats
      await updateTeamStats(teamId, {
        pointsFor: Number(pointsFor),
        pointsAgainst: Number(pointsAgainst),
        result,
      });

      setMessage("Game and stats saved successfully!");
      setDate("");
      setOpponent("");
      setPointsFor("");
      setPointsAgainst("");
      setResult("W");
      
      // Reload teams to show updated stats
      await loadTeams();
    } catch (error) {
      console.error('Error saving game:', error);
      setMessage("Error saving game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    setMigrating(true);
    setMessage("");
    try {
      const result = await migrateMockDataToSupabase();
      setMessage(result.message);
      if (result.success) {
        await loadTeams(); // Reload teams after migration
      }
    } catch (error) {
      setMessage("Migration failed: " + (error as Error).message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-card rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Secret Admin: League Management</h2>
      
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Migrate Mock Data</h3>
        <p className="text-sm text-muted-foreground mb-3">
          This will import all teams, players, and existing game data from mockData.ts into the database.
        </p>
        <button
          onClick={handleMigration}
          disabled={migrating}
          className="w-full bg-secondary text-secondary-foreground py-2 rounded font-bold disabled:opacity-50"
        >
          {migrating ? "Migrating..." : "Import Mock Data to Database"}
        </button>
      </div>

      <h3 className="text-lg font-bold mb-4">Add Game Result</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Team</label>
          <select
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            {teams.map(team => (
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
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Submit & Sync Stats"}
        </button>
        {message && (
          <div className="mt-2 text-center text-green-600 font-semibold">{message}</div>
        )}
      </form>
    </div>
  );
};

export default AdminGameEntry;