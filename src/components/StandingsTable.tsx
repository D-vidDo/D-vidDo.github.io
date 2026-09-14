import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Trophy,
  CalendarDays,
  Swords,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/* ================= TYPES ================= */

interface Set {
  set_no: number;
  points_for: number;
  points_against: number;
}

interface Game {
  id: string;
  date: string;
  time: string;
  opponent: string;
  sets: Set[];
  dateTime: Date;
}

interface Team {
  team_id: string;
  name: string;
  color: string;
  games: Game[];
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
}

interface Season {
  season_id: number;
  name: string;
}

/* ================= ACCORDION ================= */

const AccordionContent = ({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.maxHeight = expanded
        ? `${ref.current.scrollHeight}px`
        : "0px";
    }
  }, [expanded]);

  return (
    <div
      ref={ref}
      style={{
        overflow: "hidden",
        transition:
          "max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
        maxHeight: expanded ? "1000px" : "0px",
        opacity: expanded ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
};

/* ================= HELPERS ================= */

const getRankStyle = (rank: number) => {
  if (rank === 1) {
    return {
      wrapper:
        "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.35)]",
      icon: "text-yellow-100",
    };
  }

  if (rank === 2) {
    return {
      wrapper:
        "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-700 shadow-[0_4px_14px_rgba(148,163,184,0.3)]",
      icon: "text-slate-500",
    };
  }

  if (rank === 3) {
    return {
      wrapper:
        "bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)]",
      icon: "text-orange-100",
    };
  }

  return {
    wrapper:
      "bg-white/60 dark:bg-white/10 text-muted-foreground border border-white/40 dark:border-white/10",
    icon: "text-muted-foreground",
  };
};

const getResultStyle = (result: "W" | "L" | "T") => {
  if (result === "W") {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }

  if (result === "L") {
    return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20";
  }

  return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
};

/* ================= MAIN COMPONENT ================= */

const StandingsTable = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const [seasonId, setSeasonId] = useState<number>(2);
  const [seasonName, setSeasonName] = useState<string>("Season");
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [loading, setLoading] = useState(true);

  const handleRowClick = (teamId: string) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  /* ================= FETCH SEASONS ================= */

  useEffect(() => {
    async function fetchSeasons() {
      const { data } = await supabase
        .from("seasons")
        .select("season_id, name")
        .order("season_id");

      if (!data || data.length === 0) return;

      setSeasons(data);

      const defaultSeason = data.find((s) => s.season_id === 5);

      setSeasonId(
        defaultSeason ? defaultSeason.season_id : data[0].season_id
      );
    }

    fetchSeasons();
  }, []);

  /* ================= FETCH STANDINGS DATA ================= */

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      /* ---------- Season ---------- */

      const { data: season } = await supabase
        .from("seasons")
        .select("name")
        .eq("season_id", seasonId)
        .single();

      if (season?.name) {
        setSeasonName(season.name);
      }

      /* ---------- Teams ---------- */

      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("season_id", seasonId);

      /* ---------- Games ---------- */

      const { data: gameData } = await supabase
        .from("games")
        .select(
          `
          id,
          date,
          time,
          opponent,
          team_id,
          sets (
            set_no,
            points_for,
            points_against
          )
        `
        )
        .eq("season_id", seasonId);

      if (!teamData || !gameData) {
        setLoading(false);
        return;
      }

      const teamMap: Record<string, Team> = {};

      /* ---------- Initialize Teams ---------- */

      teamData.forEach((team) => {
        teamMap[team.team_id] = {
          team_id: team.team_id,
          name: team.name,
          color: team.color,
          games: [],
          wins: 0,
          losses: 0,
          ties: 0,
          points_for: 0,
          points_against: 0,
        };
      });

      /* ---------- Process Games ---------- */

      gameData.forEach((game) => {
        const team = teamMap[game.team_id];

        if (!team || !game.sets?.length) return;

        let wins = 0;
        let losses = 0;
        let ties = 0;

        let pf = 0;
        let pa = 0;

        game.sets.forEach((set) => {
          pf += set.points_for;
          pa += set.points_against;

          if (set.points_for === set.points_against) {
            ties++;
          } else if (set.points_for > set.points_against) {
            wins++;
          } else {
            losses++;
          }
        });

        team.points_for += pf;
        team.points_against += pa;

        if (wins > losses) {
          team.wins++;
        } else if (losses > wins) {
          team.losses++;
        } else {
          team.ties++;
        }

        const dateTime = new Date(
          `${game.date}T${game.time ?? "00:00:00"}`
        );

        team.games.push({
          id: game.id,
          date: game.date,
          time: game.time,
          dateTime,
          opponent: game.opponent,
          sets: [...game.sets].sort(
            (a, b) => a.set_no - b.set_no
          ),
        });
      });

      /* ---------- Sort Match History ---------- */

      Object.values(teamMap).forEach((team) => {
        team.games.sort(
          (a, b) =>
            a.dateTime.getTime() - b.dateTime.getTime()
        );
      });

      setTeams(Object.values(teamMap));
      setLoading(false);
    }

    fetchData();
  }, [seasonId]);

  /* ================= SORT TEAMS ================= */

  const sortedTeams = teams
    .map((team) => ({
      ...team,

      winPercentage:
        team.wins + team.losses + team.ties > 0
          ? team.wins /
            (team.wins + team.losses + team.ties)
          : 0,

      pointDifferential:
        team.points_for - team.points_against,
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (b.pointDifferential !== a.pointDifferential) {
        return b.pointDifferential - a.pointDifferential;
      }

      return b.points_for - a.points_for;
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

  /* ================= RENDER ================= */

  return (
    <Card
      className="
        relative
        overflow-hidden
        border border-white/50
        dark:border-white/10
        bg-white/65
        dark:bg-slate-950/60
        backdrop-blur-2xl
        shadow-[0_20px_60px_rgba(15,23,42,0.08)]
        dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]
        rounded-3xl
      "
    >
      {/* Decorative glass glow */}

      <div
        className="
          pointer-events-none
          absolute
          -top-32
          -right-32
          h-72
          w-72
          rounded-full
          bg-blue-400/15
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-40
          -left-32
          h-80
          w-80
          rounded-full
          bg-orange-400/10
          blur-3xl
        "
      />

      {/* ================= HEADER ================= */}

      <CardHeader className="relative z-10 pb-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight">
              <span
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-blue-500
                  to-indigo-600
                  text-white
                  shadow-lg
                  shadow-blue-500/20
                "
              >
                <TrendingUp className="h-5 w-5" />
              </span>

              <span>
                {seasonName}
                <span className="block text-sm font-medium text-muted-foreground mt-0.5">
                  League Standings
                </span>
              </span>
            </CardTitle>
          </div>

          {/* Season Selector */}

          {seasons.length > 0 && (
            <div
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                border
                border-white/50
                dark:border-white/10
                bg-white/50
                dark:bg-white/5
                backdrop-blur-xl
                px-3
                py-2
                shadow-sm
              "
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <span className="text-xs font-medium text-muted-foreground">
                Season
              </span>

              <select
                value={seasonId}
                onChange={(e) =>
                  setSeasonId(Number(e.target.value))
                }
                className="
                  bg-transparent
                  text-sm
                  font-semibold
                  text-foreground
                  outline-none
                  cursor-pointer
                  border-none
                "
              >
                {seasons.map((season) => (
                  <option
                    key={season.season_id}
                    value={season.season_id}
                  >
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Header divider */}

        <div
          className="
            mt-5
            h-px
            bg-gradient-to-r
            from-transparent
            via-border
            to-transparent
          "
        />
      </CardHeader>

      {/* ================= CONTENT ================= */}

      <CardContent className="relative z-10 px-3 sm:px-6 pb-6">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="
                  h-16
                  rounded-2xl
                  bg-muted/40
                  animate-pulse
                "
              />
            ))}
          </div>
        ) : sortedTeams.length === 0 ? (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              py-16
              text-center
              text-muted-foreground
            "
          >
            <Trophy className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-semibold">
              No standings available
            </p>
            <p className="text-sm mt-1">
              There are no teams recorded for this season yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              {/* ================= TABLE HEADER ================= */}

              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-16 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Rank
                  </TableHead>

                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Team
                  </TableHead>

                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    W
                  </TableHead>

                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    L
                  </TableHead>

                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    T
                  </TableHead>

                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Win %
                  </TableHead>

                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    PF
                  </TableHead>

                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    PA
                  </TableHead>

                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Diff
                  </TableHead>
                </TableRow>
              </TableHeader>

              {/* ================= TABLE BODY ================= */}

              <TableBody>
                {sortedTeams.map((team) => {
                  const rankStyle = getRankStyle(team.rank);

                  return (
                    <React.Fragment key={team.team_id}>
                      {/* ================= MAIN ROW ================= */}

                      <TableRow
                        className="
                          group
                          border-none
                          cursor-pointer
                          transition-all
                          duration-300
                          hover:bg-white/60
                          dark:hover:bg-white/5
                        "
                        onClick={() =>
                          handleRowClick(team.team_id)
                        }
                      >
                        {/* Rank */}

                        <TableCell className="py-3">
                          <div
                            className={`
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-xl
                              text-sm
                              font-bold
                              transition-transform
                              duration-300
                              group-hover:scale-105
                              ${rankStyle.wrapper}
                            `}
                          >
                            {team.rank <= 3 ? (
                              <Trophy
                                className={`h-4 w-4 ${rankStyle.icon}`}
                              />
                            ) : (
                              team.rank
                            )}
                          </div>
                        </TableCell>

                        {/* Team */}

                        <TableCell className="py-3">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            {/* Team color */}

                            <div
                              className="
                                relative
                                h-11
                                w-11
                                shrink-0
                                rounded-2xl
                                p-[2px]
                                shadow-sm
                                transition-transform
                                duration-300
                                group-hover:scale-105
                              "
                              style={{
                                background: `linear-gradient(135deg, ${team.color}, ${team.color}88)`,
                              }}
                            >
                              <div
                                className="
                                  flex
                                  h-full
                                  w-full
                                  items-center
                                  justify-center
                                  rounded-[14px]
                                  bg-white/80
                                  dark:bg-slate-900/80
                                  backdrop-blur-md
                                  font-bold
                                  text-xs
                                "
                                style={{
                                  color: team.color,
                                }}
                              >
                                {team.name
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            </div>

                            {/* Team name */}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold truncate">
                                  {team.name}
                                </span>

                                {team.rank === 1 && (
                                  <Badge
                                    className="
                                      hidden
                                      sm:inline-flex
                                      rounded-full
                                      bg-yellow-400/15
                                      text-yellow-600
                                      dark:text-yellow-400
                                      border
                                      border-yellow-400/20
                                      text-[10px]
                                      px-2
                                    "
                                  >
                                    #1
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs text-muted-foreground mt-0.5">
                                {team.games.length}{" "}
                                {team.games.length === 1
                                  ? "match"
                                  : "matches"}
                              </div>
                            </div>

                            {/* Expand icon */}

                            <div
                              className="
                                ml-auto
                                flex
                                h-7
                                w-7
                                items-center
                                justify-center
                                rounded-full
                                bg-muted/50
                                transition-all
                                duration-300
                                group-hover:bg-muted
                              "
                            >
                              {expandedTeamId ===
                              team.team_id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Wins */}

                        <TableCell className="text-center py-3">
                          <span
                            className="
                              inline-flex
                              min-w-8
                              justify-center
                              rounded-lg
                              bg-emerald-500/10
                              px-2
                              py-1
                              font-bold
                              text-emerald-600
                              dark:text-emerald-400
                            "
                          >
                            {team.wins}
                          </span>
                        </TableCell>

                        {/* Losses */}

                        <TableCell className="text-center py-3">
                          <span
                            className="
                              inline-flex
                              min-w-8
                              justify-center
                              rounded-lg
                              bg-red-500/10
                              px-2
                              py-1
                              font-bold
                              text-red-600
                              dark:text-red-400
                            "
                          >
                            {team.losses}
                          </span>
                        </TableCell>

                        {/* Ties */}

                        <TableCell className="text-center py-3">
                          <span
                            className="
                              inline-flex
                              min-w-8
                              justify-center
                              rounded-lg
                              bg-amber-500/10
                              px-2
                              py-1
                              font-bold
                              text-amber-600
                              dark:text-amber-400
                            "
                          >
                            {team.ties}
                          </span>
                        </TableCell>

                        {/* Win Percentage */}

                        <TableCell className="text-center py-3">
                          <span className="font-semibold">
                            {(team.winPercentage * 100).toFixed(1)}%
                          </span>
                        </TableCell>

                        {/* PF */}

                        <TableCell className="text-center py-3 font-medium">
                          {team.points_for}
                        </TableCell>

                        {/* PA */}

                        <TableCell className="text-center py-3 font-medium">
                          {team.points_against}
                        </TableCell>

                        {/* Differential */}

                        <TableCell className="text-center py-3">
                          <span
                            className={`
                              inline-flex
                              min-w-14
                              justify-center
                              rounded-lg
                              px-2
                              py-1
                              font-bold
                              ${
                                team.pointDifferential > 0
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : team.pointDifferential < 0
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "bg-muted/50 text-muted-foreground"
                              }
                            `}
                          >
                            {team.pointDifferential > 0
                              ? "+"
                              : ""}
                            {team.pointDifferential}
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* ================= EXPANDED ROW ================= */}

                      <TableRow className="border-none">
                        <TableCell
                          colSpan={9}
                          className="p-0"
                        >
                          <AccordionContent
                            expanded={
                              expandedTeamId === team.team_id
                            }
                          >
                            <div className="px-2 sm:px-4 pb-5 pt-2">
                              {/* Glass match-history panel */}

                              <div
                                className="
                                  overflow-hidden
                                  rounded-2xl
                                  border
                                  border-white/50
                                  dark:border-white/10
                                  bg-white/45
                                  dark:bg-white/[0.03]
                                  backdrop-blur-xl
                                  shadow-inner
                                "
                              >
                                {/* History header */}

                                <div
                                  className="
                                    flex
                                    flex-col
                                    gap-2
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                    border-b
                                    border-white/40
                                    dark:border-white/10
                                    px-4
                                    py-3
                                  "
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-primary/10
                                        text-primary
                                      "
                                    >
                                      <Swords className="h-4 w-4" />
                                    </div>

                                    <div>
                                      <div className="font-bold text-sm">
                                        Match History
                                      </div>

                                      <div className="text-xs text-muted-foreground">
                                        Set-by-set results
                                      </div>
                                    </div>
                                  </div>

                                  <Badge
                                    variant="outline"
                                    className="
                                      self-start
                                      sm:self-auto
                                      rounded-full
                                      bg-white/40
                                      dark:bg-white/5
                                      border-white/50
                                      dark:border-white/10
                                    "
                                  >
                                    {team.wins}W · {team.losses}L
                                    {team.ties > 0
                                      ? ` · ${team.ties}T`
                                      : ""}
                                  </Badge>
                                </div>

                                {/* Games */}

                                {team.games.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-white/30 dark:border-white/10">
                                          <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                                            Date
                                          </th>

                                          <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                                            Opponent
                                          </th>

                                          <th className="py-3 px-4 text-center font-semibold text-muted-foreground">
                                            Set
                                          </th>

                                          <th className="py-3 px-4 text-center font-semibold text-muted-foreground">
                                            PF
                                          </th>

                                          <th className="py-3 px-4 text-center font-semibold text-muted-foreground">
                                            PA
                                          </th>

                                          <th className="py-3 px-4 text-center font-semibold text-muted-foreground">
                                            Result
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {team.games.map(
                                          (game) =>
                                            game.sets.map(
                                              (set, idx) => {
                                                const result =
                                                  set.points_for ===
                                                  set.points_against
                                                    ? "T"
                                                    : set.points_for >
                                                      set.points_against
                                                    ? "W"
                                                    : "L";

                                                return (
                                                  <tr
                                                    key={`${game.id}-${set.set_no}`}
                                                    className="
                                                      border-b
                                                      border-white/20
                                                      dark:border-white/5
                                                      last:border-none
                                                      transition-colors
                                                      hover:bg-white/40
                                                      dark:hover:bg-white/5
                                                    "
                                                  >
                                                    {/* Date */}

                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                      <span className="text-muted-foreground">
                                                        {game.date}
                                                      </span>
                                                    </td>

                                                    {/* Opponent */}

                                                    <td className="py-3 px-4">
                                                      <div className="flex items-center gap-2">
                                                        <span
                                                          className="
                                                            flex
                                                            h-7
                                                            w-7
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            bg-muted/60
                                                            font-bold
                                                            text-[10px]
                                                          "
                                                        >
                                                          {game.opponent
                                                            .slice(
                                                              0,
                                                              2
                                                            )
                                                            .toUpperCase()}
                                                        </span>

                                                        <span className="font-semibold whitespace-nowrap">
                                                          {
                                                            game.opponent
                                                          }
                                                        </span>
                                                      </div>
                                                    </td>

                                                    {/* Set */}

                                                    <td className="py-3 px-4 text-center">
                                                      <span className="text-muted-foreground">
                                                        {
                                                          set.set_no
                                                        }
                                                      </span>
                                                    </td>

                                                    {/* PF */}

                                                    <td className="py-3 px-4 text-center">
                                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {
                                                          set.points_for
                                                        }
                                                      </span>
                                                    </td>

                                                    {/* PA */}

                                                    <td className="py-3 px-4 text-center">
                                                      <span className="font-bold text-red-600 dark:text-red-400">
                                                        {
                                                          set.points_against
                                                        }
                                                      </span>
                                                    </td>

                                                    {/* Result */}

                                                    <td className="py-3 px-4 text-center">
                                                      <span
                                                        className={`
                                                          inline-flex
                                                          min-w-8
                                                          justify-center
                                                          rounded-full
                                                          border
                                                          px-2.5
                                                          py-1
                                                          font-bold
                                                          ${getResultStyle(
                                                            result
                                                          )}
                                                        `}
                                                      >
                                                        {result}
                                                      </span>
                                                    </td>
                                                  </tr>
                                                );
                                              }
                                            )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <CalendarDays className="h-8 w-8 text-muted-foreground/40 mb-2" />

                                    <p className="font-medium text-sm">
                                      No games recorded yet.
                                    </p>

                                    <p className="text-xs text-muted-foreground mt-1">
                                      Match results will appear here once
                                      games are recorded.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StandingsTable;
