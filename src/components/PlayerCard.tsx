/**
 * PlayerCard.tsx
 *
 * Liquid Glass player card for the Volleyball League.
 *
 * Supports:
 *   1. CURRENT SEASON — players table
 *   2. HISTORICAL SEASONS — players_old table
 *
 * Team colors are used as ambient lighting rather than hard gradients,
 * giving the card a translucent Apple-inspired Liquid Glass appearance.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { User } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */

export interface Player {
  // Shared by players + players_old
  id: number;
  name: string;
  primary_position: string;
  secondary_position?: string | null;

  plus_minus: number;
  games_played: number;

  wins?: number | null;
  losses?: number | null;
  ties?: number | null;

  title?: string | null;
  dominant_hand?: string | null;
  height?: string | null;
  reach?: string | null;
  vertical_jump?: string | null;

  imageUrl?: string | null;
  jersey_number?: string | null;

  stats?: Record<string, number> | null;
  updated_at?: string | null;

  // players_old
  season_id?: number | null;

  // players
  stat_visibility?: boolean | null;
  user_id?: string | null;
  sets_played?: any[] | null;
  display_name?: string | null;

  // Enriched after fetch
  team?: string | null;
  teamColor?: string | null;
  teamColor2?: string | null;
}

interface PlayerCardProps {
  player: Player;

  /**
   * Highlights the stat matching the active sort key.
   * Example: sortKey="Blocking"
   */
  sortKey?: string;

  /**
   * Admin/history override.
   * When true, stats are shown regardless of stat_visibility.
   */
  forceShowStats?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Safely unwrap nullable JSONB stats.
 */
const safeStats = (
  stats: Player["stats"]
): Record<string, number> => stats ?? {};

/**
 * Calculates Overall Rating.
 *
 * Formula:
 *
 *   OVR = round(
 *     sum(stats) / (numberOfStats × 5) × 100
 *   )
 *
 * Automatically adjusts to different stat counts across seasons.
 */
const calcOVR = (
  stats: Player["stats"]
): number => {
  const values = Object.values(safeStats(stats));

  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce(
    (acc, value) => acc + value,
    0
  );

  const maxPossible = values.length * 5;

  return Math.min(
    Math.round((sum / maxPossible) * 100),
    100
  );
};

/**
 * +/- color.
 */
const pmColor = (value: number) =>
  value > 0
    ? "text-emerald-500"
    : value < 0
    ? "text-red-400"
    : "text-muted-foreground";

/**
 * Adds + to positive numbers.
 */
const signed = (value: number) =>
  `${value > 0 ? "+" : ""}${value}`;

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */

const PlayerCard = ({
  player,
  sortKey,
  forceShowStats = false,
}: PlayerCardProps) => {
  const [open, setOpen] = useState(false);

  /* ───────────────────────────────────────────────────────────────────────────
     Derived values
     ─────────────────────────────────────────────────────────────────────────── */

  const stats = safeStats(player.stats);

  const hasStats =
    Object.keys(stats).length > 0;

  /*
   * Stats visibility:
   *
   * forceShowStats=true
   *   → always visible
   *
   * stat_visibility=null
   *   → historical row / no visibility field
   *
   * stat_visibility=true
   *   → visible
   *
   * stat_visibility=false
   *   → private
   */
  const statsVisible =
    forceShowStats ||
    player.stat_visibility == null ||
    player.stat_visibility === true;

  const hasVisibleStats =
    statsVisible && hasStats;

  const ovr =
    hasVisibleStats
      ? calcOVR(player.stats)
      : null;

  const hasRecord =
    player.wins != null ||
    player.losses != null ||
    player.ties != null;

  const initials =
    player.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase();

  const chartData =
    Object.entries(stats).map(
      ([key, value]) => ({
        stat: key,
        value,
      })
    );

  const avgPerSet =
    player.games_played > 0
      ? player.plus_minus /
        player.games_played
      : null;

  /*
   * Team color fallbacks.
   */
  const tc =
    player.teamColor ?? "#3b82f6";

  const tc2 =
    player.teamColor2 ?? "#1e293b";

  /* ───────────────────────────────────────────────────────────────────────────
     Render
     ─────────────────────────────────────────────────────────────────────────── */

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          PLAYER CARD
          ═══════════════════════════════════════════════════════════════════ */}

