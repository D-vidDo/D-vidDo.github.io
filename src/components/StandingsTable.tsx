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
import { TrendingUp, TrendingDown } from "lucide-react";

interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  color: string;
}

interface StandingsTableProps {
  teams: Team[];
}

const StandingsTable = ({ teams }: StandingsTableProps) => {
  const sortedTeams = teams
    .map((team, index) => ({
      ...team,
      winPercentage: team.wins / (team.wins + team.losses),
      pointDifferential: team.pointsFor - team.pointsAgainst,
      rank: index + 1,
    }))
    .sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.pointDifferential - a.pointDifferential;
    })
    .map((team, index) => ({ ...team, rank: index + 1 }));

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
              <TableRow key={team.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <Badge variant={team.rank <= 3 ? "default" : "secondary"} className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
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
                <TableCell className="text-center">{team.pointsFor}</TableCell>
                <TableCell className="text-center">{team.pointsAgainst}</TableCell>
                <TableCell className={`text-center font-semibold ${
                  team.pointDifferential > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {team.pointDifferential > 0 ? '+' : ''}{team.pointDifferential}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StandingsTable;