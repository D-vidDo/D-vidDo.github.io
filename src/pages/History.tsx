/**
 * History.tsx
 *
 * Retrospective view of a completed season.
 *
 * Route examples:
 *   /history/1
 *   /history/2
 *   /history/3
 *
 * The parent route should pass the seasonId prop:
 *
 *   <History seasonId={Number(params.seasonId)} />
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

import PlayerCard, { Player } from "@/components/PlayerCard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  CalendarDays,
  PlayCircle,
  Trophy,
  Users,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface Season {
  season_id: number;
  name: string;
}

interface Team {
  team_id: number;
  name: string | null;
  wins: number | null;
  losses: number | null;
  captain: string | null;
  color?: string | null;
  color2?: string | null;
  points_for: number | null;
  points_against: number | null;
  split_wins: number | null;
  season_id: number | null;
  player_ids?: any[] | null;
  games?: any[] | null;
}

interface SetRow {
  id: number;
  game_id: number;
  set_no: number | null;
  points_for: number | null;
  points_against: number | null;
  result: "W" | "L" | "T" | null;
  vod_link?: string | null;
  season_id: number | null;
}

interface Game {
  id: number;
  team_id: number | null;
  date: string | null;
  time: string | null;
  opponent: string | null;
  season_id: number | null;
  sets: SetRow[];
}

interface Award {
  title: string;
  winner: string;
  team: string;
  icon: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const formatTime12H = (time?: string | null): string => {
  if (!time) return "—";

  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr, 10);

  if (Number.isNaN(hour)) return time;

  const suffix = hour >= 12 ? "PM" : "AM";

  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

const formatDate = (date?: string | null): string => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const enrichPlayers = (
  rawPlayers: any[],
  teams: Team[]
): Player[] =>
  rawPlayers.map((player) => {
    const team =
      teams.find(
        (team) =>
          Array.isArray(team.player_ids) &&
          team.player_ids.some(
            (id) => Number(id) === Number(player.id)
          )
      ) ?? null;

    return {
      ...player,
      team: team?.name ?? null,
      teamColor: team?.color ?? null,
      teamColor2: team?.color2 ?? null,
    } as Player;
  });

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function History({
  seasonId,
}: {
  seasonId: number;
}) {
  const navigate = useNavigate();

  /* ───────────────────────────────────────────────────────────────────────────
     AWARDS
  ─────────────────────────────────────────────────────────────────────────── */

  const awards: Award[] = [
    {
      title: "Most Valuable Player",
      winner: "Brandon Sangalang",
      team: "Brawl > Brawl > Bull",
      icon: "🏆",
    },
    {
      title: "Defensive Player",
      winner: "Justine Telan",
      team: "Brawl > Brawl > Bull",
      icon: "🛡️",
    },
    {
      title: "Ray of Sunshine",
      winner: "Brandon Sangalang",
      team: "Brawl > Brawl > Bull",
      icon: "✨",
    },
    {
      title: "Most Improved",
      winner: "Justine Telan",
      team: "Brawl > Brawl > Bull",
      icon: "📈",
    },
  ];

  /* ───────────────────────────────────────────────────────────────────────────
     STATE
  ─────────────────────────────────────────────────────────────────────────── */

  const [season, setSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamFilter, setTeamFilter] =
    useState<number | "all">("all");

  const [playerFilter, setPlayerFilter] =
    useState<number | "all">("all");

  /* ───────────────────────────────────────────────────────────────────────────
     FETCH DATA
  ─────────────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [
          { data: seasonData, error: seasonError },
          { data: seasonsData, error: seasonsError },
          { data: teamsData, error: teamsError },
          { data: playersData, error: playersError },
          { data: gamesData, error: gamesError },
          { data: setsData, error: setsError },
        ] = await Promise.all([
          supabase
            .from("seasons")
            .select("*")
            .eq("season_id", seasonId)
            .single(),

          supabase
            .from("seasons")
            .select("season_id, name")
            .order("season_id", { ascending: true }),

          supabase
            .from("teams")
            .select("*")
            .eq("season_id", seasonId)
            .order("wins", { ascending: false }),

          supabase
            .from("players_old")
            .select("*")
            .eq("season_id", seasonId)
            .order("plus_minus", {
              ascending: false,
              nullsFirst: false,
            }),

          supabase
            .from("games")
            .select("*")
            .eq("season_id", seasonId)
            .order("date", { ascending: true })
            .order("time", { ascending: true }),

          supabase
            .from("sets")
            .select("*")
            .eq("season_id", seasonId)
            .order("set_no", { ascending: true }),
        ]);

        if (seasonError) {
          console.error("Season fetch error:", seasonError);
        }

        if (seasonsError) {
          console.error("Seasons fetch error:", seasonsError);
        }

        if (teamsError) {
          console.error("Teams fetch error:", teamsError);
        }

        if (playersError) {
          console.error("Players fetch error:", playersError);
        }

        if (gamesError) {
          console.error("Games fetch error:", gamesError);
        }

        if (setsError) {
          console.error("Sets fetch error:", setsError);
        }

        const resolvedTeams: Team[] = teamsData ?? [];

        setSeason(seasonData ?? null);
        setSeasons(seasonsData ?? []);
        setTeams(resolvedTeams);

        setPlayers(
          enrichPlayers(
            playersData ?? [],
            resolvedTeams
          )
        );

        const gamesWithSets: Game[] =
          (gamesData ?? []).map((game: any) => ({
            ...game,

            sets: (setsData ?? [])
              .filter(
                (set: any) =>
                  set.game_id === game.id
              )
              .map((set: any) => ({
                ...set,

                result:
                  set.points_for ===
                  set.points_against
                    ? "T"
                    : set.points_for >
                        set.points_against
                      ? "W"
                      : "L",
              })),
          }));

        setGames(gamesWithSets);
      } catch (error) {
        console.error(
          "History fetch error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  /* ───────────────────────────────────────────────────────────────────────────
     DERIVED DATA
  ─────────────────────────────────────────────────────────────────────────── */

  const selectedTeamName = useMemo(() => {
    if (teamFilter === "all") return null;

    return (
      teams.find(
        (team) => team.team_id === teamFilter
      )?.name ?? null
    );
  }, [teamFilter, teams]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (
        playerFilter !== "all" &&
        player.id !== playerFilter
      ) {
        return false;
      }

      if (
        selectedTeamName &&
        player.team !== selectedTeamName
      ) {
        return false;
      }

      return true;
    });
  }, [
    players,
    playerFilter,
    selectedTeamName,
  ]);

  const filteredGames = useMemo(() => {
    if (teamFilter === "all") {
      return games;
    }

    return games.filter(
      (game) => game.team_id === teamFilter
    );
  }, [games, teamFilter]);

  const getTeam = (
    teamId?: number | null
  ): Team | null => {
    if (!teamId) return null;

    return (
      teams.find(
        (team) => team.team_id === teamId
      ) ?? null
    );
  };

  const getGameResult = (game: Game) => {
    const wins = game.sets.filter(
      (set) => set.result === "W"
    ).length;

    const losses = game.sets.filter(
      (set) => set.result === "L"
    ).length;

    if (wins > losses) return "W";
    if (losses > wins) return "L";

    return "T";
  };

  const getResultClasses = (result: "W" | "L" | "T") => {
    if (result === "W") {
      return {
        badge:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        score: "text-emerald-500",
        glow: "bg-emerald-400",
      };
    }

    if (result === "L") {
      return {
        badge:
          "bg-red-500/15 text-red-600 dark:text-red-400",
        score: "text-red-500",
        glow: "bg-red-400",
      };
    }

    return {
      badge:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      score: "text-amber-500",
      glow: "bg-amber-400",
    };
  };

  /* ───────────────────────────────────────────────────────────────────────────
     LOADING / ERROR
  ─────────────────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass px-8 py-6 text-center">
          <div className="text-lg font-semibold">
            Loading season…
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            Bringing the history back.
          </div>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass px-8 py-6 text-center">
          <div className="text-lg font-semibold">
            Season not found.
          </div>

          <Button
            className="mt-4"
            onClick={() => navigate("/history/1")}
          >
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO HEADER
      ═══════════════════════════════════════════════════════════════════════ */}

      <section className="relative overflow-hidden">
        {/* Decorative background glow */}
        <div
          className="
            absolute
            -top-32
            left-1/2
            -translate-x-1/2
            h-80
            w-80
            rounded-full
            bg-primary/20
            blur-3xl
            pointer-events-none
          "
        />

        <div
          className="
            relative
            max-w-7xl
            mx-auto
            px-4
            pt-8
            md:pt-12
            pb-8
          "
        >
          <div
            className="
              glass
              overflow-hidden
              px-5
              py-6
              md:px-8
              md:py-8
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5
                md:flex-row
                md:items-center
                md:justify-between
              "
            >
              {/* Title */}
              <div className="min-w-0">
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    uppercase
                    tracking-widest
                    text-primary
                    mb-2
                  "
                >
                  <Trophy className="h-4 w-4" />
                  Season History
                </div>

                <h1
                  className="
                    text-3xl
                    md:text-5xl
                    font-black
                    tracking-tight
                  "
                >
                  {season.name}
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    md:text-base
                    text-muted-foreground
                    max-w-xl
                  "
                >
                  A complete retrospective of the
                  season — stats, standings, matches,
                  and memorable moments.
                </p>
              </div>

              {/* Season Selector */}
              <div className="shrink-0">
                <label
                  htmlFor="season-select"
                  className="
                    block
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-muted-foreground
                    mb-2
                  "
                >
                  Select Season
                </label>

                <div className="relative">
                  <select
                    id="season-select"
                    value={seasonId}
                    onChange={(event) => {
                      const nextSeason =
                        Number(event.target.value);

                      navigate(
                        `/history/${nextSeason}`
                      );
                    }}
                    className="
                      glass-input
                      appearance-none
                      w-full
                      md:w-56
                      h-11
                      pl-4
                      pr-10
                      text-sm
                      font-semibold
                      cursor-pointer
                    "
                  >
                    {seasons.map((item) => (
                      <option
                        key={item.season_id}
                        value={item.season_id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      h-4
                      w-4
                      pointer-events-none
                      text-muted-foreground
                    "
                  />
                </div>
              </div>
            </div>

            {/* Header stats */}
            <div
              className="
                grid
                grid-cols-2
                md:grid-cols-4
                gap-2
                md:gap-3
                mt-6
                pt-5
                border-t
                border-white/20
              "
            >
              <div className="glass-light px-3 py-3">
                <div className="text-xl md:text-2xl font-bold">
                  {teams.length}
                </div>

                <div className="text-xs text-muted-foreground">
                  Teams
                </div>
              </div>

              <div className="glass-light px-3 py-3">
                <div className="text-xl md:text-2xl font-bold">
                  {players.length}
                </div>

                <div className="text-xs text-muted-foreground">
                  Players
                </div>
              </div>

              <div className="glass-light px-3 py-3">
                <div className="text-xl md:text-2xl font-bold">
                  {games.length}
                </div>

                <div className="text-xs text-muted-foreground">
                  Matches
                </div>
              </div>

              <div className="glass-light px-3 py-3">
                <div className="text-xl md:text-2xl font-bold">
                  {games.reduce(
                    (total, game) =>
                      total + game.sets.length,
                    0
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Sets
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}

      <main
        className="
          max-w-7xl
          mx-auto
          px-4
          pb-12
          space-y-6
          md:space-y-8
        "
      >
        {/* ═══════════════════════════════════════════════════════════════════
            AWARDS
        ═══════════════════════════════════════════════════════════════════ */}

        <Card className="glass border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-primary" />
              Season Awards
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div
              className="
                grid
                grid-cols-2
                lg:grid-cols-4
                gap-3
                md:gap-4
              "
            >
              {awards.map((award) => (
                <div
                  key={award.title}
                  className="
                    glass-light
                    p-3
                    md:p-4
                    text-center
                    hover:-translate-y-0.5
                    transition-transform
                  "
                >
                  <div className="text-3xl md:text-4xl mb-2">
                    {award.icon}
                  </div>

                  <div
                    className="
                      font-bold
                      text-sm
                      md:text-base
                      leading-tight
                    "
                  >
                    {award.title}
                  </div>

                  <div
                    className="
                      mt-2
                      text-primary
                      font-semibold
                      text-sm
                    "
                  >
                    {award.winner}
                  </div>

                  <div
                    className="
                      text-xs
                      text-muted-foreground
                      mt-0.5
                      line-clamp-2
                    "
                  >
                    {award.team}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            FILTERS
        ═══════════════════════════════════════════════════════════════════ */}

        <div
          className="
            glass
            p-3
            md:p-4
            flex
            flex-col
            sm:flex-row
            gap-3
            sm:items-center
          "
        >
          <div className="flex items-center gap-2 mr-auto">
            <Users className="h-4 w-4 text-primary" />

            <span className="text-sm font-semibold">
              Filter History
            </span>
          </div>

          <select
            value={teamFilter}
            onChange={(event) =>
              setTeamFilter(
                event.target.value === "all"
                  ? "all"
                  : Number(event.target.value)
              )
            }
            className="
              glass-input
              h-10
              px-3
              text-sm
              font-medium
              w-full
              sm:w-auto
            "
          >
            <option value="all">
              All Teams
            </option>

            {teams.map((team) => (
              <option
                key={team.team_id}
                value={team.team_id}
              >
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={playerFilter}
            onChange={(event) =>
              setPlayerFilter(
                event.target.value === "all"
                  ? "all"
                  : Number(event.target.value)
              )
            }
            className="
              glass-input
              h-10
              px-3
              text-sm
              font-medium
              w-full
              sm:w-auto
            "
          >
            <option value="all">
              All Players
            </option>

            {players.map((player) => (
              <option
                key={player.id}
                value={player.id}
              >
                {player.name}
              </option>
            ))}
          </select>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PLAYER STATS
        ═══════════════════════════════════════════════════════════════════ */}

        <Card className="glass border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              Player Stats
            </CardTitle>
          </CardHeader>

          <CardContent>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No players found.
              </div>
            ) : (
              <div
                className="
                  grid
                  sm:grid-cols-2
                  lg:grid-cols-3
                  gap-4
                "
              >
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    forceShowStats
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            MATCH HISTORY
        ═══════════════════════════════════════════════════════════════════ */}

        <Card className="glass border-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="h-5 w-5 text-primary" />
                Match History
              </CardTitle>

              <Badge
                variant="secondary"
                className="shrink-0"
              >
                {filteredGames.length} matches
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Set-by-set results from the season.
            </p>
          </CardHeader>

          <CardContent className="pt-0">
            {filteredGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No games played yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGames.map((game) => {
                  const team = getTeam(game.team_id);

                  const teamColor =
                    team?.color ?? "#6b7280";

                  const teamColor2 =
                    team?.color2 ?? teamColor;

                  const gameResult =
                    getGameResult(game);

                  const resultClasses =
                    getResultClasses(gameResult);

                  return (
                    <div
                      key={game.id}
                      className="
                        group
                        relative
                        overflow-hidden
                        rounded-2xl
                        bg-white/20
                        dark:bg-white/[0.06]
                        backdrop-blur-xl
                        backdrop-saturate-150
                        shadow-[0_8px_30px_rgba(30,50,80,0.08)]
                        transition-all
                        duration-300
                        hover:-translate-y-0.5
                        hover:bg-white/25
                        dark:hover:bg-white/[0.09]
                        hover:shadow-[0_14px_40px_rgba(30,50,80,0.12)]
                      "
                    >
                      {/* Team colour atmosphere */}
                      <div
                        className="
                          absolute
                          -left-16
                          top-1/2
                          -translate-y-1/2
                          h-40
                          w-40
                          rounded-full
                          blur-3xl
                          opacity-25
                          pointer-events-none
                          transition-opacity
                          duration-300
                          group-hover:opacity-35
                        "
                        style={{
                          background: `linear-gradient(
                            135deg,
                            ${teamColor},
                            ${teamColor2}
                          )`,
                        }}
                      />

                      {/* Secondary team colour glow */}
                      <div
                        className="
                          absolute
                          right-1/4
                          -top-16
                          h-32
                          w-32
                          rounded-full
                          blur-3xl
                          opacity-10
                          pointer-events-none
                        "
                        style={{
                          background: teamColor2,
                        }}
                      />

                      {/* Glass highlight */}
                      <div
                        className="
                          absolute
                          inset-x-8
                          top-0
                          h-px
                          bg-gradient-to-r
                          from-transparent
                          via-white/70
                          to-transparent
                          opacity-70
                          pointer-events-none
                        "
                      />

                      {/* Soft inner glow */}
                      <div
                        className="
                          absolute
                          inset-0
                          bg-gradient-to-br
                          from-white/10
                          via-transparent
                          to-transparent
                          pointer-events-none
                        "
                      />

                      {/* ─────────────────────────────────────────────
                          DESKTOP / TABLET LAYOUT
                      ───────────────────────────────────────────── */}

                      <div
                        className="
                          relative
                          hidden
                          md:grid
                          grid-cols-[110px_minmax(150px,1fr)_minmax(150px,1fr)_repeat(3,72px)_80px_70px]
                          items-center
                          min-h-[72px]
                          px-4
                          py-2
                          gap-3
                          text-sm
                        "
                      >
                        {/* Date / time */}
                        <div>
                          <div className="font-semibold">
                            {formatDate(game.date)}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {formatTime12H(game.time)}
                          </div>
                        </div>

                        {/* Our team */}
                        <div className="min-w-0">
                          <div
                            className="font-bold truncate"
                            style={{
                              color: teamColor,
                            }}
                          >
                            {team?.name ?? "N/A"}
                          </div>

                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Home
                          </div>
                        </div>

                        {/* Opponent */}
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {game.opponent ?? "N/A"}
                          </div>

                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Opponent
                          </div>
                        </div>

                        {/* Set scores */}
                        {game.sets.map((set) => (
                          <div
                            key={set.id}
                            className="
                              flex
                              flex-col
                              items-center
                              justify-center
                              rounded-xl
                              px-2
                              py-2
                              bg-white/20
                              dark:bg-white/[0.06]
                              backdrop-blur-md
                              shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]
                            "
                          >
                            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
                              Set {set.set_no}
                            </div>

                            <div className="flex items-center gap-1.5 leading-none">
                              <span
                                className={`
                                  text-base
                                  font-black
                                  ${resultClasses.score}
                                `}
                              >
                                {set.points_for ?? "—"}
                              </span>

                              <span className="text-muted-foreground text-xs">
                                -
                              </span>

                              <span className="text-base font-bold">
                                {set.points_against ?? "—"}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Empty set slots only when there are 2 sets */}
                        {game.sets.length === 2 && (
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              rounded-xl
                              px-2
                              py-2
                              bg-white/10
                              dark:bg-white/[0.03]
                              text-muted-foreground/40
                              text-xs
                            "
                          >
                            —
                          </div>
                        )}

                        {/* Overall result */}
                        <div className="text-center">
                          <Badge
                            className={`
                              font-bold
                              text-xs
                              px-2.5
                              py-1
                              ${resultClasses.badge}
                              border-0
                            `}
                          >
                            {game.sets.filter(
                              (set) =>
                                set.result === "W"
                            ).length}
                            -
                            {game.sets.filter(
                              (set) =>
                                set.result === "L"
                            ).length}
                          </Badge>
                        </div>

                        {/* VOD */}
                        <div className="text-center">
                          {game.sets.find(
                            (set) => set.vod_link
                          ) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="
                                h-9
                                w-9
                                p-0
                                rounded-full
                                bg-white/10
                                hover:bg-white/20
                              "
                              onClick={() => {
                                const vod =
                                  game.sets.find(
                                    (set) =>
                                      set.vod_link
                                  )?.vod_link;

                                if (vod) {
                                  window.open(
                                    vod,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }
                              }}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground/50">
                              —
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ─────────────────────────────────────────────
                          MOBILE LAYOUT
                      ───────────────────────────────────────────── */}

                      <div className="relative md:hidden px-4 py-3">
                        {/* Row 1: matchup */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-bold truncate"
                                style={{
                                  color: teamColor,
                                }}
                              >
                                {team?.name ??
                                  "N/A"}
                              </span>

                              <span className="text-muted-foreground">
                                vs
                              </span>

                              <span className="font-semibold truncate">
                                {game.opponent ??
                                  "N/A"}
                              </span>
                            </div>

                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(
                                game.date
                              )}{" "}
                              ·{" "}
                              {formatTime12H(
                                game.time
                              )}
                            </div>
                          </div>

                          {/* Overall result */}
                          <div className="shrink-0">
                            <Badge
                              className={`
                                font-bold
                                border-0
                                ${resultClasses.badge}
                              `}
                            >
                              {game.sets.filter(
                                (set) =>
                                  set.result === "W"
                              ).length}
                              -
                              {game.sets.filter(
                                (set) =>
                                  set.result === "L"
                              ).length}
                            </Badge>
                          </div>
                        </div>

                        {/* Row 2: set scores */}
                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-2
                            mt-3
                            pt-2
                            border-t
                            border-white/10
                          "
                        >
                          <div className="flex items-center gap-2">
                            {game.sets.map(
                              (set) => (
                                <div
                                  key={set.id}
                                  className="
                                    flex
                                    items-center
                                    gap-1
                                    rounded-lg
                                    bg-white/15
                                    dark:bg-white/[0.05]
                                    backdrop-blur-md
                                    px-2
                                    py-1
                                    shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]
                                  "
                                >
                                  <span className="text-[10px] text-muted-foreground">
                                    S{set.set_no}
                                  </span>

                                  <span
                                    className={`
                                      font-bold
                                      text-sm
                                      ${resultClasses.score}
                                    `}
                                  >
                                    {set.points_for ??
                                      "—"}
                                  </span>

                                  <span className="text-muted-foreground text-xs">
                                    -
                                  </span>

                                  <span className="font-semibold text-sm">
                                    {set.points_against ??
                                      "—"}
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          {game.sets.find(
                            (set) =>
                              set.vod_link
                          ) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="
                                h-8
                                px-2
                                shrink-0
                                rounded-full
                                bg-white/10
                                hover:bg-white/20
                              "
                              onClick={() => {
                                const vod =
                                  game.sets.find(
                                    (set) =>
                                      set.vod_link
                                  )?.vod_link;

                                if (vod) {
                                  window.open(
                                    vod,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }
                              }}
                            >
                              <PlayCircle className="h-4 w-4" />

                              <span className="ml-1 text-xs">
                                VOD
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
