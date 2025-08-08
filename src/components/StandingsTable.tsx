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
import React, { useState, useRef, useEffect } from "react";

interface Game {
  id: string;
  date: string;
  opponent: string;
  points_for: number;
  points_against: number;
  result: "W" | "L";
}

interface Team {
  team_id: string;
  name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  color: string;
  games?: Game[];
}

interface StandingsTableProps {
  teams: Team[];
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

const StandingsTable = ({ teams }: StandingsTableProps) => {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const handleRowClick = (teamId: string) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  const sortedTeams = teams
    .map((team) => ({
      ...team,
      winPercentage:
        team.wins + team.losses > 0 ? team.wins / (team.wins + team.losses) : 0,
      pointDifferential: (team.points_for ?? 0) - (team.points_against ?? 0),
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.points_for !== a.points_for) return b.points_for - a.points_for;
      return b.winPercentage - a.winPercentage;
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
                  <TableCell colSpan={8} className="bg-background border-t p-0">
                    <AccordionContent expanded={expandedTeamId === team.team_id}>
                      <div className="p-4">
                        <div className="font-semibold mb-4 text-lg flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Match History
                        </div>
                        {team.games && team.games.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs rounded-lg overflow-hidden shadow">
                              <thead>
                                <tr className="bg-primary text-primary-foreground">
                                  <th className="py-2 px-3 text-left rounded-tl-lg">Date</th>
                                  <th className="py-2 px-3 text-left">Opponent</th>
                                  <th className="py-2 px-3 text-center">PF</th>
                                  <th className="py-2 px-3 text-center">PA</th>
                                  <th className="py-2 px-3 text-center rounded-tr-lg">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {team.games.map((game, idx) => (
                                  <tr
                                    key={game.id}
                                    className={idx % 2 === 0 ? "bg-muted/30" : "bg-background"}
                                  >
                                    <td className="py-2 px-3">{game.date}</td>
                                    <td className="py-2 px-3 font-semibold">{game.opponent}</td>
                                    <td className="py-2 px-3 text-center font-bold text-green-700">
                                      {game.points_for}
                                    </td>
                                    <td className="py-2 px-3 text-center font-bold text-red-600">
                                      {game.points_against}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                                          game.result === "W"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                      >
                                        {game.result}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
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
