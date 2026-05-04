/**
 * PlayerCard.tsx
 *
 * A single reusable card component for displaying player stats across ALL seasons.
 * Used in two contexts:
 *
 *   1. CURRENT SEASON — fed data from the `players` table (no season_id, live roster).
 *      These players may have stat_visibility = false (stats hidden until revealed).
 *
 *   2. HISTORICAL SEASONS — fed data from the `players_old` table (season_id scoped).
 *      Older rows may not have stat_visibility set — treated as visible by default.
 *      Used inside History.tsx, always rendered with forceShowStats=true.
 *
 * ── Supabase Tables ──────────────────────────────────────────────────────────
 *
 *   players      — current season live roster
 *                  has: user_id, sets_played, display_name, stat_visibility
 *                  no season_id (implicitly "current")
 *
 *   players_old  — historical archive, one row per player per season
 *                  has: season_id FK → seasons
 *                  no user_id / sets_played / display_name
 *                  stat keys in the `stats` JSONB vary by season:
 *                    SZN1 (10 stats): Hustle, Hitting, Serving, Setting, Stamina,
 *                                     Blocking, Receiving, Communication,
 *                                     Vertical Jump, Defensive Positioning
 *                    SZN2  (8 stats): Hitting, Passing, Serving, Setting, Stamina,
 *                                     Blocking, Game Sense, Communication
 *                    SZN3+          : add/remove keys freely — OVR auto-adjusts
 *
 * ── OVR Formula ──────────────────────────────────────────────────────────────
 *
 *   OVR = round( sum(statValues) / (statCount × 5) × 100 ), clamped to 100.
 *
 *   The denominator is always derived from the actual number of stats on the
 *   player row, so it self-corrects across seasons with different stat sets.
 *   No hardcoded denominators anywhere.
 *
 * ── Adding a New Season ──────────────────────────────────────────────────────
 *
 *   No code changes needed here. Just INSERT rows into players_old with the
 *   new season_id and whatever JSONB stat keys that season used. Done.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

/* ── Types ────────────────────────────────────────────────────────────────────
 *
 * The Player interface is a union of both `players` and `players_old` columns.
 * Fields that only exist in one table are marked optional so both sources
 * type-check without casting.
 *
 * Fields NOT in either DB table but added after fetching:
 *   team       — resolved from teams.name      (via enrichPlayers() in History.tsx)
 *   teamColor  — resolved from teams.color
 *   teamColor2 — resolved from teams.color2
 * --------------------------------------------------------------------------- */
export interface Player {
  // ── Shared by both players + players_old ──────────────────────────────────
  id: number;
  name: string;
  primary_position: string;
  secondary_position?: string | null;
  plus_minus: number;
  games_played: number;
  title?: string | null;           // e.g. "Captain", "MVP" — decorative badge
  dominant_hand?: string | null;   // "Left" | "Right"
  height?: string | null;          // free text, e.g. "5'11\""
  imageUrl?: string | null;        // public URL to player photo
  jersey_number?: string | null;   // unique per season
  stats?: Record<string, number> | null; // JSONB — keys vary by season (see above)
  updated_at?: string | null;

  // ── players_old only ──────────────────────────────────────────────────────
  season_id?: number | null;       // which season this archive row belongs to

  // ── players (current) only ────────────────────────────────────────────────
  /** Controls whether stats are publicly visible. null = treat as visible (old rows). */
  stat_visibility?: boolean | null;
  user_id?: string | null;         // links to auth.users — player's login account
  sets_played?: any[] | null;      // JSONB array of set-level records (current season)
  display_name?: string | null;    // unique public handle, separate from name

  // ── Enriched after fetch — NOT stored in DB ───────────────────────────────
  team?: string | null;            // from teams.name
  teamColor?: string | null;       // from teams.color  (primary hex)
  teamColor2?: string | null;      // from teams.color2 (secondary hex, used in gradient)
}

interface PlayerCardProps {
  player: Player;
  /**
   * Highlights the stat pill matching the active sort key.
   * Pass the currently selected sort label from the parent sort control.
   * e.g. sortKey="Blocking" will highlight the Blocking pill in gold.
   */
  sortKey?: string;
  /**
   * Admin/history override — renders stats regardless of stat_visibility.
   * Always true in History.tsx (retrospective view).
   * Leave false (default) on the current-season page so privacy is respected.
   */
  forceShowStats?: boolean;
}

