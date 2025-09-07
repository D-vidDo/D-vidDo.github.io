import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type GameOption = { id: string; label: string };
type TeamRow = any;

type SetRow = {
  id: number;
  set_no: number | null;
  vod_link: string | null;
  points_for?: number | null;
  points_against?: number | null;
  result?: string | null;
};

const ytPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;

// Normalize common YouTube formats to a canonical watch URL
function normalizeYouTubeUrl(input: string): string {
  try {
    const trimmed = input.trim();
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      const t = url.searchParams.get("t");
      return `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}` : ""}`;
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      const t = url.searchParams.get("t");
      if (id) return `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}` : ""}`;
    }
    return trimmed;
  } catch {
    return input.trim();
  }
}

const AdminSetVodLink: React.FC = () => {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [teamId, setTeamId] = useState<string>("");

  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");

  const [sets, setSets] = useState<SetRow[]>([]);
  const [setNo, setSetNo] = useState<number>(1);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load teams (same pattern as your AdminGameEntry)
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
    loadTeams();
  }, []);

  // Load games for selected team and build labels similar to your code
  useEffect(() => {
    async function loadGamesForTeam() {
      if (!teamId) return;

      const { data, error } = await supabase
        .from("games")
        .select("id, opponent, date, time, court")
        .eq("team_id", teamId);

      if (error || !data) {
        setGames([]);
        setSelectedGameId("");
        return;
      }

      const formatted = data.map((g: any) => {
        const rawTime = g.time?.slice(0, 5) || "";
        const [hourStr, minute] = rawTime.split(":");
        let hour = parseInt(hourStr || "0", 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        const formattedTime = rawTime ? `${hour}:${minute} ${ampm}` : "";
        const label = `${g.opponent} — ${g.date ?? ""} ${formattedTime} ${
          g.court ? `(Court ${g.court})` : ""
        }`;
        return { id: String(g.id), label };
      });

      setGames(formatted);
      if (formatted.length > 0) setSelectedGameId(formatted[0].id);
    }

    loadGamesForTeam();
  }, [teamId]);

  // Load sets for selected game so the admin can see existing and VOD status
  useEffect(() => {
    async function loadSets() {
      if (!selectedGameId) {
        setSets([]);
        return;
      }
      const { data, error } = await supabase
        .from("sets")
        .select("id, set_no, vod_link, points_for, points_against, result")
        .eq("game_id", selectedGameId)
        .order("set_no", { ascending: true });

      if (error) {
        setSets([]);
        return;
      }

      setSets(data ?? []);
      // Auto-advance setNo: choose max existing + 1, else 1
      const existingNos = (data ?? [])
        .map((s) => s.set_no)
        .filter((n): n is number => typeof n === "number");
      const next = existingNos.length ? Math.max(...existingNos) + 1 : 1;
      setSetNo(next);
    }
    loadSets();
  }, [selectedGameId]);

  const isValidYouTube = useMemo(() => ytPattern.test(youtubeUrl.trim()), [youtubeUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!teamId) {
      setMessage("Please select a team.");
      return;
    }
    if (!selectedGameId) {
      setMessage("Please select a game.");
      return;
    }
    if (!setNo || setNo < 1) {
      setMessage("Please enter a valid set number (>= 1).");
      return;
    }
    if (!youtubeUrl.trim() || !isValidYouTube) {
      setMessage("Please provide a valid YouTube URL.");
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizeYouTubeUrl(youtubeUrl);

      // Try to find existing set row for (game_id, set_no)
      const { data: existing, error: findErr } = await supabase
        .from("sets")
        .select("id")
        .eq("game_id", selectedGameId)
        .eq("set_no", setNo)
        .maybeSingle();

      if (findErr) {
        setMessage(`Failed to query sets: ${findErr.message}`);
        setLoading(false);
        return;
      }

      if (existing?.id) {
        // Update existing row
        const { error: updateErr } = await supabase
          .from("sets")
          .update({ vod_link: normalized })
          .eq("id", existing.id);

        if (updateErr) {
          setMessage(`Failed to update VOD link: ${updateErr.message}`);
          setLoading(false);
          return;
        }
      } else {
        // Insert new set row (if it wasn't recorded yet)
        const { error: insertErr } = await supabase.from("sets").upsert({
          game_id: selectedGameId,
          set_no: setNo,
          vod_link: normalized,
        }, { onConflict: 'game_id,set_no' });

        if (insertErr) {
          setMessage(`Failed to insert set with VOD: ${insertErr.message}`);
          setLoading(false);
          return;
        }
      }

      setMessage("VOD link saved ✅");
      setYoutubeUrl("");

      // Refresh sets list
      const { data: refreshed } = await supabase
        .from("sets")
        .select("id, set_no, vod_link, points_for, points_against, result")
        .eq("game_id", selectedGameId)
        .order("set_no", { ascending: true });

      setSets(refreshed ?? []);
    } catch (err: any) {
      setMessage("Unexpected error: " + err?.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 p-4 sm:p-6 bg-card rounded-lg shadow space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Secret Admin: Attach VOD to Set</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Selection (radio tiles with logos) */}
          <div>
            <label className="block mb-2 font-semibold">Select Team</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

          {/* Game Selection */}
          <div>
            <label className="block mb-1 font-semibold">Select Game</label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="w-full border rounded px-2 py-2"
              disabled={loading || games.length === 0}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.label}
                </option>
              ))}
            </select>
          </div>

          {/* Set + YouTube URL */}
          <div>
            <label className="block mb-2 font-semibold">Attach YouTube VOD</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <input
                type="number"
                value={setNo}
                onChange={(e) => setSetNo(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                placeholder="Set Number"
                className="border rounded px-2 py-2 w-full sm:w-28"
              />
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="border rounded px-2 py-2 flex-1 min-w-[16rem]"
                required
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground py-2 px-4 rounded font-bold w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save VOD Link"}
              </button>
            </div>
            {!isValidYouTube && youtubeUrl.trim() !== "" && (
              <div className="text-sm text-red-600">Enter a valid YouTube link (youtube.com or youtu.be).</div>
            )}
          </div>

          {/* Existing sets for selected game */}
          {!!sets.length && (
            <div>
              <h3 className="font-semibold mb-2">Existing Sets for Selected Game</h3>
              <ul className="space-y-1">
                {sets
                  .filter((s) => s.set_no !== null)
                  .map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between border rounded px-2 py-1"
                    >
                      <span className="text-sm">
                        Set {s.set_no}
                        {typeof s.points_for === "number" &&
                        typeof s.points_against === "number"
                          ? ` — ${s.points_for}-${s.points_against}`
                          : ""}
                        {s.result ? ` (${s.result})` : ""} •{" "}
                        {s.vod_link ? (
                          <a
                            href={s.vod_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-700 underline"
                          >
                            VOD ✓
                          </a>
                        ) : (
                          <em className="text-muted-foreground">No VOD</em>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSetNo(Number(s.set_no))}
                          className="text-xs underline"
                        >
                          Use
                        </button>
                        {s.vod_link && (
                          <button
                            type="button"
                            onClick={() => setYoutubeUrl(s.vod_link || "")}
                            className="text-xs underline"
                          >
                            Load Link
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`mt-2 text-center font-semibold ${
                message.toLowerCase().includes("failed") ||
                message.toLowerCase().includes("error")
                  ? "text-red-600"
                  : "text-green-600"
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

export default AdminSetVodLink;
