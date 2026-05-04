/**
 * History.tsx
 *
 * Displays a full retrospective view of a completed season.
 * Rendered once per season — receives a `seasonId` prop from the router.
 *
 * ── Data Sources (Supabase) ──────────────────────────────────────────────────
 *
 *   seasons      → season name/metadata                     (1 row)
 *   teams        → team standings, colours, captain         (n rows, season_id scoped)
 *   players_old  → archived player stats for that season    (n rows, season_id scoped)
 *   games        → match records for that season            (n rows, season_id scoped)
 *   sets         → individual set scores per game           (n rows, season_id scoped)
 *
 * ── Why players_old and not players? ────────────────────────────────────────
 *
 *   `players` = current live roster (no season_id, always "this season").
 *   `players_old` = historical archive. At season end, current player rows are
 *   manually copied into players_old with the completed season_id stamped on them.
 *   This page always reads from players_old.
 *
 * ── Team Colours on Player Cards ────────────────────────────────────────────
 *
 *   players_old has no team_id FK — team membership is tracked via teams.player_ids
 *   (a JSONB array). After fetching both, enrichPlayers() cross-references
 *   teams.player_ids to attach teamColor/teamColor2 onto each player row so
 *   PlayerCard can render its gradient header.
 *
 * ── Awards ──────────────────────────────────────────────────────────────────
 *
 *   Currently hardcoded in this file per season. When you're ready to manage
 *   them in the DB, create an `awards` table:
 *     (id, season_id FK, title text, winner text, team text, icon text)
 *   Then replace the hardcoded array with a fetch inside the useEffect below.
 *
 * ── Adding a New Season ──────────────────────────────────────────────────────
 *
 *   1. Copy current `players` rows into `players_old` with the new season_id.
 *   2. Add a new row to `seasons`.
 *   3. Update the hardcoded `awards` array below (or move to DB — see above).
 *   4. No component changes needed — PlayerCard auto-adjusts to any stat set.
 */

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PlayerCard, { Player } from "@/components/PlayerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Types ────────────────────────────────────────────────────────────────────
 * Local types for data that isn't passed into PlayerCard.
 * Player type is imported from PlayerCard.tsx and covers players_old rows.
 * --------------------------------------------------------------------------- */

interface Season {
  season_id: number;
  name: string;
}

/**
 * Mirrors the `teams` table.
 * Notable: player_ids is a JSONB array of player IDs on this team.
 * Used by enrichPlayers() to resolve which team each player belongs to.
 */
interface Team {
  team_id: number;
  name: string | null;
  wins: number | null;
  losses: number | null;
  captain: string | null;
  color?: string | null;   // primary team colour (hex)
  color2?: string | null;  // secondary team colour (hex) — used in gradients
  points_for: number | null;
  points_against: number | null;
  split_wins: number | null;
  season_id: number | null;
  player_ids?: any[] | null; // JSONB array of player IDs on this team
  games?: any[] | null;      // JSONB array of game references (denormalized)
}

/**
 * Mirrors the `games` table row, augmented with its child `sets` after fetch.
 * games.team_id references which of our teams played in this game.
 */
interface Game {
  id: number;
  team_id: number | null;
  date: string | null;
  time: string | null;
  opponent: string | null;
  season_id: number | null;
  sets: SetRow[];           // populated client-side by matching sets.game_id
}

/**
 * Mirrors the `sets` table row, with `result` computed client-side.
 * result: "W" | "L" | "T" — derived from points_for vs points_against.
 */
interface SetRow {
  id: number;
  game_id: number;
  set_no: number | null;
  points_for: number | null;
  points_against: number | null;
  result: string | null;   // computed, not stored in DB
  vod_link?: string | null;
  season_id: number | null;
}

/** One entry in the season awards display. */
interface Award {
  title: string;   // e.g. "Most Valuable Player"
  winner: string;  // player name
  team: string;    // team name or path (e.g. "Brawl > Brawl > Bull")
  icon: string;    // emoji
}

/* ── Helpers ──────────────────────────────────────────────────────────────────
 * --------------------------------------------------------------------------- */