      <Card
        onClick={() => setOpen(true)}
        className="
          group
          relative
          cursor-pointer
          overflow-hidden
          rounded-[1.5rem]
          border
          border-white/50
          bg-white/45
          shadow-glass
          backdrop-blur-2xl
          backdrop-saturate-150
          transition-all
          duration-500
          hover:-translate-y-1
          hover:shadow-glass-hover
        "
        style={{
          background: `
            radial-gradient(
              circle at 100% 0%,
              ${tc}22 0%,
              transparent 42%
            ),
            radial-gradient(
              circle at 0% 100%,
              ${tc2}16 0%,
              transparent 38%
            ),
            rgba(255,255,255,0.45)
          `,
          boxShadow: `
            0 8px 32px rgba(15, 23, 42, 0.08),
            0 2px 8px rgba(15, 23, 42, 0.04),
            inset 0 1px 0 rgba(255,255,255,0.7)
          `,
        }}
      >
        {/* ─────────────────────────────────────────────────────────────────────
            Glass specular highlight
            ───────────────────────────────────────────────────────────────────── */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            bg-gradient-to-br
            from-white/35
            via-transparent
            to-transparent
            opacity-60
          "
        />

        {/* ─────────────────────────────────────────────────────────────────────
            CARD HEADER
            ───────────────────────────────────────────────────────────────────── */}

        <CardHeader
          className="
            relative
            flex
            items-start
            pb-4
          "
        >
          {/* Team color ambient glow */}
          <div
            className="
              pointer-events-none
              absolute
              -right-12
              -top-16
              h-40
              w-40
              rounded-full
              opacity-30
              blur-3xl
            "
            style={{
              background: tc,
            }}
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-8
              -left-12
              h-28
              w-28
              rounded-full
              opacity-20
              blur-3xl
            "
            style={{
              background: tc2,
            }}
          />

          <div className="relative z-10 flex w-full items-start gap-3">
            {/* ─────────────────────────────────────────────────────────────────
                Avatar
                ───────────────────────────────────────────────────────────── */}

            <Avatar
              className="
                h-12
                w-12
                flex-shrink-0
                border-2
                border-white/70
                shadow-lg
                ring-1
                ring-black/5
              "
            >
              {player.imageUrl ? (
                <>
                  <AvatarImage
                    src={player.imageUrl}
                    alt={player.name}
                  />

                  <AvatarFallback
                    className="
                      font-semibold
                      text-white
                    "
                    style={{
                      background: `
                        linear-gradient(
                          135deg,
                          ${tc},
                          ${tc2}
                        )
                      `,
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback
                  className="
                    font-semibold
                    text-white
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${tc},
                        ${tc2}
                      )
                    `,
                  }}
                >
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {/* ─────────────────────────────────────────────────────────────────
                Name / title / position
                ───────────────────────────────────────────────────────────── */}

            <div className="min-w-0 flex-1 pr-12">
              <div className="flex flex-wrap items-start gap-2">
                <h3
                  className="
                    truncate
                    font-semibold
                    tracking-tight
                    text-foreground
                  "
                >
                  {player.name}
                </h3>

                {/* Title badge */}
                {player.title && (
                  <span
                    className="
                      rounded-full
                      border
                      border-white/50
                      bg-white/35
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      text-foreground
                      shadow-sm
                      backdrop-blur-md
                    "
                  >
                    {player.title}
                  </span>
                )}

                {/* Free Agent */}
                {player.team === "Free Agent" && (
                  <Badge
                    variant="default"
                    className="
                      rounded-full
                      border
                      border-white/40
                      bg-black/10
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      text-foreground
                      shadow-sm
                      backdrop-blur-md
                    "
                  >
                    FA
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {player.primary_position}

                {player.secondary_position && (
                  <span className="ml-1 text-xs">
                    / {player.secondary_position}
                  </span>
                )}
              </p>

              {player.team &&
                player.team !== "Free Agent" && (
                  <p
                    className="mt-1 text-xs font-medium"
                    style={{
                      color: tc,
                    }}
                  >
                    {player.team}
                  </p>
                )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              OVR
              ───────────────────────────────────────────────────────────── */}

          {ovr !== null && (
            <div className="absolute right-4 top-4 z-20 flex flex-col items-center">
              <span
                className="
                  mb-1
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-muted-foreground
                "
              >
                OVR
              </span>

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/60
                  bg-white/50
                  text-lg
                  font-bold
                  text-foreground
                  shadow-lg
                  backdrop-blur-xl
                "
                style={{
                  boxShadow: `
                    0 6px 20px ${tc}25,
                    inset 0 1px 0 rgba(255,255,255,0.8)
                  `,
                }}
              >
                {ovr}
              </div>
            </div>
          )}
        </CardHeader>

        {/* ─────────────────────────────────────────────────────────────────────
            CARD BODY
            ───────────────────────────────────────────────────────────────────── */}

        <CardContent className="relative z-10">
          {/* +/- and Sets */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="
                rounded-2xl
                border
                border-white/35
                bg-white/20
                p-3
                text-center
                backdrop-blur-md
              "
            >
              <div
                className={`text-lg font-bold ${pmColor(
                  player.plus_minus
                )}`}
              >
                {signed(player.plus_minus)}
              </div>

              <div className="text-xs text-muted-foreground">
                +/-
              </div>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-white/35
                bg-white/20
                p-3
                text-center
                backdrop-blur-md
              "
            >
              <div
                className="text-lg font-bold"
                style={{
                  color: tc,
                }}
              >
                {player.games_played}
              </div>

              <div className="text-xs text-muted-foreground">
                Sets
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              W-L-T
              ───────────────────────────────────────────────────────────── */}

          {hasRecord && (
            <div
              className="
                mt-3
                rounded-2xl
                border
                border-white/30
                bg-white/15
                p-3
                text-center
                backdrop-blur-md
              "
            >
              <div className="mb-1 text-xs text-muted-foreground">
                Record
              </div>

              <div className="text-lg font-bold">
                <span className="text-emerald-500">
                  {player.wins ?? 0}
                </span>

                <span className="mx-1 text-muted-foreground font-normal">
                  -
                </span>

                <span className="text-red-400">
                  {player.losses ?? 0}
                </span>

                <span className="mx-1 text-muted-foreground font-normal">
                  -
                </span>

                <span
                  style={{
                    color: tc,
                  }}
                >
                  {player.ties ?? 0}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                W - L - T
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              Average +/- per set
              ───────────────────────────────────────────────────────────── */}

          {avgPerSet !== null && (
            <div
              className="
                mt-3
                rounded-2xl
                border
                border-white/30
                bg-white/15
                p-3
                text-center
                backdrop-blur-md
              "
            >
              <div className="text-sm text-muted-foreground">
                Average per set
              </div>

              <div
                className={`text-lg font-semibold ${pmColor(
                  avgPerSet
                )}`}
              >
                {signed(
                  parseFloat(
                    avgPerSet.toFixed(1)
                  )
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STAT PILLS
              ───────────────────────────────────────────────────────────── */}

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {/* Overall Rating sort highlight */}
            {sortKey === "Overall Rating" &&
              ovr !== null && (
                <div
                  className="
                    col-span-2
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-yellow-300/50
                    bg-yellow-300/15
                    px-3
                    py-2
                    font-bold
                    shadow-sm
                    backdrop-blur-md
                  "
                >
                  <span className="font-medium">
                    Overall Rating
                  </span>

                  <span className="text-yellow-600 dark:text-yellow-300">
                    {ovr}
                  </span>
                </div>
              )}

            {/* Individual stats */}
            {hasVisibleStats
              ? Object.entries(stats).map(
                  ([stat, value]) => {
                    const isActive =
                      sortKey === stat;

                    return (
                      <div
                        key={stat}
                        className={`
                          flex
                          items-center
                          justify-between
                          rounded-xl
                          border
                          px-3
                          py-2
                          backdrop-blur-md
                          transition-all
                          duration-300
                          ${
                            isActive
                              ? "border-yellow-300/60 bg-yellow-300/20 font-bold shadow-sm"
                              : "border-white/40 bg-white/25 hover:bg-white/40"
                          }
                        `}
                      >
                        <span className="font-medium capitalize">
                          {stat}
                        </span>

                        <span
                          className="font-bold"
                          style={{
                            color: isActive
                              ? undefined
                              : tc,
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    );
                  }
                )
              : hasStats && (
                  <div
                    className="
                      col-span-2
                      rounded-xl
                      border
                      border-white/30
                      bg-white/15
                      py-2
                      text-center
                      text-xs
                      italic
                      text-muted-foreground
                      backdrop-blur-md
                    "
                  >
                    Stats are private
                  </div>
                )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          PLAYER MODAL
          ═══════════════════════════════════════════════════════════════════ */}

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent
          open={open}
          onOpenChange={setOpen}
          className="
            max-w-3xl
            overflow-hidden
            rounded-[2rem]
            border
            border-white/20
            bg-slate-950/75
            p-0
            text-white
            shadow-2xl
            backdrop-blur-3xl
          "
          style={{
            boxShadow: `
              0 30px 100px rgba(0,0,0,0.35),
              0 8px 30px rgba(0,0,0,0.20),
              inset 0 1px 0 rgba(255,255,255,0.15)
            `,
          }}
          onClick={() => setOpen(false)}
        >
          {/* ─────────────────────────────────────────────────────────────────
              MODAL HEADER
              ───────────────────────────────────────────────────────────── */}

          <div
            className="
              relative
              flex
              flex-col
              items-center
              overflow-hidden
              p-6
              sm:flex-row
              sm:items-start
              sm:p-8
            "
            style={{
              background: `
                radial-gradient(
                  circle at 15% 30%,
                  ${tc}70 0%,
                  transparent 45%
                ),
                radial-gradient(
                  circle at 85% 20%,
                  ${tc2}60 0%,
                  transparent 42%
                ),
                linear-gradient(
                  135deg,
                  rgba(255,255,255,0.12),
                  rgba(255,255,255,0.03)
                )
              `,
            }}
          >
            {/* Header glass highlight */}
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-br
                from-white/15
                via-transparent
                to-transparent
              "
            />

            {/* Ambient team glow */}
            <div
              className="
                pointer-events-none
                absolute
                -left-24
                -top-24
                h-72
                w-72
                rounded-full
                opacity-30
                blur-3xl
              "
              style={{
                background: tc,
              }}
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-32
                -right-24
                h-80
                w-80
                rounded-full
                opacity-20
                blur-3xl
              "
              style={{
                background: tc2,
              }}
            />

            {/* ───────────────────────────────────────────────────────────────
                Player image
                ─────────────────────────────────────────────────────────── */}

            <div
              className="
                relative
                z-10
                h-32
                w-32
                flex-shrink-0
                overflow-hidden
                rounded-[1.5rem]
                border
                border-white/30
                bg-white/10
                shadow-2xl
                backdrop-blur-xl
                sm:h-40
                sm:w-40
              "
              style={{
                boxShadow: `
                  0 20px 50px ${tc}35,
                  inset 0 1px 0 rgba(255,255,255,0.35)
                `,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* Jersey number */}
              {player.jersey_number && (
                <div
                  className="
                    absolute
                    left-3
                    top-3
                    z-10
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    bg-black/25
                    text-lg
                    font-bold
                    text-white
                    shadow-lg
                    backdrop-blur-xl
                  "
                  style={{
                    borderColor: `${tc2}99`,
                  }}
                >
                  #{player.jersey_number}
                </div>
              )}

              {player.imageUrl ? (
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage
                    src={player.imageUrl}
                    alt={player.name}
                    className="object-cover"
                  />

                  <AvatarFallback
                    className="h-full w-full rounded-none text-white"
                    style={{
                      background: `
                        linear-gradient(
                          135deg,
                          ${tc},
                          ${tc2}
                        )
                      `,
                    }}
                  >
                    <span className="text-4xl font-bold">
                      {initials}
                    </span>
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${tc},
                        ${tc2}
                      )
                    `,
                  }}
                >
                  <User className="h-16 w-16 text-white/80" />
                </div>
              )}
            </div>

