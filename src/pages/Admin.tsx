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

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dupSetNos, setDupSetNos] = useState<number[]>([]);

  // NEW: fill-in modal states
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedMissingPlayer, setSelectedMissingPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [subFillIns, setSubFillIns] = useState<{ [playerId: string]: string[] }>({});

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

  // Load all players (for free agents and cross-team fill-ins)
  useEffect(() => {
    async function loadAllPlayers() {
      const { data, error } = await supabase.from("players").select("id, name, plus_minus, games_played");
      if (!error && data) setAllPlayers(data);
    }
    loadAllPlayers();
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
      setSubPlayers([]); // reset subs when team changes
      setSubFillIns({});
    }

    loadPlayersForTeam();
  }, [teamId]);

  // Handle sub selection
  const toggleSubPlayer = (player: Player) => {
    const already = subPlayers.includes(player.id);
    if (already) {
      setSubPlayers(subPlayers.filter((id) => id !== player.id));
      const { [player.id]: _, ...rest } = subFillIns;
      setSubFillIns(rest);
    } else {
      setSubPlayers([...subPlayers, player.id]);
      setSelectedMissingPlayer(player);
      setShowSubModal(true);
    }
  };

  const toggleSubFillIn = (missingPlayerId: string, fillInId: string) => {
    setSubFillIns((prev) => {
      const current = prev[missingPlayerId] ?? [];
      const exists = current.includes(fillInId);
      return {
        ...prev,
        [missingPlayerId]: exists ? current.filter((id) => id !== fillInId) : [...current, fillInId],
      };
    });
  };

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

  // Submit logic
  const doSubmit = async () => {
    setConfirming(true);
    setMessage("");

    try {
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

      let totalPF = 0;
      let totalPA = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let totalTies = 0;

      sets.forEach((s) => {
        totalPF += s.points_for;
        totalPA += s.points_against;

        if (s.points_for === s.points_against) totalTies += 1;
        else if (s.result === "W") totalWins += 1;
        else totalLosses += 1;
      });

      const matchResult =
        totalWins > totalLosses ? "Win" : totalLosses > totalWins ? "Loss" : "Draw";

      // Update non-sub players
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

      // Update sub fill-in players
      for (const missingPlayerId in subFillIns) {
        const fillIns = subFillIns[missingPlayerId];
        for (const fillInId of fillIns) {
          const { data: subData } = await supabase
            .from("players")
            .select("plus_minus, games_played")
            .eq("id", fillInId)
            .single();

          let updatedPlusMinus = subData?.plus_minus ?? 0;
          let updatedGamesPlayed = subData?.games_played ?? 0;

          sets.forEach((s) => {
            updatedPlusMinus += s.points_for - s.points_against;
            updatedGamesPlayed += 1;
          });

          const { error: updateError } = await supabase
            .from("players")
            .update({ plus_minus: updatedPlusMinus, games_played: updatedGamesPlayed })
            .eq("id", fillInId);

          if (updateError) throw updateError;
        }
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

      setMessage(`Sets added! Match result: ${matchResult} (${totalWins}W - ${totalLosses}L - ${totalTies}T)`);
      setSets([]);
      setSubPlayers([]);
      setSubFillIns({});
      setSetNo(1);
      setSetPointsFor("");
      setSetPointsAgainst("");
      setSetResult("W");
      setShowConfirm(false);
    } catch (error) {
      setMessage("Unexpected error: " + (error as Error).message);
    } finally {
      setConfirming(false);
      setLoading(false);
    }
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
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

    const setNos = sets.map((s) => s.set_no);
    const { data: existing, error } = await supabase
      .from("sets")
      .select("set_no")
      .eq("game_id", selectedGameId)
      .in("set_no", setNos);

    if (error) {
      setMessage(`Error checking duplicates: ${error.message}`);
      setLoading(false);
      return;
    }

    const dups = (existing ?? []).map((r: { set_no: number }) => r.set_no);
    setDupSetNos(dups);

    setShowConfirm(true);
    setLoading(false);
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
          {/* Team & game selection */}
          <div className="flex flex-col gap-3">
            <label>Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {teams.map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <label>Game</label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sets */}
          <div className="space-y-2">
            <h3 className="font-semibold">Add Set</h3>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Set #"
                value={set_no}
                onChange={(e) => setSetNo(Number(e.target.value))}
                className="border px-2 py-1 rounded w-20"
              />
              <input
                type="number"
                placeholder="Points For"
                value={set_points_for}
                onChange={(e) => setSetPointsFor(e.target.value)}
                className="border px-2 py-1 rounded w-24"
              />
              <input
                type="number"
                placeholder="Points Against"
                value={set_points_against}
                onChange={(e) => setSetPointsAgainst(e.target.value)}
                className="border px-2 py-1 rounded w-24"
              />
              <button
                type="button"
                onClick={handleAddSet}
                className="px-3 py-1 bg-primary text-white rounded"
              >
                Add
              </button>
            </div>
          </div>

          {/* Current sets */}
          <div>
            {sets.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center border-b py-1">
                <span>Set {s.set_no}: {s.points_for}-{s.points_against} ({s.result})</span>
                <button type="button" onClick={() => handleRemoveSet(idx)} className="text-red-500">Remove</button>
              </div>
            ))}
          </div>

          {/* Subs */}
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
                      ${checked ? "bg-muted/60 border-primary ring-1 ring-primary/30" : "bg-background border-muted hover:bg-muted/40"}
                      focus-within:ring-2 focus-within:ring-primary/60`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubPlayer(player)}
                      className="h-4 w-4 rounded border-muted text-primary focus:ring-primary/60"
                    />
                    <span className="truncate">{player.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded">
              Submit
            </button>
          </div>

          {message && <p className="text-red-600">{message}</p>}
        </form>
      </section>

      {/* Sub modal */}
      {showSubModal && selectedMissingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-background border border-border/60 rounded-xl shadow-xl p-5 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              Fill-in for {selectedMissingPlayer.name}
            </h3>

            <div className="max-h-60 overflow-y-auto">
              {allPlayers
                .filter((p) => p.id !== selectedMissingPlayer.id)
                .map((p) => {
                  const selected = subFillIns[selectedMissingPlayer.id]?.includes(p.id) ?? false;
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition
                        ${selected ? "bg-primary/20 border-primary" : "border-muted hover:bg-muted/20"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSubFillIn(selectedMissingPlayer.id, p.id)}
                        className="h-4 w-4 rounded border-muted text-primary focus:ring-primary/60"
                      />
                      {p.name}
                    </label>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGameEntry;
