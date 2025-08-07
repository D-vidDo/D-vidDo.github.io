import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp, Users } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";

// ... interfaces stay the same ...

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamData() {
      setLoading(true);
      setError(null);

      // Fetch team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", teamId)
        .single();

      if (teamError || !teamData) {
        setError("Team not found");
        setLoading(false);
        return;
      }
      setTeam(teamData);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .in("id", teamData.player_ids);

      if (playersError) {
        setError("Failed to load players");
        setLoading(false);
        return;
      }
      setPlayers(playersData ?? []);

      // --- Fetch games from the team's games array ---
      // teamData.games is presumably an array of game objects already, so:
      setGames(teamData.games ?? []);

      // Fetch all trades and filter in JS
      const { data: tradesData, error: tradesError } = await supabase
        .from("trades")
        .select("id, date, description, players_traded")
        .order("date", { ascending: false });

      if (tradesError) {
        setError("Failed to load trades");
        setLoading(false);
        return;
      }

      const filteredTrades = (tradesData ?? []).filter((trade) =>
        trade.players_traded?.some(
          (pt: TradePlayer) =>
            pt.toTeam === teamData.name || pt.fromTeam === teamData.name
        )
      );

      const normalizedTrades: Trade[] = filteredTrades.map((trade) => ({
        id: trade.id,
        date: trade.date,
        description: trade.description,
        playersTraded: trade.players_traded,
      }));

      setTrades(normalizedTrades);
      setLoading(false);
    }

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading team details...
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Team not found"}</h1>
          <Link to="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

  const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);
  const pointDifferential = team.points_for - team.points_against;
  const teamPlusMinus = players.reduce((sum, p) => sum + p.plusMinus, 0);
  const teamGames = players.reduce((sum, p) => sum + p.gamesPlayed, 0);
  const teamAverage = teamGames > 0 ? teamPlusMinus / teamGames : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* ... your existing header code unchanged ... */}

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Stats Grid */}
        {/* ... your existing stats grid ... */}

        {/* Player Cards */}
        {/* ... your existing player cards ... */}

        {/* --- New: Match History --- */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Match History ({games.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">
                No games played yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr>
                    <th className="border border-slate-300 px-2 py-1">Date</th>
                    <th className="border border-slate-300 px-2 py-1">Opponent</th>
                    <th className="border border-slate-300 px-2 py-1">Points For</th>
                    <th className="border border-slate-300 px-2 py-1">Points Against</th>
                    <th className="border border-slate-300 px-2 py-1">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="even:bg-slate-100">
                      <td className="border border-slate-300 px-2 py-1">{game.date}</td>
                      <td className="border border-slate-300 px-2 py-1">{game.opponent}</td>
                      <td className="border border-slate-300 px-2 py-1">{game.pointsFor}</td>
                      <td className="border border-slate-300 px-2 py-1">{game.pointsAgainst}</td>
                      <td
                        className={`border border-slate-300 px-2 py-1 font-bold ${
                          game.result === "W" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {game.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Roster History */}
        {/* ... your existing roster history card ... */}
      </div>
    </div>
  );
};

// ... StatCard component unchanged ...

export default TeamDetail;


// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
// import React, { useState, useRef, useEffect } from "react";

// interface Team {
//   id: string;
//   name: string;
//   wins: number;
//   losses: number;
//   pointsFor: number;
//   pointsAgainst: number;
//   color: string;
// }

// interface StandingsTableProps {
//   teams: Team[];
// }

// const StandingsTable = ({ teams }: StandingsTableProps) => {
//   const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

//   const handleRowClick = (teamId: string) => {
//     setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
//   };

//   const sortedTeams = teams
//     .map((team, index) => ({
//       ...team,
//       winPercentage: team.wins / (team.wins + team.losses),
//       pointDifferential: team.pointsFor - team.pointsAgainst,
//       rank: index + 1,
//     }))
//     .sort((a, b) => {
//       if (b.winPercentage !== a.winPercentage) {
//         return b.winPercentage - a.winPercentage;
//       }
//       return b.pointDifferential - a.pointDifferential;
//     })
//     .map((team, index) => ({ ...team, rank: index + 1 }));

//   const AccordionRow = ({ expanded, children }: { expanded: boolean; children: React.ReactNode }) => {
//     const ref = useRef<HTMLTableRowElement>(null);

//     useEffect(() => {
//       if (ref.current) {
//         if (expanded) {
//           ref.current.style.maxHeight = ref.current.scrollHeight + "px";
//           ref.current.style.opacity = "1";
//         } else {
//           ref.current.style.maxHeight = "0px";
//           ref.current.style.opacity = "0";
//         }
//       }
//     }, [expanded]);

//     return (
//       <tr
//         ref={ref}
//         style={{
//           transition: "max-height 0.4s cubic-bezier(.4,0,.2,1), opacity 0.3s",
//           overflow: "hidden",
//           maxHeight: expanded ? "500px" : "0px",
//           opacity: expanded ? 1 : 0,
//           display: "table-row",
//         }}
//       >
//         {children}
//       </tr>
//     );
//   };

//   return (
//     <Card className="bg-gradient-card shadow-card">
//       <CardHeader>
//         <CardTitle className="text-2xl font-bold flex items-center gap-2">
//           <TrendingUp className="h-6 w-6 text-primary" />
//           League Standings
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-12">Rank</TableHead>
//               <TableHead>Team</TableHead>
//               <TableHead className="text-center">W</TableHead>
//               <TableHead className="text-center">L</TableHead>
//               <TableHead className="text-center">Win %</TableHead>
//               <TableHead className="text-center">PF</TableHead>
//               <TableHead className="text-center">PA</TableHead>
//               <TableHead className="text-center">Diff</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {sortedTeams.map((team) => (
//               <React.Fragment key={team.id}>
//                 <TableRow
//                   key={team.id}
//                   className="hover:bg-muted/50 transition-colors cursor-pointer"
//                   onClick={() => handleRowClick(team.id)}
//                   style={{ backgroundColor: expandedTeamId === team.id ? "#f7fafc" : undefined }}
//                 >
//                   <TableCell className="font-medium">
//                     <Badge variant={team.rank <= 3 ? "default" : "secondary"} className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
//                       {team.rank}
//                     </Badge>
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center space-x-3">
//                       <div
//                         className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
//                         style={{ backgroundColor: team.color }}
//                       >
//                         {team.name.substring(0, 2).toUpperCase()}
//                       </div>
//                       <span className="font-semibold">{team.name}</span>
//                       <span className="ml-2">
//                         {expandedTeamId === team.id ? (
//                           <ChevronUp className="w-4 h-4 text-muted-foreground" />
//                         ) : (
//                           <ChevronDown className="w-4 h-4 text-muted-foreground" />
//                         )}
//                       </span>
//                     </div>
//                   </TableCell>
//                   <TableCell className="text-center font-semibold text-green-600">
//                     {team.wins}
//                   </TableCell>
//                   <TableCell className="text-center font-semibold text-red-500">
//                     {team.losses}
//                   </TableCell>
//                   <TableCell className="text-center font-semibold">
//                     {(team.winPercentage * 100).toFixed(1)}%
//                   </TableCell>
//                   <TableCell className="text-center">{team.pointsFor}</TableCell>
//                   <TableCell className="text-center">{team.pointsAgainst}</TableCell>
//                   <TableCell className={`text-center font-semibold ${
//                     team.pointDifferential > 0 ? 'text-green-600' : 'text-red-500'
//                   }`}>
//                     {team.pointDifferential > 0 ? '+' : ''}{team.pointDifferential}
//                   </TableCell>
//                 </TableRow>
//                 {expandedTeamId === team.id && (
//                   <AccordionRow expanded={expandedTeamId === team.id}>
//                     <TableCell colSpan={8} className="bg-background border-t">
//                       <div className="p-4">
//                         <div className="font-semibold mb-4 text-lg flex items-center gap-2">
//                           <TrendingUp className="h-4 w-4 text-primary" />
//                           Match History
//                         </div>
//                         {team.games && team.games.length > 0 ? (
//                           <div className="overflow-x-auto">
//                             <table className="min-w-full text-xs rounded-lg overflow-hidden shadow">
//                               <thead>
//                                 <tr className="bg-primary text-primary-foreground">
//                                   <th className="py-2 px-3 text-left rounded-tl-lg">Date</th>
//                                   <th className="py-2 px-3 text-left">Opponent</th>
//                                   <th className="py-2 px-3 text-center">PF</th>
//                                   <th className="py-2 px-3 text-center">PA</th>
//                                   <th className="py-2 px-3 text-center rounded-tr-lg">Result</th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {team.games.map((game, idx) => (
//                                   <tr
//                                     key={game.id}
//                                     className={
//                                       idx % 2 === 0
//                                         ? "bg-muted/30"
//                                         : "bg-background"
//                                     }
//                                   >
//                                     <td className="py-2 px-3">{game.date}</td>
//                                     <td className="py-2 px-3 font-semibold">{game.opponent}</td>
//                                     <td className="py-2 px-3 text-center font-bold text-green-700">{game.pointsFor}</td>
//                                     <td className="py-2 px-3 text-center font-bold text-red-600">{game.pointsAgainst}</td>
//                                     <td className="py-2 px-3 text-center">
//                                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${game.result === "W" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//                                         {game.result}
//                                       </span>
//                                     </td>
//                                   </tr>
//                                 ))}
//                               </tbody>
//                             </table>
//                           </div>
//                         ) : (
//                           <div className="text-muted-foreground">No games recorded yet.</div>
//                         )}
//                       </div>
//                     </TableCell>
//                   </AccordionRow>
//                 )}
//               </React.Fragment>
//             ))}
//           </TableBody>
//         </Table>
//       </CardContent>
//     </Card>
//   );
// };

// export default StandingsTable;