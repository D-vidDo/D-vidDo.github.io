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
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState("");
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState("");
  const [tradeDescription, setTradeDescription] = useState("");
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);

  useEffect(() => {
    // Load teams on mount
    async function loadTeams() {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) {
        setMessage(`Error loading teams: ${error.message}`);
      } else {
        console.log("Teams loaded:", data);
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

  // Helper: Find team by player id with defensive checks
  const findTeamByPlayerId = (playerId: string) => {
    if (!playerId || teams.length === 0) return null;
    return teams.find(team => Array.isArray(team.player_ids) && team.player_ids.includes(playerId)) || null;
  };

  // Game Entry Submit Handler (unchanged, omitted for brevity)...

  // Trade handler for 2-way trade
  const handleTrade = async () => {
    if (!selectedPlayer1Id || !selectedPlayer2Id || !tradeDescription) {
      setTradeMessage("Please select both players and fill the trade description.");
      return;
    }
    if (selectedPlayer1Id === selectedPlayer2Id) {
      setTradeMessage("Cannot trade the same player.");
      return;
    }

    const fromTeam1 = findTeamByPlayerId(selectedPlayer1Id);
    const fromTeam2 = findTeamByPlayerId(selectedPlayer2Id);

    if (!fromTeam1 || !fromTeam2) {
      setTradeMessage("One or both players' teams not found.");
      return;
    }

    // Teams must be different to trade players
    if (fromTeam1.team_id === fromTeam2.team_id) {
      setTradeMessage("Both players belong to the same team. Trades require players from different teams.");
      return;
    }

    setTradeLoading(true);
    setTradeMessage(null);

    try {
      // Remove player1 from their team and add player2
      const updatedTeam1Roster = (fromTeam1.player_ids || [])
        .filter((id: string) => id !== selectedPlayer1Id)
        .concat(selectedPlayer2Id);
      const { error: errorTeam1 } = await supabase
        .from("teams")
        .update({ player_ids: updatedTeam1Roster })
        .eq("team_id", fromTeam1.team_id);
      if (errorTeam1) throw errorTeam1;

      // Remove player2 from their team and add player1
      const updatedTeam2Roster = (fromTeam2.player_ids || [])
        .filter((id: string) => id !== selectedPlayer2Id)
        .concat(selectedPlayer1Id);
      const { error: errorTeam2 } = await supabase
        .from("teams")
        .update({ player_ids: updatedTeam2Roster })
        .eq("team_id", fromTeam2.team_id);
      if (errorTeam2) throw errorTeam2;

      // Insert trade records for both players into players_traded table
      const player1 = players.find(p => p.id === selectedPlayer1Id);
      const player2 = players.find(p => p.id === selectedPlayer2Id);

      if (!player1 || !player2) {
        setTradeMessage("Selected players not found in player list.");
        setTradeLoading(false);
        return;
      }

      const { error: tradeInsertError } = await supabase.from("players_traded").insert([
        {
          trade_date: new Date().toISOString(),
          player_id: player1.id,
          from_team_id: fromTeam1.team_id,
          to_team_id: fromTeam2.team_id,
          description: tradeDescription,
        },
        {
          trade_date: new Date().toISOString(),
          player_id: player2.id,
          from_team_id: fromTeam2.team_id,
          to_team_id: fromTeam1.team_id,
          description: tradeDescription,
        }
      ]);
      if (tradeInsertError) throw tradeInsertError;

      setTradeMessage(`Trade successful! ${player1.name} and ${player2.name} have been swapped between ${fromTeam1.name} and ${fromTeam2.name}.`);

      // Reset selections
      setSelectedPlayer1Id("");
      setSelectedPlayer2Id("");
      setTradeDescription("");

      // Refresh teams
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
        {/* The game entry form remains unchanged, you can keep your existing code here */}
      </section>

      {/* Trade Admin Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Execute 2-Way Player Trade</h2>
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
          Select Player 1 to Trade Out
          <select
            className="w-full border rounded p-2 mt-1"
            value={selectedPlayer1Id}
            onChange={(e) => {
              setSelectedPlayer1Id(e.target.value);
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
            {selectedPlayer1Id ? `Team: ${findTeamByPlayerId(selectedPlayer1Id)?.name ?? "Not found"}` : "-- Select Player 1 to see team --"}
          </div>
        </label>

        <label className="block mb-2 font-semibold">
          Select Player 2 to Trade In
          <select
            className="w-full border rounded p-2 mt-1"
            value={selectedPlayer2Id}
            onChange={(e) => {
              setSelectedPlayer2Id(e.target.value);
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
            {selectedPlayer2Id ? `Team: ${findTeamByPlayerId(selectedPlayer2Id)?.name ?? "Not found"}` : "-- Select Player 2 to see team --"}
          </div>
        </label>

        <label className="block mb-4 font-semibold">
          Trade Description
          <input
            type="text"
            className="w-full border rounded p-2 mt-1"
            placeholder="e.g., Traded for draft pick"
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