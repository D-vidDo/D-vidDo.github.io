/**
 * History.tsx
 *
 * Retrospective view of a completed season.
 */

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import PlayerCard, { Player } from "@/components/PlayerCard";
import {
  CalendarDays,
  PlayCircle,
  Trophy,
  Users,
  ChevronDown,
  BarChart3,
  Medal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ============================================================
   TYPES
============================================================ */

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

/* ============================================================
   HELPERS
============================================================ */

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

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getContrastColor = (hex?: string | null) => {
  if (!hex) return "#ffffff";

  const clean = hex.replace("#", "");

  if (clean.length !== 6) return "#ffffff";

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const brightness =
    (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? "#111827" : "#ffffff";
};

const enrichPlayers = (
  rawPlayers: any[],
  teams: Team[]
): Player[] =>
  rawPlayers.map((p) => {
    const team =
      teams.find(
        (t) =>
          Array.isArray(t.player_ids) &&
          t.player_ids.some(
            (id) => String(id) === String(p.id)
          )
      ) ?? null;

    return {
      ...p,
      team: team?.name ?? null,
      teamColor: team?.color ?? null,
      teamColor2: team?.color2 ?? null,
    } as Player;
  });

/* ============================================================
   COMPONENT
============================================================ */

export default function History({
  seasonId,
}: {
  seasonId: number;
}) {
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

  const [season, setSeason] =
    useState<Season | null>(null);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [games, setGames] =
    useState<Game[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [teamFilter, setTeamFilter] =
    useState<number | "all">("all");

  const [playerFilter, setPlayerFilter] =
    useState<number | "all">("all");

  /* ============================================================
     FETCH
  ============================================================ */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [
          { data: seasonData, error: seasonError },
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
            .from("teams")
            .select("*")
            .eq("season_id", seasonId)
            .order("wins", {
              ascending: false,
            }),

          supabase
            .from("players_old")
            .select("*")
            .eq("season_id", seasonId)
            .order("plus_minus", {
              ascending: false,
            }),

          supabase
            .from("games")
            .select("*")
            .eq("season_id", seasonId)
            .order("date", {
              ascending: true,
            })
            .order("time", {
              ascending: true,
            }),

          supabase
            .from("sets")
            .select("*")
            .eq("season_id", seasonId)
            .order("set_no", {
              ascending: true,
            }),
        ]);

        if (seasonError) throw seasonError;
        if (teamsError) throw teamsError;
        if (playersError) throw playersError;
        if (gamesError) throw gamesError;
        if (setsError) throw setsError;

        const resolvedTeams =
          (teamsData ?? []) as Team[];

        setSeason(seasonData ?? null);
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

  /* ============================================================
     DERIVED DATA
  ============================================================ */

  const selectedTeam = useMemo(
    () =>
      teamFilter === "all"
        ? null
        : teams.find(
            (team) =>
              team.team_id === teamFilter
          ),
    [teamFilter, teams]
  );

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (
        playerFilter !== "all" &&
        Number(player.id) !== Number(playerFilter)
      ) {
        return false;
      }

      if (
        selectedTeam &&
        player.team !== selectedTeam.name
      ) {
        return false;
      }

      return true;
    });
  }, [
    players,
    playerFilter,
    selectedTeam,
  ]);

  const filteredGames = useMemo(() => {
    if (teamFilter === "all") return games;

    return games.filter(
      (game) =>
        game.team_id === teamFilter
    );
  }, [games, teamFilter]);

  const totalGames = games.length;

  const totalSets = games.reduce(
    (sum, game) =>
      sum + game.sets.length,
    0
  );

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#050506] flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-12 w-12 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-[3px] border-black/5 dark:border-white/10" />

            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-black dark:border-t-white animate-spin" />
          </div>

          <p className="text-sm text-black/50 dark:text-white/50">
            Loading season history…
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (!season) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#050506] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-10 w-10 mx-auto mb-4 text-black/30 dark:text-white/30" />

          <h1 className="text-2xl font-semibold">
            Season not found
          </h1>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#050506] text-black dark:text-white overflow-hidden">

      {/* ======================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 left-1/4 h-[500px] w-[500px] rounded-full bg-orange-400/10 blur-[130px]" />

        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[140px]" />

        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-500/[0.05] blur-[140px]" />
      </div>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative px-4 pt-5 md:pt-8">
        <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[32px] md:rounded-[42px] border border-white/30 dark:border-white/10 bg-gradient-to-br from-orange-500 via-orange-400 to-blue-500 shadow-[0_25px_80px_rgba(0,0,0,0.12)]">

          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-black/10 pointer-events-none" />

          <div className="absolute -top-40 -right-20 h-[500px] w-[500px] rounded-full bg-white/20 blur-[100px]" />

          <div className="absolute -bottom-60 -left-20 h-[500px] w-[500px] rounded-full bg-white/10 blur-[120px]" />

          <div className="relative px-6 py-8 md:px-12 md:py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 backdrop-blur-xl px-3.5 py-1.5 mb-5">
              <Trophy className="h-3.5 w-3.5 text-white" />

              <span className="text-[11px] font-semibold tracking-[0.16em] text-white/90">
                SEASON ARCHIVE
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.045em] text-white">
              {season.name}
            </h1>

            <p className="mt-3 max-w-2xl text-base md:text-lg text-white/75">
              A complete retrospective of the
              season — players, matches,
              standings, and awards.
            </p>

            <div className="flex flex-wrap gap-2.5 mt-7">
              <HeroStat
                icon={<Users />}
                value={teams.length}
                label="Teams"
              />

              <HeroStat
                icon={<Users />}
                value={players.length}
                label="Players"
              />

              <HeroStat
                icon={<CalendarDays />}
                value={totalGames}
                label="Games"
              />

              <HeroStat
                icon={<BarChart3 />}
                value={totalSets}
                label="Sets"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-6 md:space-y-8">

        {/* ====================================================
            AWARDS
        ==================================================== */}

        <GlassPanel>
          <SectionHeader
            icon={<Trophy />}
            title="Season Awards"
            count={awards.length}
          />

          <p className="text-sm text-black/45 dark:text-white/45 mt-2 mb-6">
            Recognition from the completed season.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {awards.map((award) => (
              <div
                key={award.title}
                className="group relative overflow-hidden rounded-[22px] border border-black/5 dark:border-white/10 bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl p-4 hover:bg-white/65 dark:hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-2xl bg-black/[0.04] dark:bg-white/[0.07] flex items-center justify-center text-xl">
                    {award.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-medium uppercase tracking-[0.08em] text-black/40 dark:text-white/40 truncate">
                      {award.title}
                    </div>

                    <div className="font-semibold truncate mt-0.5">
                      {award.winner}
                    </div>

                    <div className="text-xs text-black/40 dark:text-white/40 truncate">
                      {award.team}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <GlassPanel>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <SectionHeader
                icon={<BarChart3 />}
                title="Season Statistics"
              />

              <p className="text-sm text-black/45 dark:text-white/45 mt-2">
                Explore historical player and
                match data.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <GlassSelect
                value={teamFilter}
                onChange={(value) => {
                  setTeamFilter(
                    value === "all"
                      ? "all"
                      : Number(value)
                  );

                  setPlayerFilter("all");
                }}
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
              </GlassSelect>

              <GlassSelect
                value={playerFilter}
                onChange={(value) =>
                  setPlayerFilter(
                    value === "all"
                      ? "all"
                      : Number(value)
                  )
                }
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
              </GlassSelect>
            </div>
          </div>
        </GlassPanel>

        {/* ====================================================
            PLAYERS
        ==================================================== */}

        <GlassPanel>
          <SectionHeader
            icon={<Users />}
            title="Player Stats"
            count={filteredPlayers.length}
          />

          <p className="text-sm text-black/45 dark:text-white/45 mt-2 mb-6">
            Historical player performance for
            {selectedTeam
              ? ` ${selectedTeam.name}`
              : " the entire season"}.
          </p>

          {filteredPlayers.length === 0 ? (
            <EmptyState text="No players found." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="rounded-[24px] overflow-hidden border border-black/5 dark:border-white/10 bg-white/35 dark:bg-white/[0.04] backdrop-blur-xl shadow-sm hover:shadow-xl hover:bg-white/50 dark:hover:bg-white/[0.07] transition-all duration-300"
                >
                  <PlayerCard
                    player={player}
                    forceShowStats
                  />
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* ====================================================
            MATCH HISTORY
        ==================================================== */}

        <GlassPanel>
          <SectionHeader
            icon={<CalendarDays />}
            title="Match History"
            count={filteredGames.length}
          />

          <p className="text-sm text-black/45 dark:text-white/45 mt-2 mb-6">
            Set-by-set results from the completed
            season.
          </p>

          {filteredGames.length === 0 ? (
            <EmptyState text="No games found." />
          ) : (
            <MatchHistory
              games={filteredGames}
              teams={teams}
            />
          )}
        </GlassPanel>
      </main>
    </div>
  );
}

/* ============================================================
   HERO STAT
============================================================ */

const HeroStat = ({
  icon,
  value,
  label,
}: {
  icon: JSX.Element;
  value: number;
  label: string;
}) => (
  <div className="inline-flex items-center gap-2.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-xl px-4 py-2.5 text-white shadow-lg">
    <span className="text-white/70">
      {React.cloneElement(icon, {
        className: "h-4 w-4",
      })}
    </span>

    <span className="font-semibold">
      {value}
    </span>

    <span className="text-sm text-white/65">
      {label}
    </span>
  </div>
);

/* ============================================================
   GLASS PANEL
============================================================ */

const GlassPanel = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <section className="rounded-[30px] md:rounded-[34px] border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/[0.045] backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.06)] overflow-hidden">
    <div className="p-5 md:p-7">
      {children}
    </div>
  </section>
);

/* ============================================================
   SECTION HEADER
============================================================ */

const SectionHeader = ({
  icon,
  title,
  count,
}: {
  icon: JSX.Element;
  title: string;
  count?: number;
}) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 shrink-0 rounded-2xl bg-black/[0.04] dark:bg-white/[0.07] flex items-center justify-center text-black/55 dark:text-white/60">
      {React.cloneElement(icon, {
        className: "h-5 w-5",
      })}
    </div>

    <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
      {title}
    </h2>

    {count !== undefined && (
      <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-black/45 dark:text-white/45">
        {count}
      </span>
    )}
  </div>
);

/* ============================================================
   GLASS SELECT
============================================================ */

const GlassSelect = ({
  value,
  onChange,
  children,
}: {
  value: number | "all";
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="appearance-none w-full sm:w-[190px] h-11 rounded-full border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl pl-4 pr-10 text-sm font-medium text-black dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30 transition-all"
    >
      {children}
    </select>

    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40" />
  </div>
);

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = ({
  text,
}: {
  text: string;
}) => (
  <div className="rounded-[24px] border border-dashed border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02] py-12 text-center">
    <p className="text-sm text-black/40 dark:text-white/40">
      {text}
    </p>
  </div>
);

/* ============================================================
   MATCH HISTORY
============================================================ */

const MatchHistory = ({
  games,
  teams,
}: {
  games: Game[];
  teams: Team[];
}) => {
  const getTeam = (
    teamId?: number | null
  ) =>
    teams.find(
      (team) => team.team_id === teamId
    );

  return (
    <div className="overflow-hidden rounded-[24px] border border-black/5 dark:border-white/10 bg-white/25 dark:bg-white/[0.025] backdrop-blur-xl">

      {/* Desktop table */}

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-black/[0.025] dark:bg-white/[0.035] border-b border-black/5 dark:border-white/10">
              <th className="px-4 py-3.5 font-medium text-black/45 dark:text-white/45">
                Date
              </th>

              <th className="px-4 py-3.5 font-medium text-black/45 dark:text-white/45">
                Team
              </th>

              <th className="px-4 py-3.5 font-medium text-black/45 dark:text-white/45">
                Opponent
              </th>

              <th className="px-4 py-3.5 text-center font-medium text-black/45 dark:text-white/45">
                Set
              </th>

              <th className="px-4 py-3.5 text-center font-medium text-black/45 dark:text-white/45">
                Score
              </th>

              <th className="px-4 py-3.5 text-center font-medium text-black/45 dark:text-white/45">
                Diff
              </th>

              <th className="px-4 py-3.5 text-center font-medium text-black/45 dark:text-white/45">
                Result
              </th>

              <th className="px-4 py-3.5 text-center font-medium text-black/45 dark:text-white/45">
                VOD
              </th>
            </tr>
          </thead>

          <tbody>
            {games.map((game) => {
              const team = getTeam(
                game.team_id
              );

              return game.sets.map((set) => {
                const difference =
                  (set.points_for ?? 0) -
                  (set.points_against ?? 0);

                return (
                  <tr
                    key={`${game.id}-${set.set_no}`}
                    className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {formatDate(game.date)}
                    </td>

                    <td className="px-4 py-3.5">
                      <TeamBadge team={team} />
                    </td>

                    <td className="px-4 py-3.5 font-semibold">
                      {game.opponent ?? "—"}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold">
                        {set.set_no}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="font-semibold text-emerald-500">
                        {set.points_for}
                      </span>

                      <span className="mx-1.5 text-black/20 dark:text-white/20">
                        –
                      </span>

                      <span className="font-semibold text-red-500">
                        {set.points_against}
                      </span>
                    </td>

                    <td
                      className={`px-4 py-3.5 text-center font-semibold ${
                        difference > 0
                          ? "text-emerald-500"
                          : difference < 0
                          ? "text-red-500"
                          : "text-black/40 dark:text-white/40"
                      }`}
                    >
                      {difference > 0
                        ? "+"
                        : ""}
                      {difference}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <ResultBadge
                        result={
                          set.result
                        }
                      />
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <VodButton
                        link={set.vod_link}
                      />
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}

      <div className="md:hidden divide-y divide-black/5 dark:divide-white/10">
        {games.map((game) => {
          const team = getTeam(
            game.team_id
          );

          return game.sets.map((set) => {
            const difference =
              (set.points_for ?? 0) -
              (set.points_against ?? 0);

            return (
              <div
                key={`${game.id}-${set.set_no}`}
                className="px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-black/40 dark:text-white/40">
                        {formatDate(
                          game.date
                        )}
                      </span>

                      <span className="text-black/20 dark:text-white/20">
                        •
                      </span>

                      <span className="text-xs text-black/40 dark:text-white/40">
                        {formatTime12H(
                          game.time
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">
                        {team?.name ??
                          "Unknown Team"}
                      </span>

                      <span className="text-black/30 dark:text-white/30">
                        vs
                      </span>

                      <span className="font-semibold truncate">
                        {game.opponent ??
                          "—"}
                      </span>
                    </div>
                  </div>

                  <ResultBadge
                    result={set.result}
                  />
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-black/35 dark:text-white/35">
                        Set
                      </div>

                      <div className="font-semibold">
                        {set.set_no}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-black/35 dark:text-white/35">
                        Score
                      </div>

                      <div className="font-semibold">
                        <span className="text-emerald-500">
                          {set.points_for}
                        </span>

                        <span className="mx-1 text-black/20 dark:text-white/20">
                          –
                        </span>

                        <span className="text-red-500">
                          {set.points_against}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-black/35 dark:text-white/35">
                        Diff
                      </div>

                      <div
                        className={`font-semibold ${
                          difference > 0
                            ? "text-emerald-500"
                            : difference < 0
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        {difference > 0
                          ? "+"
                          : ""}
                        {difference}
                      </div>
                    </div>
                  </div>

                  {set.vod_link && (
                    <VodButton
                      link={set.vod_link}
                    />
                  )}
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

/* ============================================================
   TEAM BADGE
============================================================ */

const TeamBadge = ({
  team,
}: {
  team?: Team;
}) => {
  if (!team) {
    return (
      <span className="text-black/35 dark:text-white/35">
        —
      </span>
    );
  }

  const color =
    team.color ?? "#64748b";

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold max-w-[160px]"
      style={{
        backgroundColor: `${color}18`,
        color,
      }}
    >
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{
          backgroundColor: color,
        }}
      />

      <span className="truncate">
        {team.name}
      </span>
    </span>
  );
};

/* ============================================================
   RESULT BADGE
============================================================ */

const ResultBadge = ({
  result,
}: {
  result: "W" | "L" | "T" | null;
}) => {
  const styles =
    result === "W"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15"
      : result === "L"
      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/15"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15";

  return (
    <span
      className={`inline-flex items-center justify-center min-w-9 rounded-full border px-2.5 py-1 text-xs font-bold ${styles}`}
    >
      {result ?? "—"}
    </span>
  );
};

/* ============================================================
   VOD BUTTON
============================================================ */

const VodButton = ({
  link,
}: {
  link?: string | null;
}) => {
  if (!link) {
    return (
      <span className="text-xs text-black/25 dark:text-white/25">
        —
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 rounded-full px-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
      onClick={() =>
        window.open(
          link,
          "_blank",
          "noopener,noreferrer"
        )
      }
    >
      <PlayCircle className="h-3.5 w-3.5 mr-1.5" />

      <span className="hidden sm:inline">
        Watch
      </span>
    </Button>
  );
}
