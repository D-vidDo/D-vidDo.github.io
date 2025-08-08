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
  const [players, setPlayers] = useState<{id: number; name: string}[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [from_teamId, setfrom_teamId] = useState<string>("");
  const [to_teamId, setto_teamId] = useState<string>("");
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string>("");
  const [from_team2Id, setFromTeam2Id] = useState<string>("");
  const [to_team2Id, setToTeam2Id] = useState<string>("");
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
      let points_for_total = teamData.points_for ?? 0;
      let points_against_total = teamData.points_against ?? 0;

      if (result === "W") wins += 1;
      else if (result === "L") losses += 1;

      points_for_total += newGame.points_for;
      points_against_total += newGame.points_against;

      // Update team record
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

  // Find the team the selected player currently belongs to, comparing IDs as strings to avoid type mismatch
  const playerCurrentTeam = teams.find((team) =>
    Array.isArray(team.player_ids) &&
    team.player_ids.some((id: any) => String(id) === String(selectedPlayerId))
  );

  const player2CurrentTeam = teams.find((team) =>
    Array.isArray(team.player_ids) &&
    team.player_ids.some((id: any) => String(id) === String(selectedPlayer2Id))
  );

  const selectedPlayer = players.find((p) => String(p.id) === String(selectedPlayerId));
  const selectedPlayer2 = players.find((p) => String(p.id) === String(selectedPlayer2Id));

  useEffect(() => {
    setfrom_teamId(playerCurrentTeam ? playerCurrentTeam.team_id : "");
  }, [playerCurrentTeam]);

  useEffect(() => {
    setFromTeam2Id(player2CurrentTeam ? player2CurrentTeam.team_id : "");
  }, [player2CurrentTeam]);

  const handleTrade = async () => {
    if (
      !selectedPlayerId || !from_teamId || !to_teamId ||
      !selectedPlayer2Id || !from_team2Id || !to_team2Id ||
      !tradeDescription
    ) {
      setTradeMessage("Please fill all trade fields.");
      return;
    }

    if (
      from_teamId === to_teamId ||
      from_team2Id === to_team2Id
    ) {
      setTradeMessage("From and To teams must be different for both players.");
      return;
    }

    if (from_teamId !== to_team2Id || from_team2Id !== to_teamId) {
      setTradeMessage("Teams must be swapped between the two players.");
      return;
    }

    setTradeLoading(true);
    setTradeMessage(null);

    try {
      // Remove first player from their from team
      const fromTeam1 = teams.find(t => t.team_id === from_teamId);
      if (!fromTeam1) throw new Error("From Team 1 not found");

      const newFromRoster1 = (fromTeam1.player_ids || []).filter((id: any) => String(id) !== String(selectedPlayerId));
      const { error: fromError1 } = await supabase
        .from("teams")
        .update({ player_ids: newFromRoster1 })
        .eq("team_id", from_teamId);
      if (fromError1) throw fromError1;

      // Add first player to their to team
      const toTeam1 = teams.find(t => t.team_id === to_teamId);
      if (!toTeam1) throw new Error("To Team 1 not found");

      const newToRoster1 = Array.from(new Set([...(toTeam1.player_ids || []), selectedPlayerId]));
      const { error: toError1 } = await supabase
        .from("teams")
        .update({ player_ids: newToRoster1 })
        .eq("team_id", to_teamId);
      if (toError1) throw toError1;

      // Remove second player from their from team
      const fromTeam2 = teams.find(t => t.team_id === from_team2Id);
      if (!fromTeam2) throw new Error("From Team 2 not found");

      const newFromRoster2 = (fromTeam2.player_ids || []).filter((id: any) => String(id) !== String(selectedPlayer2Id));
      const { error: fromError2 } = await supabase
        .from("teams")
        .update({ player_ids: newFromRoster2 })
        .eq("team_id", from_team2Id);
      if (fromError2) throw fromError2;

      // Add second player to their to team
      const toTeam2 = teams.find(t => t.team_id === to_team2Id);
      if (!toTeam2) throw new Error("To Team 2 not found");

      const newToRoster2 = Array.from(new Set([...(toTeam2.player_ids || []), selectedPlayer2Id]));
      const { error: toError2 } = await supabase
        .from("teams")
        .update({ player_ids: newToRoster2 })
        .eq("team_id", to_team2Id);
      if (toError2) throw toError2;

      // Insert trade record (with both players traded)
      const { error: tradeInsertError } = await supabase.from("trades").insert([
        {
          date: new Date().toISOString(),
          description: tradeDescription,
          players_traded: [
            {
              player: { name: selectedPlayer?.name },
              from_team: fromTeam1?.name,
              to_team: toTeam1?.name,
            },
            {
              player: { name: selectedPlayer2?.name },
              from_team: fromTeam2?.name,
              to_team: toTeam2?.name,
            },
          ],
        },
      ]);
      if (tradeInsertError) throw tradeInsertError;

      setTradeMessage(`Trade successful! ${selectedPlayer?.name} swapped with ${selectedPlayer2?.name}.`);
      setSelectedPlayerId("");
      setfrom_teamId("");
      setto_teamId("");
      setSelectedPlayer2Id("");
      setFromTeam2Id("");
      setToTeam2Id("");
      setTradeDescription("");

      // Refresh teams (rosters)
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

        {/* Player 1 */}
        <label className="block mb-2 font-semibold">
          Select Player 1 to Trade
          <select
            className="w-full border rounded p-2 mt-1"
            value={selectedPlayerId}
            onChange={(e) => {
              setSelectedPlayerId(e.target.value);
              setTradeMessage(null);
            }}
            disabled={tradeLoading}
          >
            <option value="">-- Select Player 1 --</option>
            {players.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-2 font-semibold">
          From Team (Player 1)
          <div className="w-full border rounded p-2 mt-1 bg-gray-100 text-gray-700">
            {playerCurrentTeam?.name || "-- Select Player 1 First --"}
          </div>
        </label>

        <label className="block mb-2 font-semibold">
          To Team (Player 1)
          <select
            className="w-full border rounded p-2 mt-1"
            value={to_teamId}
            onChange={(e) => setto_teamId(e.target.value)}
            disabled={tradeLoading}
          >
            <option value="">-- Select Team --</option>
            {teams
              .filter((t) => t.team_id !== from_teamId)
              .map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>

        <hr className="my-6 border-gray-300" />

        {/* Player 2 */}
        <label className="block mb-2 font-semibold">
          Select Player 2 to Trade
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
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-2 font-semibold">
          From Team (Player 2)
          <div className="w-full border rounded p-2 mt-1 bg-gray-100 text-gray-700">
            {player2CurrentTeam?.name || "-- Select Player 2 First --"}
          </div>
        </label>

        <label className="block mb-2 font-semibold">
          To Team (Player 2)
          <select
            className="w-full border rounded p-2 mt-1"
            value={to_team2Id}
            onChange={(e) => setToTeam2Id(e.target.value)}
            disabled={tradeLoading}
          >
            <option value="">-- Select Team --</option>
            {teams
              .filter((t) => t.team_id !== from_team2Id)
              .map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>

        <label className="block mb-2 font-semibold">
          Trade Description
          <textarea
            className="w-full border rounded p-2 mt-1"
            value={tradeDescription}
            onChange={(e) => setTradeDescription(e.target.value)}
            placeholder="Enter details or reasoning for this trade"
            disabled={tradeLoading}
          />
        </label>

        <button
          onClick={handleTrade}
          className="w-full bg-primary text-primary-foreground py-2 rounded font-bold mt-2"
          disabled={tradeLoading}
        >
          {tradeLoading ? "Processing Trade..." : "Execute Trade"}
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