            {/* ───────────────────────────────────────────────────────────────
                Player information
                ─────────────────────────────────────────────────────────── */}

            <div
              className="
                relative
                z-10
                mt-5
                flex
                flex-1
                flex-col
                text-center
                sm:ml-8
                sm:mt-0
                sm:text-left
              "
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h1
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                {player.name}
              </h1>

              {/* Title + team */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {player.title && (
                  <span
                    className="
                      rounded-full
                      border
                      border-white/25
                      bg-white/15
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-white
                      shadow-sm
                      backdrop-blur-xl
                    "
                  >
                    {player.title}
                  </span>
                )}

                {player.team && (
                  <span
                    className="
                      rounded-full
                      border
                      border-white/25
                      bg-white/10
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-white/90
                      backdrop-blur-xl
                    "
                  >
                    {player.team}
                  </span>
                )}
              </div>

              {/* Position */}
              <div className="mt-3 text-sm text-white/65">
                {player.primary_position}

                {player.secondary_position && (
                  <span>
                    {" "}
                    /{" "}
                    {player.secondary_position}
                  </span>
                )}
              </div>

              {/* OVR */}
              {ovr !== null && (
                <div className="mt-4">
                  <span className="text-sm text-white/60">
                    Overall Rating
                  </span>

                  <div
                    className="
                      mt-1
                      text-3xl
                      font-bold
                    "
                    style={{
                      color: tc,
                    }}
                  >
                    {ovr}
                  </div>
                </div>
              )}

              {/* Record */}
              {hasRecord && (
                <div className="mt-3 text-sm">
                  <span className="text-white/60">
                    Record{" "}
                  </span>

                  <span className="font-semibold">
                    <span className="text-emerald-400">
                      {player.wins ?? 0}
                    </span>

                    <span className="mx-1 text-white/40">
                      -
                    </span>

                    <span className="text-red-400">
                      {player.losses ?? 0}
                    </span>

                    <span className="mx-1 text-white/40">
                      -
                    </span>

                    <span
                      style={{
                        color: tc,
                      }}
                    >
                      {player.ties ?? 0}
                    </span>
                  </span>

                  <span className="ml-2 text-xs text-white/40">
                    W - L - T
                  </span>
                </div>
              )}
            </div>

            {/* ───────────────────────────────────────────────────────────────
                Physical information glass
                ─────────────────────────────────────────────────────────── */}

            {(player.height ||
              player.dominant_hand ||
              player.reach ||
              player.vertical_jump) && (
              <div
                className="
                  absolute
                  right-6
                  top-6
                  hidden
                  flex-col
                  gap-1
                  rounded-2xl
                  border
                  border-white/20
                  bg-white/10
                  px-4
                  py-3
                  text-right
                  text-sm
                  text-white/80
                  shadow-xl
                  backdrop-blur-2xl
                  sm:flex
                "
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                {player.height && (
                  <div>
                    <span className="font-medium text-white">
                      Height:
                    </span>{" "}
                    {player.height}
                  </div>
                )}

                {player.dominant_hand && (
                  <div>
                    <span className="font-medium text-white">
                      Hits:
                    </span>{" "}
                    {player.dominant_hand}
                  </div>
                )}

                {player.reach && (
                  <div>
                    <span className="font-medium text-white">
                      Reach:
                    </span>{" "}
                    {player.reach}
                  </div>
                )}

                {player.vertical_jump && (
                  <div>
                    <span className="font-medium text-white">
                      Vertical:
                    </span>{" "}
                    {player.vertical_jump}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              MODAL BODY
              ═══════════════════════════════════════════════════════════════ */}

          <div
            className="
              bg-black/10
              p-6
              backdrop-blur-xl
              sm:p-8
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* ───────────────────────────────────────────────────────────────
                Radar chart
                ─────────────────────────────────────────────────────────── */}

            {hasVisibleStats &&
              chartData.length > 0 && (
                <div
                  className="
                    mb-6
                    rounded-[1.5rem]
                    border
                    border-white/10
                    bg-white/5
                    p-4
                    backdrop-blur-xl
                  "
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                    Player Attributes
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <RadarChart
                        data={chartData}
                      >
                        <PolarGrid
                          stroke="rgba(255,255,255,0.12)"
                        />

                        <PolarAngleAxis
                          dataKey="stat"
                          stroke="rgba(255,255,255,0.5)"
                          tick={{
                            fontFamily:
                              "Inter, sans-serif",
                            fontSize: 11,
                            fill: "rgba(255,255,255,0.75)",
                          }}
                        />

                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 5]}
                          ticks={[1, 3, 5]}
                          stroke="rgba(255,255,255,0.2)"
                          tick={{
                            fontFamily:
                              "Inter, sans-serif",
                            fontSize: 10,
                            fill: "rgba(255,255,255,0.45)",
                          }}
                        />

                        <Radar
                          name="Stats"
                          dataKey="value"
                          stroke={tc}
                          fill={tc}
                          fillOpacity={0.28}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            {/* ───────────────────────────────────────────────────────────────
                Physical attributes
                ─────────────────────────────────────────────────────────── */}

            {(player.height ||
              player.dominant_hand ||
              player.reach ||
              player.vertical_jump ||
              hasRecord) && (
              <div
                className="
                  rounded-[1.5rem]
                  border
                  border-white/10
                  bg-white/5
                  p-5
                  backdrop-blur-xl
                "
              >
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
                  Player Details
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  {player.height && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="font-medium text-white/50">
                        Height
                      </span>

                      <span className="text-white/90">
                        {player.height}
                      </span>
                    </div>
                  )}

                  {player.dominant_hand && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="font-medium text-white/50">
                        Dominant Hand
                      </span>

                      <span className="text-white/90">
                        {player.dominant_hand}
                      </span>
                    </div>
                  )}

                  {player.reach && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="font-medium text-white/50">
                        Reach
                      </span>

                      <span className="text-white/90">
                        {player.reach}
                      </span>
                    </div>
                  )}

                  {player.vertical_jump && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="font-medium text-white/50">
                        Vertical Jump
                      </span>

                      <span className="text-white/90">
                        {player.vertical_jump}
                      </span>
                    </div>
                  )}

                  {hasRecord && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="font-medium text-white/50">
                        Record
                      </span>

                      <span>
                        <span className="text-emerald-400">
                          {player.wins ?? 0}
                        </span>

                        <span className="mx-1 text-white/40">
                          -
                        </span>

                        <span className="text-red-400">
                          {player.losses ?? 0}
                        </span>

                        <span className="mx-1 text-white/40">
                          -
                        </span>

                        <span
                          style={{
                            color: tc,
                          }}
                        >
                          {player.ties ?? 0}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────
                Mobile physical attributes
                ─────────────────────────────────────────────────────────── */}

            {(player.height ||
              player.dominant_hand ||
              player.reach ||
              player.vertical_jump) && (
              <div
                className="
                  mt-4
                  grid
                  grid-cols-2
                  gap-2
                  sm:hidden
                "
              >
                {player.height && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">
                      Height
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/90">
                      {player.height}
                    </div>
                  </div>
                )}

                {player.dominant_hand && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">
                      Hand
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/90">
                      {player.dominant_hand}
                    </div>
                  </div>
                )}

                {player.reach && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">
                      Reach
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/90">
                      {player.reach}
                    </div>
                  </div>
                )}

                {player.vertical_jump && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">
                      Vertical
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/90">
                      {player.vertical_jump}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlayerCard;
