/**
 * History.tsx
 *
 * Displays a retrospective view of a completed season.
 *
 * Route format:
 *   /history/1
 *   /history/2
 *   /history/3
 *
 * The season dropdown navigates between historical seasons using React Router.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";

import PlayerCard, {
  Player,
} from "@/components/PlayerCard";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  CalendarDays,
  ChevronDown,
  PlayCircle,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
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

interface Game {
  id: number;
  team_id: number | null;
  date: string | null;
  time: string | null;
  opponent: string | null;
  season_id: number | null;

  sets: SetRow[];
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

interface Award {
  title: string;
  winner: string;
  team: string;
  icon: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

/**
 * Converts a 24h time string from Supabase into 12h display format.
 *
 * Example:
 *   18:30:00 → 6:30 PM
 */
const formatTime12H = (
  time?: string | null
): string => {
  if (!time) return "—";

  const [hourStr, minute] = time.split(":");

  const hour = parseInt(hourStr, 10);

  if (Number.isNaN(hour)) {
    return "—";
  }

  const suffix = hour >= 12 ? "PM" : "AM";

  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

/**
 * Finds the team belonging to each historical player.
 *
 * players_old does not have a team_id FK.
 * Team membership is stored in teams.player_ids.
 */
const enrichPlayers = (
  rawPlayers: any[],
  teams: Team[]
): Player[] => {
  return rawPlayers.map((player) => {
    const team =
      teams.find(
        (team) =>
          Array.isArray(team.player_ids) &&
          team.player_ids.some(
            (id) =>
              Number(id) === Number(player.id)
          )
      ) ?? null;

    return {
      ...player,

      team: team?.name ?? null,

      teamColor:
        team?.color ?? null,

      teamColor2:
        team?.color2 ?? null,
    } as Player;
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */

export default function History({
  seasonId,
}: {
  seasonId: number;
}) {
  const navigate = useNavigate();

  /* ─────────────────────────────────────────────────────────────────────────
     State
  ───────────────────────────────────────────────────────────────────────── */

  const [season, setSeason] =
    useState<Season | null>(null);

  const [seasons, setSeasons] =
    useState<Season[]>([]);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [games, setGames] =
    useState<Game[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [seasonsLoading, setSeasonsLoading] =
    useState(true);

  const [teamFilter, setTeamFilter] =
    useState<number | "all">("all");

  const [playerFilter, setPlayerFilter] =
    useState<number | "all">("all");

  /* ─────────────────────────────────────────────────────────────────────────
     Season Awards
  ───────────────────────────────────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────────────────────────────────
     Fetch available seasons
  ───────────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const fetchSeasons = async () => {
      setSeasonsLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("seasons")
        .select("season_id, name")
        .order("season_id", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error fetching seasons:",
          error
        );
      } else {
        setSeasons(data ?? []);
      }

      setSeasonsLoading(false);
    };

    fetchSeasons();
  }, []);

  /* ─────────────────────────────────────────────────────────────────────────
     Fetch selected season
  ───────────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      /*
       * Reset filters when switching seasons.
       */
      setTeamFilter("all");
      setPlayerFilter("all");

      try {
        const [
          seasonResponse,
          teamsResponse,
          playersResponse,
          gamesResponse,
          setsResponse,
        ] = await Promise.all([
          /*
           * Season
           */
          supabase
            .from("seasons")
            .select(
              "season_id, name"
            )
            .eq(
              "season_id",
              seasonId
            )
            .single(),

          /*
           * Teams
           */
          supabase
            .from("teams")
            .select("*")
            .eq(
              "season_id",
              seasonId
            )
            .order(
              "wins",
              {
                ascending: false,
              }
            ),

          /*
           * Archived players
           */
          supabase
            .from("players_old")
            .select("*")
            .eq(
              "season_id",
              seasonId
            )
            .order(
              "plus_minus",
              {
                ascending: false,
              }
            ),

          /*
           * Games
           */
          supabase
            .from("games")
            .select("*")
            .eq(
              "season_id",
              seasonId
            )
            .order(
              "date",
              {
                ascending: true,
              }
            )
            .order(
              "time",
              {
                ascending: true,
              }
            ),

          /*
           * Sets
           */
          supabase
            .from("sets")
            .select("*")
            .eq(
              "season_id",
              seasonId
            )
            .order(
              "set_no",
              {
                ascending: true,
              }
            ),
        ]);

        const {
          data: seasonData,
          error: seasonError,
        } = seasonResponse;

        const {
          data: teamsData,
          error: teamsError,
        } = teamsResponse;

        const {
          data: playersData,
          error: playersError,
        } = playersResponse;

        const {
          data: gamesData,
          error: gamesError,
        } = gamesResponse;

        const {
          data: setsData,
          error: setsError,
        } = setsResponse;

        /* ── Error logging ── */

        if (seasonError) {
          console.error(
            "Season fetch error:",
            seasonError
          );
        }

        if (teamsError) {
          console.error(
            "Teams fetch error:",
            teamsError
          );
        }

        if (playersError) {
          console.error(
            "Players fetch error:",
            playersError
          );
        }

        if (gamesError) {
          console.error(
            "Games fetch error:",
            gamesError
          );
        }

        if (setsError) {
          console.error(
            "Sets fetch error:",
            setsError
          );
        }

        /* ── Teams ── */

        const resolvedTeams: Team[] =
          teamsData ?? [];

        setSeason(
          seasonData ?? null
        );

        setTeams(
          resolvedTeams
        );

        /* ── Players ── */

        setPlayers(
          enrichPlayers(
            playersData ?? [],
            resolvedTeams
          )
        );

        /* ── Games + Sets ── */

        const gamesWithSets: Game[] =
          (gamesData ?? []).map(
            (game: any) => ({
              ...game,

              sets:
                (setsData ?? [])
                  .filter(
                    (set: any) =>
                      set.game_id ===
                      game.id
                  )
                  .map(
                    (set: any) => ({
                      ...set,

                      result:
                        set.points_for ===
                        set.points_against
                          ? "T"
                          : set.points_for >
                            set.points_against
                          ? "W"
                          : "L",
                    })
                  ),
            })
          );

        setGames(
          gamesWithSets
        );
      } catch (error) {
        console.error(
          "History fetch error:",
          error
        );

        setSeason(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  /* ─────────────────────────────────────────────────────────────────────────
     Season navigation
  ───────────────────────────────────────────────────────────────────────── */

  const handleSeasonChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextSeasonId = Number(
      event.target.value
    );

    if (
      !Number.isNaN(nextSeasonId) &&
      nextSeasonId !== seasonId
    ) {
      navigate(
        `/history/${nextSeasonId}`
      );
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
     Derived data
  ───────────────────────────────────────────────────────────────────────── */

  const getTeam = (
    teamId?: number | null
  ): Team | undefined => {
    return teams.find(
      (team) =>
        team.team_id === teamId
    );
  };

  const getTeamName = (
    teamId?: number | null
  ): string => {
    return (
      getTeam(teamId)?.name ??
      "N/A"
    );
  };

  const getTeamColor = (
    teamId?: number | null
  ): string => {
    return (
      getTeam(teamId)?.color ??
      "#6b7280"
    );
  };

  const filteredPlayers =
    useMemo(() => {
      return players.filter(
        (player) => {
          /*
           * Player filter
           */
          if (
            playerFilter !== "all" &&
            player.id !==
              playerFilter
          ) {
            return false;
          }

          /*
           * Team filter
           */
          if (
            teamFilter !== "all"
          ) {
            const selectedTeam =
              teams.find(
                (team) =>
                  team.team_id ===
                  teamFilter
              );

            if (
              player.team !==
              selectedTeam?.name
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      players,
      teams,
      teamFilter,
      playerFilter,
    ]);

  const filteredGames =
    useMemo(() => {
      if (
        teamFilter === "all"
      ) {
        return games;
      }

      return games.filter(
        (game) =>
          game.team_id ===
          teamFilter
      );
    }, [
      games,
      teamFilter,
    ]);

  const totalSets =
    filteredGames.reduce(
      (total, game) =>
        total + game.sets.length,
      0
    );

  /* ─────────────────────────────────────────────────────────────────────────
     Loading
  ───────────────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass px-6 py-4 text-sm text-muted-foreground">
          Loading season…
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Season not found
  ───────────────────────────────────────────────────────────────────────── */

  if (!season) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass px-6 py-6 text-center max-w-md">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />

          <h2 className="font-semibold text-lg">
            Season not found
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            We couldn't find the requested
            season.
          </p>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen px-3 sm:px-4 py-6 sm:py-10">

      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-7">

        {/* ═══════════════════════════════════════════════════════════════════
            Header
        ═══════════════════════════════════════════════════════════════════ */}

        <header className="glass p-4 sm:p-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Title */}

            <div>
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1">
                Season History
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {season.name}
              </h1>
            </div>

            {/* Season selector */}

            <div className="relative w-full sm:w-auto">

              <label
                htmlFor="season-select"
                className="sr-only"
              >
                Select season
              </label>

              <select
                id="season-select"
                value={seasonId}
                onChange={
                  handleSeasonChange
                }
                disabled={
                  seasonsLoading
                }
                className="
                  appearance-none
                  w-full
                  sm:w-[210px]
                  rounded-xl
                  border
                  border-white/50
                  bg-white/40
                  dark:bg-white/10
                  backdrop-blur-xl
                  px-4
                  py-2.5
                  pr-10
                  text-sm
                  font-semibold
                  text-foreground
                  shadow-sm
                  outline-none
                  cursor-pointer
                  transition-all
                  duration-200
                  hover:bg-white/55
                  dark:hover:bg-white/15
                  focus:ring-2
                  focus:ring-primary/30
                "
              >
                {seasonsLoading ? (
                  <option
                    value={seasonId}
                  >
                    Loading seasons…
                  </option>
                ) : (
                  seasons.map(
                    (
                      availableSeason
                    ) => (
                      <option
                        key={
                          availableSeason.season_id
                        }
                        value={
                          availableSeason.season_id
                        }
                      >
                        {
                          availableSeason.name
                        }
                      </option>
                    )
                  )
                )}
              </select>

              <ChevronDown
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

            </div>

          </div>

        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            Season Awards
        ═══════════════════════════════════════════════════════════════════ */}

        <Card className="glass border-0">

          <CardHeader className="px-4 sm:px-6 pb-3">

            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">

              <Trophy className="h-5 w-5 text-primary" />

              Season Awards

            </CardTitle>

          </CardHeader>

          <CardContent className="px-4 sm:px-6">

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">

              {awards.map(
                (award) => (
                  <div
                    key={
                      award.title
                    }
                    className="
                      rounded-xl
                      border
                      border-white/40
                      bg-white/25
                      dark:bg-white/5
                      p-3
                      sm:p-4
                      text-center
                      transition-colors
                      hover:bg-white/40
                      dark:hover:bg-white/10
                    "
                  >

                    <div className="text-2xl sm:text-3xl mb-1">
                      {award.icon}
                    </div>

                    <div className="font-bold text-xs sm:text-sm leading-tight">
                      {award.title}
                    </div>

                    <div className="mt-1.5 text-primary font-semibold text-sm sm:text-base">
                      {award.winner}
                    </div>

                    <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                      {award.team}
                    </div>

                  </div>
                )
              )}

            </div>

          </CardContent>

        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            Filters
        ═══════════════════════════════════════════════════════════════════ */}

        <div className="glass p-3 sm:p-4">

          <div className="flex items-center gap-2 mb-3">

            <Users className="h-4 w-4 text-primary" />

            <span className="text-sm font-semibold">
              Filter History
            </span>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

            {/* Team filter */}

            <div className="relative">

              <label
                htmlFor="team-filter"
                className="sr-only"
              >
                Filter by team
              </label>

              <select
                id="team-filter"
                value={teamFilter}
                onChange={(event) =>
                  setTeamFilter(
                    event.target
                      .value === "all"
                      ? "all"
                      : Number(
                          event.target
                            .value
                        )
                  )
                }
                className="
                  appearance-none
                  w-full
                  rounded-xl
                  border
                  border-white/40
                  bg-white/30
                  dark:bg-white/5
                  backdrop-blur-xl
                  px-3
                  py-2
                  pr-9
                  text-sm
                  outline-none
                  cursor-pointer
                  focus:ring-2
                  focus:ring-primary/30
                "
              >

                <option value="all">
                  All Teams
                </option>

                {teams.map(
                  (team) => (
                    <option
                      key={
                        team.team_id
                      }
                      value={
                        team.team_id
                      }
                    >
                      {team.name}
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

            </div>

            {/* Player filter */}

            <div className="relative">

              <label
                htmlFor="player-filter"
                className="sr-only"
              >
                Filter by player
              </label>

              <select
                id="player-filter"
                value={playerFilter}
                onChange={(event) =>
                  setPlayerFilter(
                    event.target
                      .value === "all"
                      ? "all"
                      : Number(
                          event.target
                            .value
                        )
                  )
                }
                className="
                  appearance-none
                  w-full
                  rounded-xl
                  border
                  border-white/40
                  bg-white/30
                  dark:bg-white/5
                  backdrop-blur-xl
                  px-3
                  py-2
                  pr-9
                  text-sm
                  outline-none
                  cursor-pointer
                  focus:ring-2
                  focus:ring-primary/30
                "
              >

                <option value="all">
                  All Players
                </option>

                {players.map(
                  (player) => (
                    <option
                      key={
                        player.id
                      }
                      value={
                        player.id
                      }
                    >
                      {player.name}
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

            </div>

          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            Player Stats
        ═══════════════════════════════════════════════════════════════════ */}

        <Card className="glass border-0">

          <CardHeader className="px-4 sm:px-6 pb-3">

            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">

              <CalendarDays className="h-5 w-5 text-primary" />

              Player Stats

              <Badge
                variant="secondary"
                className="ml-auto text-xs"
              >
                {filteredPlayers.length}
              </Badge>

            </CardTitle>

          </CardHeader>

          <CardContent className="px-4 sm:px-6">

            {filteredPlayers.length ===
            0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No players found.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">

                {filteredPlayers.map(
                  (player) => (
                    <PlayerCard
                      key={
                        player.id
                      }
                      player={
                        player
                      }
                      forceShowStats
                    />
                  )
                )}

              </div>
            )}

          </CardContent>

        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            Match History
        ═══════════════════════════════════════════════════════════════════ */}

        <Card className="glass border-0">

          <CardHeader className="px-4 sm:px-6 pb-3">

            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">

              <CalendarDays className="h-5 w-5 text-primary" />

              Match History

              <Badge
                variant="secondary"
                className="ml-auto text-xs"
              >
                {totalSets} sets
              </Badge>

            </CardTitle>

          </CardHeader>

          <CardContent className="px-1 sm:px-6">

            {filteredGames.length ===
            0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No games played yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl">

                <table className="w-full text-xs sm:text-sm text-left border-collapse">

                  <thead>

                    <tr className="border-b border-white/20 text-muted-foreground">

                      <th className="px-2 sm:px-3 py-2 font-semibold">
                        Date
                      </th>

                      <th className="px-2 sm:px-3 py-2 font-semibold hidden sm:table-cell">
                        Time
                      </th>

                      <th className="px-2 sm:px-3 py-2 font-semibold">
                        Team
                      </th>

                      <th className="px-2 sm:px-3 py-2 font-semibold">
                        Opponent
                      </th>

                      <th className="px-2 sm:px-3 py-2 text-center font-semibold">
                        Set
                      </th>

                      <th className="px-2 sm:px-3 py-2 text-center font-semibold">
                        PF
                      </th>

                      <th className="px-2 sm:px-3 py-2 text-center font-semibold">
                        PA
                      </th>

                      <th className="px-2 sm:px-3 py-2 text-center font-semibold hidden sm:table-cell">
                        Diff
                      </th>

                      <th className="px-2 sm:px-3 py-2 text-center font-semibold">
                        Result
                      </th>

                      <th className="px-2 sm:px-3 py-2 text-center font-semibold">
                        VOD
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredGames.map(
                      (game) =>
                        game.sets.map(
                          (set) => {

                            const teamColor =
                              getTeamColor(
                                game.team_id
                              );

                            const diff =
                              (set.points_for ??
                                0) -
                              (set.points_against ??
                                0);

                            return (
                              <tr
                                key={`${game.id}-set-${set.set_no}`}
                                style={{
                                  background:
                                    `linear-gradient(
                                      90deg,
                                      ${teamColor}18 0%,
                                      transparent 30%
                                    )`,
                                }}
                                className="
                                  border-b
                                  border-white/10
                                  last:border-0
                                  transition-colors
                                  hover:bg-white/10
                                "
                              >

                                {/* Date */}

                                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">

                                  {game.date
                                    ? new Date(
                                        game.date
                                      ).toLocaleDateString(
                                        undefined,
                                        {
                                          month:
                                            "short",
                                          day:
                                            "numeric",
                                        }
                                      )
                                    : "—"}

                                </td>

                                {/* Time */}

                                <td className="px-2 sm:px-3 py-2 hidden sm:table-cell whitespace-nowrap text-muted-foreground">

                                  {formatTime12H(
                                    game.time
                                  )}

                                </td>

                                {/* Team */}

                                <td
                                  className="
                                    px-2
                                    sm:px-3
                                    py-2
                                    font-semibold
                                    max-w-[110px]
                                    truncate
                                  "
                                  style={{
                                    color:
                                      teamColor,
                                  }}
                                  title={getTeamName(
                                    game.team_id
                                  )}
                                >
                                  {getTeamName(
                                    game.team_id
                                  )}
                                </td>

                                {/* Opponent */}

                                <td
                                  className="
                                    px-2
                                    sm:px-3
                                    py-2
                                    font-semibold
                                    max-w-[110px]
                                    truncate
                                  "
                                >
                                  {game.opponent ??
                                    "—"}
                                </td>

                                {/* Set */}

                                <td className="px-2 sm:px-3 py-2 text-center">
                                  {set.set_no ??
                                    "—"}
                                </td>

                                {/* PF */}

                                <td className="px-2 sm:px-3 py-2 text-center text-green-600 dark:text-green-400 font-bold">
                                  {set.points_for ??
                                    "—"}
                                </td>

                                {/* PA */}

                                <td className="px-2 sm:px-3 py-2 text-center text-red-600 dark:text-red-400 font-bold">
                                  {set.points_against ??
                                    "—"}
                                </td>

                                {/* Difference */}

                                <td className="px-2 sm:px-3 py-2 text-center font-semibold hidden sm:table-cell">

                                  {diff > 0
                                    ? `+${diff}`
                                    : diff}

                                </td>

                                {/* Result */}

                                <td className="px-2 sm:px-3 py-2 text-center">

                                  <Badge
                                    className={`
                                      min-w-[28px]
                                      justify-center
                                      px-1.5
                                      py-0.5
                                      rounded-full
                                      text-[10px]
                                      font-bold
                                      border-0

                                      ${
                                        set.result ===
                                        "W"
                                          ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                          : set.result ===
                                            "L"
                                          ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                          : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                                      }
                                    `}
                                  >
                                    {
                                      set.result
                                    }
                                  </Badge>

                                </td>

                                {/* VOD */}

                                <td className="px-2 sm:px-3 py-2 text-center">

                                  {set.vod_link ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="
                                        h-7
                                        px-2
                                        gap-1
                                        text-primary
                                        hover:bg-primary/10
                                      "
                                      onClick={() =>
                                        window.open(
                                          set.vod_link!,
                                          "_blank",
                                          "noopener,noreferrer"
                                        )
                                      }
                                    >

                                      <PlayCircle className="h-3.5 w-3.5" />

                                      <span className="hidden sm:inline">
                                        Watch
                                      </span>

                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}

                                </td>

                              </tr>
                            );
                          }
                        )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </CardContent>

        </Card>

      </div>

    </div>
  );
}
