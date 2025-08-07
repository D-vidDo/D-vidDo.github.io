import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = 'https://bqqotvjpvaznkjfldcgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW90dmpwdmF6bmtqZmxkY2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDE4NjEsImV4cCI6MjA3MDAxNzg2MX0.VPClABOucYEo-bVPg_brc6WvSx17zR4LADC2FEWdI5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AdminGameEntry = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [pointsFor, setPointsFor] = useState("");
  const [pointsAgainst, setPointsAgainst] = useState("");
  const [result, setResult] = useState<"W" | "L">("W");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId || !date || !opponent || !pointsFor || !pointsAgainst || !result) {
      setMessage("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    const newGame = {
      id: "g" + Date.now(),
      date,
      opponent,
      pointsFor: Number(pointsFor),
      pointsAgainst: Number(pointsAgainst),
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

      points_for += newGame.pointsFor;
      points_against += newGame.pointsAgainst;

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
        const { data: players, error: playersError } = await supabase
          .from("players")
          .select("*")
          .in("id", teamData.player_ids);

        if (playersError) {
          setMessage(`Failed to fetch players: ${playersError.message}`);
          setLoading(false);
          return;
        }

        for (const player of players) {
          const updatedPlusMinus = (player.plus_minus ?? 0) + (newGame.pointsFor - newGame.pointsAgainst);
          const updatedGamesPlayed = (player.games_played ?? 0) + 1;

          const { error: updatePlayerError } = await supabase
            .from("players")
            .update({ plus_minus: updatedPlusMinus, games_played: updatedGamesPlayed })
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
      setPointsFor("");
      setPointsAgainst("");
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

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-card rounded-lg shadow">
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
              value={pointsFor}
              onChange={(e) => setPointsFor(e.target.value)}
              className="w-full border rounded px-2 py-1"
              min={0}
              disabled={loading}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-semibold">Points Against</label>
            <input
              type="number"
              value={pointsAgainst}
              onChange={(e) => setPointsAgainst(e.target.value)}
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
//   const [pointsFor, setPointsFor] = useState("");
//   const [pointsAgainst, setPointsAgainst] = useState("");
//   const [result, setResult] = useState<"W" | "L">("W");
//   const [message, setMessage] = useState("");

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!teamId || !date || !opponent || !pointsFor || !pointsAgainst || !result) {
//       setMessage("Please fill out all fields.");
//       return;
//     }
//     const game = {
//       id: "g" + Date.now(),
//       date,
//       opponent,
//       pointsFor: Number(pointsFor),
//       pointsAgainst: Number(pointsAgainst),
//       result,
//     };
//     addGameResult(teamId, game);
//     recalculateTeamStats();
//     saveLeagueData();
//     setMessage("Game added and stats synced!");
//     setDate("");
//     setOpponent("");
//     setPointsFor("");
//     setPointsAgainst("");
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
//               value={pointsFor}
//               onChange={e => setPointsFor(e.target.value)}
//               className="w-full border rounded px-2 py-1"
//               min={0}
//             />
//           </div>
//           <div className="flex-1">
//             <label className="block mb-1 font-semibold">Points Against</label>
//             <input
//               type="number"
//               value={pointsAgainst}
//               onChange={e => setPointsAgainst(e.target.value)}
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