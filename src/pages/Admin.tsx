"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Team = {
  team_id: string;
  name: string;
  player_ids?: string[];
};

type Player = {
  id: string;
  name: string;
  plus_minus?: number | null;
  games_played?: number | null;
};

type Game = {
  id: number;
  opponent: string;
  team_id: string;
  date: string;
  time?: string | null;
};

export default function AdminGameEntry() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [subPlayers, setSubPlayers] = useState<string[]>([]);

  const [availableSetNumbers, setAvailableSetNumbers] = useState<number[]>([]);
  const [setNo, setSetNo] = useState<number | null>(null);

  const [pointsFor, setPointsFor] = useState<string>("");
  const [pointsAgainst, setPointsAgainst] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Fetch all teams
  useEffect(() => {
    async function fetchTeams() {
      const { data, error } = await supabase
        .from("teams")
        .select("team_id, name, player_ids")
        .order("name", { ascending: true });
      if (error) {
        console.error("fetchTeams error:", error.message);
        setTeams([]);
      } else {
        setTeams(data ?? []);
      }
    }
    fetchTeams();
  }, []);

  // Fetch players & games when team changes
  useEffect(() => {
    async function fetchTeamRelated() {
      if (!teamId) {
        setPlayers([]);
        setGames([]);
        return;
      }

      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("id, opponent, date, time, team_id")
        .eq("team_id", teamId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (gamesError) {
        console.error("fetchGames error:", gamesError.message);
        setGames([]);
      } else {
        setGames(gamesData ?? []);
      }

      const team = teams.find((t) => t.team_id === teamId);
      const playerIds = team?.player_ids ?? [];

      if (playerIds.length === 0) {
        setPlayers([]);
        return;
      }

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name, plus_minus, games_played")
        .in("id", playerIds);

      if (playersError) {
        console.error("fetchPlayers error:", playersError.message);
        setPlayers([]);
      } else {
        setPlayers(playersData ?? []);
      }

      setSelectedGame(null);
      setAvailableSetNumbers([]);
      setSetNo(null);
      setSubPlayers([]);
      setPointsFor("");
      setPointsAgainst("");
    }

    fetchTeamRelated();
  }, [teamId, teams]);

  // Fetch sets for selected game & update available set numbers
  useEffect(() => {
    async function fetchSetsForGame(gameId: number) {
      if (!gameId) return;

      const { data: setsData, error } = await supabase
        .from("sets")
        .select("set_no")
        .eq("game_id", gameId)
        .order("set_no", { ascending: true });

      if (error) {
        console.error("fetchSetsForGame error:", error.message);
        setAvailableSetNumbers([]);
        setSetNo(null);
        return;
      }

      const existing = (setsData ?? []).map((s: any) => Number(s.set_no));
      const last = existing.length > 0 ? Math.max(...existing) : 0;
      const next = last + 1;

      const nums = Array.from({ length: next }, (_, i) => i + 1);
      setAvailableSetNumbers(nums);
      setSetNo(next);
    }

    if (selectedGame) {
      fetchSetsForGame(selectedGame);
      setSubPlayers([]);
      setPointsFor("");
      setPointsAgainst("");
    } else {
      setAvailableSetNumbers([]);
      setSetNo(null);
    }
  }, [selectedGame]);

  const toggleSubPlayer = (playerId: string) =>
    setSubPlayers((prev) => (prev.includes(playerId) ? prev.filter((p) => p !== playerId) : [...prev, playerId]));

  // Auto-detect result
  const parsedPF = Number(pointsFor || "0");
  const parsedPA = Number(pointsAgainst || "0");
  const resultLive = parsedPF === parsedPA ? "draw" : parsedPF > parsedPA ? "win" : "loss";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!teamId) return setMessage("Please choose a team.");
    if (!selectedGame) return setMessage("Please choose a game.");
    if (!setNo) return setMessage("Please choose a set number.");
    if (pointsFor === "" || pointsAgainst === "") return setMessage("Please enter PF and PA.");

    setLoading(true);

    try {
      // Prevent duplicate set number
      const { data: existing } = await supabase
        .from("sets")
        .select("id")
        .eq("game_id", selectedGame)
        .eq("set_no", setNo)
        .limit(1);

      if (existing && existing.length > 0) {
        setMessage(`Set ${setNo} is already recorded for this game.`);
        setLoading(false);
        return;
      }

      // Insert set with subbed_players
      const insertPayload = {
        game_id: selectedGame,
        set_no: setNo,
        points_for: parsedPF,
        points_against: parsedPA,
        result: resultLive,
        subbed_players: subPlayers,
      };

      const { error: insertError } = await supabase.from("sets").insert([insertPayload]);
      if (insertError) throw insertError;

      // Update players (skip subbed)
      for (const player of players) {
        if (subPlayers.includes(player.id)) continue;

        const currentPM = player.plus_minus ?? 0;
        const currentGP = player.games_played ?? 0;

        const { error: updatePlayerError } = await supabase
          .from("players")
          .update({ plus_minus: currentPM + (parsedPF - parsedPA), games_played: currentGP + 1 })
          .eq("id", player.id);

        if (updatePlayerError) throw updatePlayerError;
      }

      // Update team stats
      const { data: teamRow } = await supabase.from("teams").select("points_for, points_against, wins, losses").eq("team_id", teamId).single();
      if (teamRow) {
        const updatedStats: any = { points_for: (teamRow.points_for ?? 0) + parsedPF, points_against: (teamRow.points_against ?? 0) + parsedPA };
        if (resultLive === "win") updatedStats.wins = (teamRow.wins ?? 0) + 1;
        else if (resultLive === "loss") updatedStats.losses = (teamRow.losses ?? 0) + 1;

        await supabase.from("teams").update(updatedStats).eq("team_id", teamId);
      }

      setMessage(`Saved Set ${setNo} — Result: ${resultLive.toUpperCase()}`);
      setPointsFor("");
      setPointsAgainst("");
      setSubPlayers([]);

      // Refresh available set numbers
      const { data: latestSets } = await supabase
        .from("sets")
        .select("set_no")
        .eq("game_id", selectedGame)
        .order("set_no", { ascending: true });

      const existingNow = (latestSets ?? []).map((s: any) => Number(s.set_no));
      const lastNow = existingNow.length > 0 ? Math.max(...existingNow) : 0;
      setAvailableSetNumbers(Array.from({ length: lastNow + 1 }, (_, i) => i + 1));
      setSetNo(lastNow + 1);

    } catch (err: any) {
      console.error(err);
      setMessage("Error saving set: " + (err?.message ?? "unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card shadow-card max-w-3xl mx-auto mt-12">
      <CardHeader>
        <h2 className="text-xl font-bold">Admin: Record Game Set</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team */}
          <div>
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.team_id} value={t.team_id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Game */}
          <div>
            <Label>Game</Label>
            <Select value={selectedGame ? String(selectedGame) : ""} onValueChange={(val) => setSelectedGame(Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    {new Date(g.date).toLocaleDateString()} {g.time ?? ""} — vs {g.opponent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Set # */}
          <div>
            <Label>Set #</Label>
            <Select value={setNo ? String(setNo) : ""} onValueChange={(val) => setSetNo(Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Set number" />
              </SelectTrigger>
              <SelectContent>
                {availableSetNumbers.map((n) => <SelectItem key={n} value={n.toString()}>Set {n}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-1">Defaults to next set; you can override.</div>
          </div>

          {/* PF / PA */}
          <div className="flex gap-3">
            <div className="w-1/2">
              <Label>PF</Label>
              <Input value={pointsFor} onChange={(e) => setPointsFor(e.target.value)} type="number" className="bg-green-100" />
            </div>
            <div className="w-1/2">
              <Label>PA</Label>
              <Input value={pointsAgainst} onChange={(e) => setPointsAgainst(e.target.value)} type="number" className="bg-red-100" />
            </div>
          </div>

          {/* Live Result */}
          <div>
            <div className="text-sm font-medium">
              Result: <span className={resultLive === "win" ? "text-green-600" : resultLive === "loss" ? "text-red-600" : "text-yellow-600"}>
                {resultLive.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Subbed Players */}
          <div>
            <Label>Who needed a sub?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {players.map((p) => (
                <label key={p.id} className="flex items-center space-x-2">
                  <input type="checkbox" checked={subPlayers.includes(p.id)} onChange={() => toggleSubPlayer(p.id)} />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading} className="disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Saving..." : "Save Set"}
            </Button>
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
