import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Game {
  id: string;
  label: string;
  opponent: string | null;
  date: string | null;
  time: string | null;
  court: number | null;
}

interface Player {
  id: string;
  name: string;
  plus_minus: number | null;
  games_played: number | null;
}

const AdminGameEntry = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [games, setGames] = useState<Game[]>([]);
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

  const [players, setPlayers] = useState<Player[]>([]);
  const [subPlayers, setSubPlayers] = useState<string[]>([]);

  // Load teams
  useEffect(() => {
    async function loadTeams() {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) setMessage(`Error loading teams: ${error.message}`);
      else {
        setTeams(data ?? []);
        if (data && data.length > 0) setTeamId(data[0].team_id);
      }
    }
    loadTeams();
  }, []);

  // Load games for selected team
  useEffect(() => {
    async function loadGamesForTeam() {
      if (!teamId) return;

      const { data, error } = await supabase
        .from("games")
        .select("id, opponent, date, time, court")
        .eq("team_id", teamId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error || !data) {
        setGames([]);
        return;
      }

      const now = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(now.getDate() - 3);

      const filteredGames = data.filter((g) => {
        if (!g.date) return false;
        const gameDateTime = new Date(`${g.date}T${g.time || "00:00"}`);
        return gameDateTime >= threeDaysAgo;
      });

      const formattedGames: Game[] = filteredGames.map((g) => {
        const rawTime = g.time?.slice(0, 5) || "00:00";
        const [hourStr, minute] = rawTime.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        const formattedTime = `${hour}:${minute} ${ampm}`;
        const label = `${g.opponent} — ${g.date} ${formattedTime} (Court ${g.court ?? "?"})`;

        return {
          id: g.id.toString(),
          label,
          opponent: g.opponent,
          date: g.date,
          time: formattedTime,
          court: g.court,
        };
      });

      setGames(formattedGames);
      setSelectedGameId(formattedGames.length > 0 ? formattedGames[0].id : "");
    }

    loadGamesForTeam();
  }, [teamId]);

  // Load players for selected team
  useEffect(() => {
    async function loadPlayersForTeam() {
      if (!teamId) return;
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("player_ids")
        .eq("team_id", teamId)
        .single();

      if (teamError || !teamData?.player_ids) {
        setPlayers([]);
        return;
      }

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name, plus_minus, games_played")
        .in("id", teamData.player_ids);

      if (playersError) {
        setPlayers([]);
        return;
      }

      setPlayers(playersData ?? []);
    }

    loadPlayersForTeam();
    setSubPlayers([]); // reset subs when team changes
  }, [teamId]);

  // Helpers
  const toggleSubPlayer = (id: string) => {
    setSubPlayers((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  // Add set
  const handleAddSet = () => {
    if (!set_no || !set_points_for || !set_points_against) {
      setMessage("Please fill out all set fields.");
      return;
    }
    if (sets.some((s) => s.set_no === set_no)) {
      setMessage(`Set ${set_no} already exists.`);
      return;
    }

    const pf = Number(set_points_for);
    const pa = Number(set_points_against);
    const result: "W" | "L" = pf > pa ? "W" : "L";

    setSets([...sets, { set_no, points_for: pf, points_against: pa, result }]);
    setSetNo(set_no + 1);
    setSetPointsFor("");
    setSetPointsAgainst("");
    setSetResult("W");
    setMessage("");
  };

  const handleRemoveSet = (idx: number) => {
    setSets(sets.filter((_, i) => i !== idx));
  };

  // Submit sets
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
      // Insert sets
      const setsPayload = sets.map((set) => ({
        game_id: selectedGameId,
        set_no: set.set_no,
        points_for: set.points_for,
        points_against: set.points_against,
        result: set.result,
        subbed_players: subPlayers,
      }));

      const { error: setError } = await supabase.from("sets").insert(setsPayload);
      if (setError) throw setError;

      // Totals
      let totalPF = 0;
      let totalPA = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let totalTies = 0;

      sets.forEach((s) => {
        totalPF += s.points_for;
        totalPA += s.points_against;

        if (s.points_for === s.points_against) {
          totalTies += 1;
        } else if (s.result === "W") {
          totalWins += 1;
        } else {
          totalLosses += 1;
        }
      });

      const matchResult =
        totalWins > totalLosses ? "Win" : totalLosses > totalWins ? "Loss" : "Draw";

      // Update players (skip subs)
      for (const player of players) {
        if (subPlayers.includes(player.id)) continue;

        let updatedPlusMinus = player.plus_minus ?? 0;
        let updatedGamesPlayed = player.games_played ?? 0;

        sets.forEach((s) => {
          updatedPlusMinus += s.points_for - s.points_against;
          updatedGamesPlayed += 1;
        });

        const { error: updatePlayerError } = await supabase
          .from("players")
          .update({
            plus_minus: updatedPlusMinus,
            games_played: updatedGamesPlayed,
          })
          .eq("id", player.id);

        if (updatePlayerError) throw updatePlayerError;
      }

      // Update team totals
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("points_for, points_against, wins, losses")
        .eq("team_id", teamId)
        .single();

      if (teamError || !teamData) throw teamError;

      const updatedTeamStats = {
        points_for: (teamData.points_for ?? 0) + totalPF,
        points_against: (teamData.points_against ?? 0) + totalPA,
        wins: (teamData.wins ?? 0) + totalWins,
        losses: (teamData.losses ?? 0) + totalLosses,
      };

      const { error: updateTeamError } = await supabase
        .from("teams")
        .update(updatedTeamStats)
        .eq("team_id", teamId);

      if (updateTeamError) throw updateTeamError;

      // Reset form
      setMessage(
        `Sets added! Match result: ${matchResult} (${totalWins}W - ${totalLosses}L - ${totalTies}T)`
      );
      setSets([]);
      setSubPlayers([]);
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
  <div className="max-w-3xl mx-auto mt-10 px-4 sm:px-6">
    <section className="bg-card border border-border/50 rounded-xl shadow-sm">
      <div className="px-5 sm:px-6 py-5 border-b border-border/50">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Secret Admin: Add Sets to Game
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-8">
        {/* Team Selection */}
        <div>
          <label className="block mb-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Select Team
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map((team) => (
              <label
                key={team.team_id}
                className={`cursor-pointer rounded-lg border transition-all select-none
                  ${teamId === team.team_id
                    ? "border-primary ring-2 ring-primary/50 shadow-sm"
                    : "border-muted hover:shadow-sm"
                  }
                  flex flex-col items-center justify-center p-3 focus-within:ring-2 focus-within:ring-primary/60`}
              >
                <input
                  type="radio"
                  name="team"
                  value={team.team_id}
                  checked={teamId === team.team_id}
                  onChange={() => {
                    if (sets.length > 0) {
                      alert("Please finish or clear the sets for the current game before switching.");
                      return;
                    }
                    setTeamId(team.team_id);
                  }}
                  className="sr-only"
                />
                <img
                  src={`/logos/${team.team_id}.jpg`}
                  alt={team.name}
                  className="w-16 h-16 object-contain mb-2 rounded"
                />
                <span className="text-sm font-medium text-center">{team.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Game Selection */}
        <div>
          <label className="block mb-2 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Select Game
          </label>
          <div className="relative">
            <select
              value={selectedGameId}
              onChange={(e) => {
                if (sets.length > 0) {
                  alert("Please finish or clear the sets for the current game before switching.");
                  return;
                }
                setSelectedGameId(e.target.value);
              }}
              className="w-full border rounded-lg px-3 py-2 pr-9 bg-background focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50"
              disabled={loading}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ▾
            </span>
          </div>
        </div>

        {/* Who needed a sub? */}
        <div>
          <label className="block mb-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Who needed a sub?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {players.map((player) => {
              const checked = subPlayers.includes(player.id);
              return (
                <label
                  key={player.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition
                    ${checked
                      ? "bg-muted/60 border-primary ring-1 ring-primary/30"
                      : "bg-background border-muted hover:bg-muted/40"
                    }
                    focus-within:ring-2 focus-within:ring-primary/60`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubPlayer(player.id)}
                    className="h-4 w-4 rounded border-muted text-primary focus:ring-primary/60"
                  />
                  <span className="truncate">{player.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sets Entry */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Add Sets
            </label>
            {/* Live result preview pill */}
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm
                ${
                  Number(set_points_for) > Number(set_points_against)
                    ? "bg-green-500 text-white"
                    : Number(set_points_for) < Number(set_points_against)
                    ? "bg-red-500 text-white"
                    : "bg-amber-500/90 text-white"
                }`}
            >
              {Number(set_points_for) > Number(set_points_against)
                ? "WIN"
                : Number(set_points_for) < Number(set_points_against)
                ? "LOSS"
                : "DRAW"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center mb-2">
            {/* Set Number */}
            <input
              type="number"
              value={set_no}
              onChange={(e) => setSetNo(Number(e.target.value))}
              min={1}
              placeholder="Set #"
              className="col-span-1 border rounded-lg px-3 py-2 text-center font-semibold bg-background focus:outline-none focus:ring-2 focus:ring-primary/60"
            />

            {/* PF */}
            <input
              type="number"
              value={set_points_for}
              onChange={(e) => setSetPointsFor(e.target.value)}
              min={0}
              placeholder="PF"
              className="col-span-1 border rounded-lg px-3 py-2 text-center font-semibold
                         bg-green-50 text-green-700 border-green-300
                         placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* PA */}
            <input
              type="number"
              value={set_points_against}
              onChange={(e) => setSetPointsAgainst(e.target.value)}
              min={0}
              placeholder="PA"
              className="col-span-1 border rounded-lg px-3 py-2 text-center font-semibold
                         bg-red-50 text-red-700 border-red-300
                         placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {/* Result Display (read-only pill mirrors the live result) */}
            <div className="col-span-2 sm:col-span-2 flex justify-center sm:justify-start">
              <span
                className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-full shadow-sm
                  ${
                    Number(set_points_for) > Number(set_points_against)
                      ? "bg-green-100 text-green-700"
                      : Number(set_points_for) < Number(set_points_against)
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                aria-live="polite"
              >
                {Number(set_points_for) > Number(set_points_against)
                  ? "Win"
                  : Number(set_points_for) < Number(set_points_against)
                  ? "Loss"
                  : "Draw"}
              </span>
            </div>

            {/* Add Set Button */}
            <div className="col-span-2 sm:col-span-1">
              <button
                type="button"
                onClick={handleAddSet}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold
                           hover:bg-primary/90 active:scale-[0.99] transition focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                Add Set
              </button>
            </div>
          </div>

          {/* Sets List */}
          <div className="mt-3 space-y-2">
            {sets.map((set, idx) => {
              const isWin = set.points_for > set.points_against;
              const isLoss = set.points_for < set.points_against;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-muted/30 border border-muted rounded-lg px-3 py-2 shadow-sm"
                >
                  <span className="font-medium">
                    Set {set.set_no}:{" "}
                    <span className="text-green-700 font-semibold">{set.points_for}</span>
                    {" - "}
                    <span className="text-red-700 font-semibold">{set.points_against}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded
                        ${isWin ? "bg-green-100 text-green-700" : isLoss ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {isWin ? "WIN" : isLoss ? "LOSS" : "DRAW"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(idx)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500/40 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition focus:outline-none focus:ring-2 focus:ring-primary/60"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Sets"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-2 text-center font-semibold rounded-md px-3 py-2 ${
              message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")
                ? "text-red-700 bg-red-50 border border-red-200"
                : "text-green-700 bg-green-50 border border-green-200"
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