/* ── Helpers ──────────────────────────────────────────────────────────────────
 * Small pure functions kept outside the component to avoid re-creation on
 * every render and to make them independently testable.
 * --------------------------------------------------------------------------- */

/** Safely unwraps a nullable stats JSONB field to an empty object. */
const safeStats = (s: Player["stats"]): Record<string, number> => s ?? {};

/**
 * Calculates Overall Rating as a 0–100 integer.
 *
 * Formula: round( sum / (count × maxPerStat) × 100 ), clamped to 100.
 * maxPerStat = 5 (the rating scale used across all seasons).
 *
 * Returns 0 if there are no stats (avoids division by zero).
 */
const calcOVR = (stats: Player["stats"]): number => {
  const values = Object.values(safeStats(stats));
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const maxPossible = values.length * 5; // self-adjusts for any stat count
  return Math.min(Math.round((sum / maxPossible) * 100), 100);
};

/** Returns the appropriate Tailwind text colour class for a +/- value. */
const pmColor = (n: number) =>
  n > 0 ? "text-green-600" : n < 0 ? "text-red-500" : "text-muted-foreground";

/** Prepends "+" to positive numbers for display. Negatives already have "-". */
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

/* ── Component ────────────────────────────────────────────────────────────── */

const PlayerCard = ({
  player,
  sortKey,
  forceShowStats = false,
}: PlayerCardProps) => {
  const [open, setOpen] = useState(false);

  /* ── Derived display values ── */

  const stats = safeStats(player.stats);
  const hasStats = Object.keys(stats).length > 0;

  /**
   * Stat visibility logic:
   *   - forceShowStats=true  → always show (admin / history view)
   *   - stat_visibility=null → old players_old row, column didn't exist → show
   *   - stat_visibility=true → player has opted in / admin enabled
   *   - stat_visibility=false → hidden (default for new current-season players)
   */
  const statsVisible =
    forceShowStats ||
    player.stat_visibility == null ||
    player.stat_visibility === true;

  const hasVisibleStats = statsVisible && hasStats;

  // Only compute OVR when stats are visible — avoids showing a number with no context
  const ovr = hasVisibleStats ? calcOVR(player.stats) : null;

  // W-L-T record — only rendered when at least one value is present
  const hasRecord =
    player.wins != null || player.losses != null || player.ties != null;

  // Initials fallback when no imageUrl is set
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Radar chart data — one point per stat key
  const chartData = Object.entries(stats).map(([key, value]) => ({
    stat: key,
    value,
  }));

  // Average +/- per set — null if no sets played (avoids division by zero)
  const avgPerSet =
    player.games_played > 0 ? player.plus_minus / player.games_played : null;

  // Team colour fallbacks — used in card header gradient and modal gradient
  const tc  = player.teamColor  ?? "#ffffff"; // primary
  const tc2 = player.teamColor2 ?? "#1f2937"; // secondary

  /* ── Render ── */

  return (
    <>
      {/* ================================================================
          CARD — collapsed summary view, opens modal on click
          ================================================================ */}
      <Card
        onClick={() => setOpen(true)}
        className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
      >
        {/* Card Header — fades from team colour at top to white at bottom */}
        <CardHeader
          className="pb-3 relative rounded-t-lg flex items-start"
          style={{
            background: `linear-gradient(0deg, #ffffff 85%, ${tc} 100%)`,
          }}
        >
          <div className="flex items-start space-x-3">

            {/* ── Avatar ── */}
            <Avatar className="h-12 w-12">
              {player.imageUrl ? (
                <>
                  <AvatarImage src={player.imageUrl} alt={player.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-gray-500 text-white font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {/* ── Name, title badge, position ── */}
            <div className="flex-1">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-semibold text-card-foreground">
                  {player.name}
                </h3>

                {/* Special title badge (e.g. "Captain", "MVP") */}
                {player.title && (
                  <span className="text-sm font-semibold px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                    {player.title}
                  </span>
                )}

                {/* Free Agent badge — shown when player has no team */}
                {player.team === "Free Agent" && (
                  <Badge
                    variant="default"
                    className="text-sm font-semibold px-2 py-0.5 rounded text-white shadow-sm bg-gray-500"
                  >
                    FA
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {player.primary_position}
                {player.secondary_position && (
                  <span className="ml-2 text-xs">
                    / {player.secondary_position}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* ── OVR badge — top right, hidden when stats are private ── */}
          {ovr !== null && (
            <div className="flex flex-col items-center absolute top-3 right-3">
              <span className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                OVR
              </span>
              <Badge variant="secondary" className="text-base px-2 py-1 font-bold">
                {ovr}
              </Badge>
            </div>
          )}
        </CardHeader>

        {/* Card Body */}
        <CardContent>

          {/* ── +/- and Sets row ── */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className={`text-lg font-bold ${pmColor(player.plus_minus)}`}>
                {signed(player.plus_minus)}
              </div>
              <div className="text-xs text-muted-foreground">+/-</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">
                {player.games_played}
              </div>
              <div className="text-xs text-muted-foreground">Sets</div>
            </div>
          </div>

          {/* ── W-L-T record (only shown if wins/losses/ties exist on the row) ── */}
          {hasRecord && (
            <div className="mt-3 pt-3 border-t text-center">
              <div className="text-xs text-muted-foreground mb-1">Record</div>
              <div className="text-lg font-bold">
                <span className="text-green-600">{player.wins ?? 0}</span>
                <span className="text-muted-foreground font-normal"> - </span>
                <span className="text-red-500">{player.losses ?? 0}</span>
                <span className="text-muted-foreground font-normal"> - </span>
                <span className="text-primary">{player.ties ?? 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">W - L - T</div>
            </div>
          )}

          {/* ── Average +/- per set ── */}
          {avgPerSet !== null && (
            <div className="mt-3 pt-3 border-t text-center">
              <div className="text-sm text-muted-foreground">Average per set:</div>
              <div className={`text-lg font-semibold ${pmColor(avgPerSet)}`}>
                {signed(parseFloat(avgPerSet.toFixed(1)))}
              </div>
            </div>
          )}

          {/* ── Stat pills grid ── */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">

            {/* Overall Rating pill — only shown when "Overall Rating" is the active sort */}
            {sortKey === "Overall Rating" && ovr !== null && (
              <div className="col-span-2 flex justify-between items-center bg-yellow-100 rounded px-2 py-1 font-bold">
                <span className="font-medium">Overall Rating</span>
                <span className="text-primary">{ovr}</span>
              </div>
            )}

            {/* Individual stat pills — highlighted gold when that stat is the active sort */}
            {hasVisibleStats
              ? Object.entries(stats).map(([stat, value]) => (
                  <div
                    key={stat}
                    className={`flex justify-between items-center rounded px-2 py-1 ${
                      sortKey === stat ? "bg-yellow-100 font-bold" : "bg-muted/30"
                    }`}
                  >
                    <span className="font-medium capitalize">{stat}</span>
                    <span className="text-primary">{value}</span>
                  </div>
                ))
              : hasStats && (
                  // Stats exist but are hidden — show a placeholder message
                  <div className="col-span-2 text-xs text-muted-foreground italic text-center py-1">
                    Stats are private
                  </div>
                )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          MODAL — expanded detail view, opened by clicking the card
          Closes when clicking the backdrop (onClick on DialogContent).
          Child sections use e.stopPropagation() to prevent accidental close.
          ================================================================ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          open={open}
          onOpenChange={setOpen}
          className="max-w-3xl p-0 overflow-hidden bg-[#1f1f1f] rounded-lg"
          onClick={() => setOpen(false)}
        >

          {/* ── Modal Header — full-width team colour gradient ── */}
          <div
            className="flex flex-col sm:flex-row items-center sm:items-start text-white p-6 sm:p-8 relative"
            style={{
              background: `linear-gradient(90deg, ${tc} 0%, ${tc2} 100%)`,
            }}
          >

            {/* ── Player photo / avatar ── */}
            <div
              className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Jersey number overlay — bottom-left of photo */}
              {player.jersey_number && (
                <div
                  className="absolute top-2 left-2 z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-black/60 text-white font-bold text-xl shadow-md"
                  style={{
                    border: `2px solid ${tc2}`,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  #{player.jersey_number}
                </div>
              )}

              {player.imageUrl ? (
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage src={player.imageUrl} alt={player.name} />
                </Avatar>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-600">
                  <User className="w-16 h-16 text-white/80" />
                </div>
              )}
            </div>

            {/* ── Player name, badges, position, OVR, record ── */}
            <div
              className="mt-4 sm:mt-0 sm:ml-8 flex-1 flex flex-col text-center sm:text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <h1 className="text-3xl font-bold">{player.name}</h1>

              {/* Title + team name badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {player.title && (
                  <span className="inline-block px-2 py-0.5 rounded text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {player.title}
                  </span>
                )}
                {player.team && (
                  <span className="inline-block px-2 py-0.5 rounded text-sm font-semibold text-white">
                    {player.team}
                  </span>
                )}
              </div>

              {/* Position */}
              <div className="mt-2 text-sm text-slate-200">
                {player.primary_position}
                {player.secondary_position && (
                  <span> / {player.secondary_position}</span>
                )}
              </div>

              {/* Overall Rating — hidden when stats are private */}
              {ovr !== null && (
                <div className="mt-3 text-lg font-semibold">
                  Overall Rating:{" "}
                  <span className="text-yellow-400">{ovr}</span>
                </div>
              )}

              {/* W-L-T record */}
              {hasRecord && (
                <div className="mt-2 text-lg font-semibold">
                  Record:{" "}
                  <span className="text-green-400">{player.wins ?? 0}</span>
                  <span className="text-slate-300 font-normal"> - </span>
                  <span className="text-red-400">{player.losses ?? 0}</span>
                  <span className="text-slate-300 font-normal"> - </span>
                  <span className="text-yellow-400">{player.ties ?? 0}</span>
                  <span className="text-slate-400 text-sm font-normal ml-1">
                    W - L - T
                  </span>
                </div>
              )}
            </div>

            {/* ── Physical attributes — top right overlay card ── */}
            <div
              className="absolute top-6 right-6 flex flex-col gap-1 text-sm text-slate-200 bg-slate-800/70 backdrop-blur-md rounded-lg px-3 py-2 text-right shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              {player.height && (
                <div>
                  <span className="font-medium">Height:</span> {player.height}
                </div>
              )}
              {player.dominant_hand && (
                <div>
                  <span className="font-medium">Hits:</span> {player.dominant_hand}
                </div>
              )}
              {player.reach && (
                <div>
                  <span className="font-medium">Reach:</span> {player.reach}
                </div>
              )}
              {player.vertical_jump && (
                <div>
                  <span className="font-medium">Vertical:</span> {player.vertical_jump}
                </div>
              )}
            </div>
          </div>

          {/* ── Modal Body — radar chart + attribute table ── */}
          <div className="p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>

            {/* Radar chart — only rendered when stats are visible and non-empty.
                domain [0,5] matches the per-stat rating scale.
                Axis labels use white-ish fill so they're readable on dark bg. */}
            {hasVisibleStats && chartData.length > 0 && (
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="stat"
                      stroke="#374151"
                      tick={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fill: "#f3f4f6",
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      ticks={[1, 3, 5]}
                      stroke="#9ca3af"
                      tick={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 10,
                        fill: "#e5e7eb",
                      }}
                    />
                    <Radar
                      name="Stats"
                      dataKey="value"
                      stroke="#facc15"
                      fill="#facc15"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Attribute table — physical stats + record */}
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {player.height && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">Height</span>
                  <span>{player.height}</span>
                </div>
              )}
              {player.dominant_hand && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">Dominant Hand</span>
                  <span>{player.dominant_hand}</span>
                </div>
              )}
              {player.reach && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">Reach</span>
                  <span>{player.reach}</span>
                </div>
              )}
              {player.vertical_jump && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">Vertical Jump</span>
                  <span>{player.vertical_jump}</span>
                </div>
              )}
              {hasRecord && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">Record (W-L-T)</span>
                  <span>
                    <span className="text-green-500">{player.wins ?? 0}</span>
                    {" - "}
                    <span className="text-red-500">{player.losses ?? 0}</span>
                    {" - "}
                    <span>{player.ties ?? 0}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlayerCard;