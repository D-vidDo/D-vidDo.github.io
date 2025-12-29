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
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
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
        ? ref.current.scrollHeight + "px"
        : "0px";
    }
  }, [expanded]);

  return (
    <div
      ref={ref}
      style={{
        overflow: "hidden",
        transition: "max-height 0.4s ease",
        maxHeight: expanded ? "500px" : "0px",
      }}
    >
      {children}
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const StandingsTable = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // 👇 Season state
  const [seasonId, setSeasonId] = useState<number>(2);
  const [seasonName, setSeasonName] = useState<string>("Season");
  const [seasons, setSeasons] = useState<Season[]>([]);

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

      // Ensure default season exists in options
      const defaultSeason = data.find((s) => s.season_id === 2);
      setSeasonId(defaultSeason ? defaultSeason.season_id : data[0].season_id);
    }

    fetchSeasons();
  }, []);

  /* ================= FETCH STANDINGS DATA ================= */

  useEffect(() => {
    async function fetchData() {
      // Season name
      const { data: season } = await supabase
        .from("seasons")
        .select("name")
        .eq("season_id", seasonId)
        .single();

      if (season?.name) setSeasonName(season.name);

      // Teams
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("season_id", seasonId);

      // Games
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

      if (!teamData || !gameData) return;

      const teamMap: Record<string, Team> = {};

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

          if (set.points_for === set.points_against) ties++;
          else if (set.points_for > set.points_against) wins++;
          else losses++;
        });

        team.points_for += pf;
        team.points_against += pa;

        if (wins > losses) team.wins++;
        else if (losses > wins) team.losses++;
        else team.ties++;

        const dateTime = new Date(`${game.date}T${game.time ?? "00:00:00"}`);

        team.games.push({
          id: game.id,
          date: game.date,
          time: game.time,
          dateTime,
          opponent: game.opponent,
          sets: [...game.sets].sort((a, b) => a.set_no - b.set_no),
        });
      });

      Object.values(teamMap).forEach((team) => {
        team.games.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
      });

      setTeams(Object.values(teamMap));
    }

    fetchData();
  }, [seasonId]);

  /* ================= SORT TEAMS ================= */

  const sortedTeams = teams
    .map((team) => ({
      ...team,
      winPercentage:
        team.wins + team.losses + team.ties > 0
          ? team.wins / (team.wins + team.losses + team.ties)
          : 0,
      pointDifferential: team.points_for - team.points_against,
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.pointDifferential !== a.pointDifferential)
        return b.pointDifferential - a.pointDifferential;
      return b.points_for - a.points_for;
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

  /* ================= RENDER ================= */

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          {seasonName} Standings
        </CardTitle>

        {/* Season Selector */}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Season:</span>
          {seasons.length > 0 && (
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(Number(e.target.value))}
              className="border border-border rounded px-3 py-1 bg-background text-sm shadow-sm"
            >
              {seasons.map((season) => (
                <option key={season.season_id} value={season.season_id}>
                  {season.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">T</TableHead>
              <TableHead className="text-center">Win %</TableHead>
              <TableHead className="text-center">PF</TableHead>
              <TableHead className="text-center">PA</TableHead>
              <TableHead className="text-center">Diff</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedTeams.map((team) => (
              <React.Fragment key={team.team_id}>
                <TableRow
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleRowClick(team.team_id)}
                >
                  <TableCell>
                    <Badge
                      variant={team.rank <= 3 ? "default" : "secondary"}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      {team.rank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold">{team.name}</span>
                      {expandedTeamId === team.team_id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-green-600 font-semibold">
                    {team.wins}
                  </TableCell>
                  <TableCell className="text-center text-red-500 font-semibold">
                    {team.losses}
                  </TableCell>
                  <TableCell className="text-center">{team.ties}</TableCell>
                  <TableCell className="text-center">
                    {(team.winPercentage * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    {team.points_for}
                  </TableCell>
                  <TableCell className="text-center">
                    {team.points_against}
                  </TableCell>
                  <TableCell
                    className={`text-center font-semibold ${
                      team.pointDifferential > 0
                        ? "text-green-600"
                        : team.pointDifferential < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {team.pointDifferential > 0 ? "+" : ""}
                    {team.pointDifferential}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StandingsTable;
