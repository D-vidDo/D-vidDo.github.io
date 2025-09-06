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

interface Set {
  set_no: number;
  points_for: number;
  points_against: number;
}

interface Game {
  id: string;
  date: string;
  opponent: string;
  sets: Set[];
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
      ref.current.style.maxHeight = expanded ? ref.current.scrollHeight + "px" : "0px";
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

const StandingsTable = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const handleRowClick = (teamId: string) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  useEffect(() => {
    async function fetchData() {
      const { data: teamData } = await supabase.from("teams").select("*");
      const { data: gameData } = await supabase
        .from("games")
        .select("id, date, opponent, team_id, sets (set_no, points_for, points_against)");

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
        if (!team || !game.sets || game.sets.length === 0) return; // skip unplayed games
        let gameWins = 0;
        let gameLosses = 0;
        let gameTies = 0;
        let pf = 0;
        let pa = 0;

        game.sets.forEach((set) => {
          pf += set.points_for;
          pa += set.points_against;

          if (set.points_for === set.points_against) gameTies++;
          else if (set.points_for > set.points_against) gameWins++;
          else gameLosses++;
        });

        team.points_for += pf;
        team.points_against += pa;
        if (gameWins > gameLosses) team.wins++;
        else if (gameLosses > gameWins) team.losses++;
        else team.ties++;

        team.games.push({
          id: game.id,
          date: game.date,
          opponent: game.opponent,
          sets: game.sets,
        });
      });

      setTeams(Object.values(teamMap));
    }

    fetchData();
  }, []);

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

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          League Standings
        </CardTitle>
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
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(team.team_id)}
                  style={{
                    backgroundColor: expandedTeamId === team.team_id ? "#f7fafc" : undefined,
                  }}
                >
                  <TableCell className="font-medium">
                    <Badge
                      variant={team.rank <= 3 ? "default" : "secondary"}
                      className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                    >
                      {team.rank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold">{team.name}</span>
                      <span className="ml-2">
                        {expandedTeamId === team.team_id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-green-600">
                    {team.wins}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-red-500">
                    {team.losses}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-muted-foreground">
                    {team.ties}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {(team.winPercentage * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">{team.points_for}</TableCell>
                  <TableCell className="text-center">{team.points_against}</TableCell>
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
                <TableRow>
                  <TableCell colSpan={9} className="bg-background border-t p-0">
                    <AccordionContent expanded={expandedTeamId === team.team_id}>
                      <div className="p-4">
                        <div className="font-semibold mb-4 text-lg flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Match History (Set-by-Set)
                        </div>
                        {team.games.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs rounded-lg overflow-hidden shadow">
                              <thead>
                                <tr className="bg-primary text-primary-foreground">
                                  <th className="py-2 px-3 text-left">Date</th>
                                  <th className="py-2 px-3 text-left">Opponent</th>
                                  <th className="py-2 px-3 text-center">Set</th>
                                  <th className="py-2 px-3 text-center">PF</th>
                                  <th className="py-2 px-3 text-center">PA</th>
                                </tr>
                              </thead>
                              <tbody>
                                {team.games.map((game) =>
                                  game.sets.map((set, idx) => (
                                    <tr
                                      key={`${game.id}-set-${set.set_no}`}
                                      className={idx % 2 === 0 ? "bg-muted/30" : "bg-background"}
                                    >
                                      <td className="py-2 px-3">{game.date}</td>
                                      <td className="py-2 px-3 font-semibold">{game.opponent}</td>
                                      <td className="py-2 px-3 text-center">{set.set_no}</td>
                                      <td className="py-2 px-3 text-center text-green-700 font-bold">
                                        {set.points_for}
                                      </td>
                                      <td className="py-2 px-3 text-center text-red-600 font-bold">
                                        {set.points_against}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No games recorded yet.</div>
                        )}
                      </div>
                    </AccordionContent>
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