/** Converts a 24h "HH:MM:SS" time string from Supabase to 12h display format. */
const formatTime12H = (time?: string | null): string => {
  if (!time) return "—";
  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

/**
 * Enriches raw players_old rows with team colour data from the teams table.
 *
 * players_old has no team_id FK — team membership lives in teams.player_ids
 * (a JSONB array of player IDs). This function cross-references that array
 * to find each player's team and attach teamColor / teamColor2 / team name
 * so PlayerCard can render its gradient header correctly.
 *
 * Returns a new array — does not mutate the inputs.
 */
const enrichPlayers = (rawPlayers: any[], teams: Team[]): Player[] =>
  rawPlayers.map((p) => {
    // Find the team whose player_ids array contains this player's id
    const team = teams.find((t) =>
      Array.isArray(t.player_ids) && t.player_ids.includes(p.id)
    ) ?? null;

    return {
      ...p,
      team:       team?.name      ?? null,
      teamColor:  team?.color     ?? null,
      teamColor2: team?.color2    ?? null,
    } as Player;
  });

/* ── Page Component ───────────────────────────────────────────────────────── */

/**
 * History page props.
 * seasonId comes from the router — e.g. in Next.js App Router:
 *   const params = useParams();
 *   <History seasonId={Number(params.seasonId)} />
 */
export default function History({ seasonId }: { seasonId: number }) {

  /* ── Season Awards ──────────────────────────────────────────────────────────
   * Update this array at the end of each season.
   * TODO: move to a Supabase `awards` table when you want DB-driven management.
   *       Schema: (id, season_id, title, winner, team, icon)
   * ----------------------------------------------------------------------- */
  const awards: Award[] = [
    {
      title:  "Most Valuable Player",
      winner: "Brandon Sangalang",
      team:   "Brawl > Brawl > Bull",
      icon:   "🏆",
    },
    {
      title:  "Defensive Player",
      winner: "Justine Telan",
      team:   "Brawl > Brawl > Bull",
      icon:   "🛡️",
    },
    {
      title:  "Ray of Sunshine",
      winner: "Brandon Sangalang",
      team:   "Brawl > Brawl > Bull",
      icon:   "✨",
    },
    {
      title:  "Most Improved",
      winner: "Justine Telan",
      team:   "Brawl > Brawl > Bull",
      icon:   "📈",
    },
  ];

  /* ── State ── */
  const [season,  setSeason]  = useState<Season | null>(null);
  const [teams,   setTeams]   = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games,   setGames]   = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state — "all" means no filter applied
  const [teamFilter,   setTeamFilter]   = useState<number | "all">("all");
  const [playerFilter, setPlayerFilter] = useState<number | "all">("all");

  /* ── Data Fetching ──────────────────────────────────────────────────────────
   * All five queries run in parallel via Promise.all for faster load.
   * Re-runs whenever seasonId changes (e.g. user navigates between seasons).
   * ----------------------------------------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: seasonData },
          { data: teamsData },
          { data: playersData },
          { data: gamesData },
          { data: setsData },
        ] = await Promise.all([
          // Single season metadata row
          supabase
            .from("seasons")
            .select("*")
            .eq("season_id", seasonId)
            .single(),

          // All teams for this season, ordered by standings
          supabase
            .from("teams")
            .select("*")
            .eq("season_id", seasonId)
            .order("wins", { ascending: false }),

          // All archived player rows for this season
          // sorted by plus_minus descending (leaderboard order)
          supabase
            .from("players_old")
            .select("*")
            .eq("season_id", seasonId)
            .order("plus_minus", { ascending: false }),

          // All games for this season in chronological order
          supabase
            .from("games")
            .select("*")
            .eq("season_id", seasonId)
            .order("date", { ascending: true })
            .order("time", { ascending: true }),

          // All sets for this season — joined to games client-side below
          supabase
            .from("sets")
            .select("*")
            .eq("season_id", seasonId)
            .order("set_no", { ascending: true }),
        ]);

        const resolvedTeams: Team[] = teamsData ?? [];

        setSeason(seasonData ?? null);
        setTeams(resolvedTeams);

        // Attach team colour data onto each player row for PlayerCard gradients
        setPlayers(enrichPlayers(playersData ?? [], resolvedTeams));

        // Join sets onto their parent game and compute set result
        const gamesWithSets: Game[] = (gamesData ?? []).map((g: any) => ({
          ...g,
          sets: (setsData ?? [])
            .filter((s: any) => s.game_id === g.id)
            .map((s: any) => ({
              ...s,
              // Compute W/L/T from points — not stored in DB
              result:
                s.points_for === s.points_against ? "T"
                : s.points_for > s.points_against  ? "W"
                : "L",
            })),
        }));

        setGames(gamesWithSets);
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  /* ── Loading / Error Guards ── */
  if (loading) return <div className="p-12 text-center">Loading season…</div>;
  if (!season) return <div className="p-12 text-center">Season not found.</div>;

  /* ── Derived / Filtered Data ──────────────────────────────────────────────
   * Filtering is done client-side since all data is already fetched.
   * teamFilter  → filters both the games table AND narrows the player list
   *               to players on that team (via enriched team field).
   * playerFilter → further narrows the player card grid to one player.
   * ----------------------------------------------------------------------- */

  /** Returns the primary colour of a team by ID, for table row gradients. */
  const getTeamBg = (teamId?: number | null): string =>
    teams.find((t) => t.team_id === teamId)?.color ?? "#f3f4f6";

  const filteredPlayers = players.filter((p) => {
    if (playerFilter !== "all" && p.id !== playerFilter) return false;
    if (teamFilter   !== "all" && p.team !== teams.find(t => t.team_id === teamFilter)?.name) return false;
    return true;
  });

  const filteredGames =
    teamFilter === "all"
      ? games
      : games.filter((g) => g.team_id === teamFilter);

  /* ── Render ── */
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">

      {/* Page title — season name from DB */}
      <h1 className="text-3xl font-bold">{season.name}</h1>

      {/* ── Season Awards ── */}
      <Card className="bg-gradient-to-r from-primary/10 via-background to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">🏆 Season Awards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {awards.map((award) => (
              <div
                key={award.title}
                className="rounded-xl border bg-background/60 p-4 text-center shadow-sm hover:shadow-md transition"
              >
                <div className="text-4xl mb-2">{award.icon}</div>
                <div className="font-bold text-lg">{award.title}</div>
                <div className="mt-2 text-primary font-semibold">{award.winner}</div>
                <div className="text-sm text-muted-foreground">{award.team}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Team filter — also filters the games table below */}
        <select
          value={teamFilter}
          onChange={(e) =>
            setTeamFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="border px-2 py-1 rounded-md"
        >
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.team_id} value={t.team_id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Player filter — narrows card grid to a single player */}
        <select
          value={playerFilter}
          onChange={(e) =>
            setPlayerFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="border px-2 py-1 rounded-md"
        >
          <option value="all">All Players</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Player Stats Grid ──
          forceShowStats=true because this is a retrospective history view —
          stat_visibility is irrelevant for completed seasons.
          Remove forceShowStats if you want to honour privacy even in history. */}
      <Card>
        <CardHeader>
          <CardTitle>
            <CalendarDays className="h-5 w-5 inline mr-2" />
            Player Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <div className="text-muted-foreground">No players found.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} forceShowStats />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Match History Table ──
          Displays every game → set breakdown for the season.
          Each row is one set (not one game) to show granular scoring.
          Row background fades to the team's primary colour on the left. */}
      <Card>
        <CardHeader>
          <CardTitle>
            <CalendarDays className="h-5 w-5 inline mr-2" />
            Match History (Set-by-Set)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGames.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">
              No games played yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Team</th>
                    <th className="px-4 py-2">Opponent</th>
                    <th className="px-4 py-2 text-center">Set</th>
                    <th className="px-4 py-2 text-center">PF</th>
                    <th className="px-4 py-2 text-center">PA</th>
                    <th className="px-4 py-2 text-center">Diff</th>
                    <th className="px-4 py-2 text-center">Result</th>
                    <th className="px-4 py-2 text-center">VOD</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) =>
                    game.sets.map((set) => (
                      <tr
                        key={`${game.id}-set-${set.set_no}`}
                        style={{
                          // Row tints to team colour on the left edge
                          background: `linear-gradient(270deg, #ffffff 85%, ${getTeamBg(game.team_id)} 100%)`,
                        }}
                        className="border-b border-muted"
                      >
                        <td className="px-4 py-2">{game.date}</td>
                        <td className="px-4 py-2">{formatTime12H(game.time)}</td>
                        <td className="px-4 py-2 font-semibold">
                          {game.team_id
                            ? teams.find((t) => t.team_id === game.team_id)?.name
                            : "N/A"}
                        </td>
                        <td className="px-4 py-2 font-semibold">{game.opponent}</td>
                        <td className="px-4 py-2 text-center">{set.set_no}</td>
                        <td className="px-4 py-2 text-center text-green-700 font-bold">
                          {set.points_for}
                        </td>
                        <td className="px-4 py-2 text-center text-red-600 font-bold">
                          {set.points_against}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">
                          {(set.points_for ?? 0) - (set.points_against ?? 0)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              set.result === "W" ? "bg-green-100 text-green-700"
                            : set.result === "L" ? "bg-red-100 text-red-700"
                            :                      "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {set.result}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {set.vod_link ? (
                            <Button
                              size="sm"
                              variant="default"
                              className="inline-flex items-center gap-1"
                              onClick={() =>
                                window.open(set.vod_link!, "_blank", "noopener,noreferrer")
                              }
                            >
                              <PlayCircle className="h-4 w-4" />
                              Watch
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}