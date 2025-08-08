import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = 'https://bqqotvjpvaznkjfldcgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW90dmpwdmF6bmtqZmxkY2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDE4NjEsImV4cCI6MjA3MDAxNzg2MX0.VPClABOucYEo-bVPg_brc6WvSx17zR4LADC2FEWdI5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AdminGameEntry = () => {
  // --- Game Entry State ---
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [points_for, setpoints_for] = useState("");
  const [points_against, setpoints_against] = useState("");
  const [result, setResult] = useState<"W" | "L">("W");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Trade Admin State ---
  const [players, setPlayers] = useState<{id: string; name: string}[]>([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [tradeDescription, setTradeDescription] = useState("");
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);

  // Helper: Find team by player id
  const findTeamByPlayerId = (playerId: string) =>
    teams.find(team => team.player_ids?.includes(playerId));

  useEffect(() => {
    // Load teams on mount
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

    // Load players for trade admin
    async function loadPlayers() {
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name");
      if (playersError) {
        setTradeMessage("Failed to load players");
      } else {
        setPlayers(playersData || []);
      }
    }
    loadPlayers();
  }, []);

  // Game Entry Submit Handler
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
      // Fetch current team data
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

      // Append new game to existing games array
      const updatedGames = [...(teamData.games || []), newGame];

      // Recalculate team stats
      let wins = teamData.wins ?? 0;
      let losses = teamData.losses ?? 0;
      let points_for = teamData.points_for ?? 0;
      let points_against = teamData.points_against ?? 0;

      if (result === "W") wins += 1;
      else if (result === "L") losses += 1;

      points_for += newGame.points_for;
      points_against += newGame.points_against;

      // Update team record
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          games: updatedGames,
          wins,
          losses,
          points_for,
          points_against,
        })
        .eq("team_id", teamId);

      if (updateError) {
        setMessage(`Failed to update team: ${updateError.message}`);
        setLoading(false);
        return;
      }

      // Update player stats for all players in this team
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

      // Refresh teams list
      const { data: refreshedTeams } = await supabase.from("teams").select("*");
      setTeams(refreshedTeams ?? []);
    } catch (error) {
      setMessage("Unexpected error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Trade Submit Handler (two-way trade)
  const handleTrade = async () => {
    if (!player1Id || !player2Id || !tradeDescription) {
      setTradeMessage("Please select both players and provide a trade description.");
      return;
    }
    if (player1Id === player2Id) {
      setTradeMessage("Please select two different players for trade.");
      return;
    }

    const player1Team = findTeamByPlayerId(player1Id);
    const player2Team = findTeamByPlayerId(player2Id);

    if (!player1Team || !player2Team) {
      setTradeMessage("Could not find teams for selected players.");
      return;
    }

    if (player1Team.team_id === player2Team.team_id) {
      setTradeMessage("Players are on the same team; trade requires players from different teams.");
      return;
    }

    setTradeLoading(true);
    setTradeMessage(null);

    try {
      // Update rosters: remove players from their original teams and add to the other's team
      // Remove player1 from player1Team
      const newRoster1 = (player1Team.player_ids || []).filter(id => id !== player1Id);
      const { error: errorRemove1 } = await supabase
        .from("teams")
        .update({ player_ids: newRoster1 })
        .eq("team_id", player1Team.team_id);
      if (errorRemove1) throw errorRemove1;

      // Remove player2 from player2Team
      const newRoster2 = (player2Team.player_ids || []).filter(id => id !== player2Id);
      const { error: errorRemove2 } = await supabase
        .from("teams")
        .update({ player_ids: newRoster2 })
        .eq("team_id", player2Team.team_id);
      if (errorRemove2) throw errorRemove2;

      // Add player1 to player2Team
      const updatedRoster2 = Array.from(new Set([...(player2Team.player_ids || []), player1Id]));
      const { error: errorAdd1 } = await supabase
        .from("teams")
        .update({ player_ids: updatedRoster2 })
        .eq("team_id", player2Team.team_id);
      if (errorAdd1) throw errorAdd1;

      // Add player2 to player1Team
      const updatedRoster1 = Array.from(new Set([...(player1Team.player_ids || []), player2Id]));
      const { error: errorAdd2 } = await supabase
        .from("teams")
        .update({ player_ids: updatedRoster1 })
        .eq("team_id", player1Team.team_id);
      if (errorAdd2) throw errorAdd2;

      // Insert trade record with players_traded array (two entries)
      const player1 = players.find(p => p.id === player1Id);
      const player2 = players.find(p => p.id === player2Id);

      if (!player1 || !player2) {
        throw new Error("Selected players not found in player list");
      }

      const { error: tradeInsertError } = await supabase.from("trades").insert([
        {
          date: new Date().toISOString(),
          description: tradeDescription,
          players_traded: [
            {
              player: { name: player1.name },
              from_team: player1Team.name,
              to_team: player2Team.name,
            },
            {
              player: { name: player2.name },
              from_team: player2Team.name,
              to_team: player1Team.name,
            },
          ],
        },
      ]);
      if (tradeInsertError) throw tradeInsertError;

      setTradeMessage(`Trade successful! ${player1.name} swapped with ${player2.name}.`);
      setPlayer1Id("");
      setPlayer2Id("");
      setTradeDescription("");

      // Refresh teams list to update rosters
      const { data: refreshedTeams } = await supabase.from("teams").select("*");
      setTeams(refreshedTeams ?? []);
    } catch (error: any) {
      setTradeMessage("Trade failed: " + error.message);
    } finally {
      setTradeLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-card rounded-lg shadow space-y-12">
      {/* Game Entry Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Secret Admin: Add Game Result</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full border rounded px-2 py-1"
              disabled={loading}
            >
              {teams.map((team) => (
                <option key={team.team_id} value={team.team_id}>
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
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded px-2 py-1"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Opponent</label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="Opponent team name"
              disabled={loading}
            />
          </div>
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
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit & Sync Stats"}
          </button>
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

      {/* Trade Admin Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Execute Player Trade (Two-Way Swap)</h2>
        {tradeMessage && (
          <div
            className={`mb-4 p-3 rounded ${
              tradeMessage.startsWith("Trade successful")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {tradeMessage}
          </div>
        )}

        <label className="block mb-2 font-semibold">
          Select Player 1 (From Team 1)
          <select
            className="w-full border rounded p-2 mt-1"
            value={player1Id}
            onChange={(e) => {
              setPlayer1Id(e.target.value);
              setTradeMessage(null);
            }}
            disabled={tradeLoading}
          >
            <option value="">-- Select Player 1 --</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="mt-1 text-sm text-gray-600">
            {player1Id ? `Team: ${findTeamByPlayerId(player1Id)?.name || "Unknown"}` : "-- Select Player 1 to see team --"}
          </div>
        </label>

        <label className="block mb-2 font-semibold">
          Select Player 2 (From Team 2)
          <select
            className="w-full border rounded p-2 mt-1"
            value={player2Id}
            onChange={(e) => {
              setPlayer2Id(e.target.value);
              setTradeMessage(null);
            }}
            disabled={tradeLoading}
          >
            <option value="">-- Select Player 2 --</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="mt-1 text-sm text-gray-600">
            {player2Id ? `Team: ${findTeamByPlayerId(player2Id)?.name || "Unknown"}` : "-- Select Player 2 to see team --"}
          </div>
        </label>

        <label className="block mb-4 font-semibold">
          Trade Description
          <input
            type="text"
            className="w-full border rounded p-2 mt-1"
            placeholder="e.g., Swap for draft pick"
            value={tradeDescription}
            onChange={(e) => setTradeDescription(e.target.value)}
            disabled={tradeLoading}
          />
        </label>

        <button
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleTrade}
          disabled={tradeLoading}
        >
          {tradeLoading ? "Processing..." : "Execute Trade"}
        </button>
      </section>
    </div>
  );
};

export default AdminGameEntry;


// import React, { useState } from "react";
// import { mockTeams, addGameResult, recalculateTeamStats, saveLeagueData } from "@/data/mockData";

// const AdminGameEntry = () => {
//   const [teamId, setTeamId] = useState(mockTeams[0]?.id || "");
//   const [date, setDate] = useState("");
//   const [opponent, setOpponent] = useState("");
//   const [points_for, setpoints_for] = useState("");
//   const [points_against, setpoints_against] = useState("");
//   const [result, setResult] = useState<"W" | "L">("W");
//   const [message, setMessage] = useState("");

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!teamId || !date || !opponent || !points_for || !points_against || !result) {
//       setMessage("Please fill out all fields.");
//       return;
//     }
//     const game = {
//       id: "g" + Date.now(),
//       date,
//       opponent,
//       points_for: Number(points_for),
//       points_against: Number(points_against),
//       result,
//     };
//     addGameResult(teamId, game);
//     recalculateTeamStats();
//     saveLeagueData();
//     setMessage("Game added and stats synced!");
//     setDate("");
//     setOpponent("");
//     setpoints_for("");
//     setpoints_against("");
//     setResult("W");
//   };

//   return (
//     <div className="max-w-md mx-auto mt-12 p-6 bg-card rounded-lg shadow">
//       <h2 className="text-2xl font-bold mb-4">Secret Admin: Add Game Result</h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block mb-1 font-semibold">Team</label>
//           <select
//             value={teamId}
//             onChange={e => setTeamId(e.target.value)}
//             className="w-full border rounded px-2 py-1"
//           >
//             {mockTeams.map(team => (
//               <option key={team.id} value={team.id}>
//                 {team.name}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block mb-1 font-semibold">Date</label>
//           <input
//             type="date"
//             value={date}
//             onChange={e => setDate(e.target.value)}
//             className="w-full border rounded px-2 py-1"
//           />
//         </div>
//         <div>
//           <label className="block mb-1 font-semibold">Opponent</label>
//           <input
//             type="text"
//             value={opponent}
//             onChange={e => setOpponent(e.target.value)}
//             className="w-full border rounded px-2 py-1"
//             placeholder="Opponent team name"
//           />
//         </div>
//         <div className="flex gap-2">
//           <div className="flex-1">
//             <label className="block mb-1 font-semibold">Points For</label>
//             <input
//               type="number"
//               value={points_for}
//               onChange={e => setpoints_for(e.target.value)}
//               className="w-full border rounded px-2 py-1"
//               min={0}
//             />
//           </div>
//           <div className="flex-1">
//             <label className="block mb-1 font-semibold">Points Against</label>
//             <input
//               type="number"
//               value={points_against}
//               onChange={e => setpoints_against(e.target.value)}
//               className="w-full border rounded px-2 py-1"
//               min={0}
//             />
//           </div>
//         </div>
//         <div>
//           <label className="block mb-1 font-semibold">Result</label>
//           <select
//             value={result}
//             onChange={e => setResult(e.target.value as "W" | "L")}
//             className="w-full border rounded px-2 py-1"
//           >
//             <option value="W">Win</option>
//             <option value="L">Loss</option>
//           </select>
//         </div>
//         <button
//           type="submit"
//           className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2"
//         >
//           Submit & Sync Stats
//         </button>
//         {message && (
//           <div className="mt-2 text-center text-green-600 font-semibold">{message}</div>
//         )}
//       </form>
//     </div>
//   );
// };

// export default AdminGameEntry;