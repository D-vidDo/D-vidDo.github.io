import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp, Users } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  plusMinus: number;
  gamesPlayed: number;
}

interface Game {
  id: string;
  date: string;
  opponent: string;
  pointsFor: number;
  pointsAgainst: number;
  result: "W" | "L";
}

interface TradePlayer {
  player: { name: string };
  fromTeam: string;
  toTeam: string;
}

interface Trade {
  id: string;
  date: string;
  description: string;
  playersTraded: TradePlayer[];
}

interface Team {
  team_id: string;
  name: string;
  wins: number;
  losses: number;
  captain: string;
  color: string;
  points_for: number;
  points_against: number;
}

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

// Use the games array from the team directly
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



// Reusable Stat Card
const StatCard = ({
  title,
  icon,
  value,
  isPlusMinus = false,
}: {
  title: string;
  icon: JSX.Element;
  value: number | string;
  isPlusMinus?: boolean;
}) => {
  const numeric = typeof value === "number" ? value : parseFloat(value);
  const color =
    numeric > 0
      ? "text-green-600"
      : numeric < 0
      ? "text-red-500"
      : "text-muted-foreground";
  return (
    <Card className="bg-gradient-stats shadow-card">
      <CardContent className="p-6 text-center">
        <div className="h-8 w-8 mx-auto mb-2 text-primary">{icon}</div>
        <div className={`text-2xl font-bold text-card-foreground ${isPlusMinus ? color : ""}`}>
          {isPlusMinus && numeric > 0 ? "+" : ""}
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
};

export default TeamDetail;




// import { useParams, Link } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { ArrowLeft, Trophy, TrendingUp, Users, Edit } from "lucide-react";
// import PlayerCard from "@/components/PlayerCard";
// import { mockTeams, getPlayersByTeam, mockTrades } from "@/data/mockData";

// const TeamDetail = () => {
//   const { teamId } = useParams();
//   const team = mockTeams.find(t => t.id === teamId);

//   if (!team) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold mb-4">Team not found</h1>
//           <Link to="/teams">
//             <Button>Back to Teams</Button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const players = getPlayersByTeam(team.id);
//   const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);
//   const pointDifferential = team.pointsFor - team.pointsAgainst;
  
//   // Team stats
//   const teamPlusMinus = players.reduce((sum, player) => sum + player.plusMinus, 0);
//   const teamGames = players.reduce((sum, player) => sum + player.gamesPlayed, 0);
//   const teamAverage = teamGames > 0 ? (teamPlusMinus / teamGames) : 0;

//   const teamTrades = mockTrades.filter(trade =>
//     trade.playersTraded.some(pt => pt.toTeam === team.name)
//   );

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header Section */}
//       <section className="bg-gradient-hero py-16 px-4">
//         <div className="max-w-6xl mx-auto">
//           <Link to="/teams" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Teams
//           </Link>
          
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-6">
//               <div 
//                 className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-primary"
//                 style={{ backgroundColor: team.color }}
//               >
//                 {team.name.substring(0, 2).toUpperCase()}
//               </div>
//               <div>
//                 <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
//                   {team.name}
//                 </h1>
//                 <p className="text-lg text-primary-foreground/90 mb-4">
//                   Captain: {team.captain}
//                 </p>
//                 <div className="flex flex-wrap gap-3">
//                   <Badge variant="secondary" className="text-lg px-4 py-2">
//                     {team.wins}W - {team.losses}L
//                   </Badge>
//                   <Badge variant="outline" className="text-lg px-4 py-2 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground">
//                     {winPercentage}% Win Rate
//                   </Badge>
//                 </div>
//               </div>
//             </div>
            
//             {/* <Button variant="secondary" size="lg" className="hidden md:flex">
//               <Edit className="h-4 w-4 mr-2" />
//               Edit Roster
//             </Button> */}
//           </div>
//         </div>
//       </section>

//       <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
//         {/* Edit Roster Button for Mobile */}
//         {/* <div className="md:hidden">
//           <Button variant="secondary" className="w-full">
//             <Edit className="h-4 w-4 mr-2" />
//             Edit Roster
//           </Button>
//         </div> */}

//         {/* Team Statistics */}
//         <div className="grid md:grid-cols-4 gap-6">
//           <Card className="bg-gradient-stats shadow-card">
//             <CardContent className="p-6 text-center">
//               <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
//               <div className="text-2xl font-bold text-card-foreground">{team.pointsFor}</div>
//               <div className="text-sm text-muted-foreground">Points For</div>
//             </CardContent>
//           </Card>
          
//           <Card className="bg-gradient-stats shadow-card">
//             <CardContent className="p-6 text-center">
//               <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
//               <div className={`text-2xl font-bold ${teamPlusMinus > 0 ? 'text-green-600' : teamPlusMinus < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
//                 {teamPlusMinus > 0 ? '+' : ''}{teamPlusMinus}
//               </div>
//               <div className="text-sm text-muted-foreground">Team +/-</div>
//             </CardContent>
//           </Card>
          
//           <Card className="bg-gradient-stats shadow-card">
//             <CardContent className="p-6 text-center">
//               <Users className="h-8 w-8 text-accent mx-auto mb-2" />
//               <div className="text-2xl font-bold text-card-foreground">{teamGames}</div>
//               <div className="text-sm text-muted-foreground">Total Games</div>
//             </CardContent>
//           </Card>
          
//           <Card className="bg-gradient-stats shadow-card">
//             <CardContent className="p-6 text-center">
//               <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
//               <div className={`text-2xl font-bold ${teamAverage > 0 ? 'text-green-600' : teamAverage < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
//                 {teamAverage > 0 ? '+' : ''}{teamAverage.toFixed(1)}
//               </div>
//               <div className="text-sm text-muted-foreground">Team Average</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Performance Overview */}
//         <Card className="bg-gradient-card shadow-card">
//           <CardHeader>
//             <CardTitle className="text-xl">Season Performance</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid md:grid-cols-3 gap-6">
//               <div className="text-center p-4 bg-muted/30 rounded-lg">
//                 <div className="text-3xl font-bold text-green-600 mb-1">{team.wins}</div>
//                 <div className="text-sm text-muted-foreground">Wins</div>
//               </div>
//               <div className="text-center p-4 bg-muted/30 rounded-lg">
//                 <div className="text-3xl font-bold text-red-500 mb-1">{team.losses}</div>
//                 <div className="text-sm text-muted-foreground">Losses</div>
//               </div>
//               <div className="text-center p-4 bg-muted/30 rounded-lg">
//                 <div className={`text-3xl font-bold mb-1 ${pointDifferential > 0 ? 'text-green-600' : 'text-red-500'}`}>
//                   {pointDifferential > 0 ? '+' : ''}{pointDifferential}
//                 </div>
//                 <div className="text-sm text-muted-foreground">Point Differential</div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         {/* Match History Section */}
//         <Card className="bg-gradient-card shadow-card">
//           <CardHeader>
//             <CardTitle className="text-xl font-bold flex items-center gap-2">
//               <TrendingUp className="h-5 w-5 text-primary" />
//               Match History
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             {team.games && team.games.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full text-xs rounded-lg overflow-hidden shadow">
//                   <thead>
//                     <tr className="bg-primary text-primary-foreground">
//                       <th className="py-2 px-3 text-left rounded-tl-lg">Date</th>
//                       <th className="py-2 px-3 text-left">Opponent</th>
//                       <th className="py-2 px-3 text-center">PF</th>
//                       <th className="py-2 px-3 text-center">PA</th>
//                       <th className="py-2 px-3 text-center rounded-tr-lg">Result</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {team.games.map((game, idx) => (
//                       <tr
//                         key={game.id}
//                         className={
//                           idx % 2 === 0
//                             ? "bg-muted/30"
//                             : "bg-background"
//                         }
//                       >
//                         <td className="py-2 px-3">{game.date}</td>
//                         <td className="py-2 px-3 font-semibold">{game.opponent}</td>
//                         <td className="py-2 px-3 text-center font-bold text-green-700">{game.pointsFor}</td>
//                         <td className="py-2 px-3 text-center font-bold text-red-600">{game.pointsAgainst}</td>
//                         <td className="py-2 px-3 text-center">
//                           <span className={`px-2 py-1 rounded-full text-xs font-bold ${game.result === "W" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//                             {game.result}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="text-muted-foreground">No games recorded yet.</div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Team Roster */}
//         <Card className="bg-gradient-card shadow-card">
//           <CardHeader>
//             <CardTitle className="text-xl flex items-center gap-2">
//               <Users className="h-5 w-5 text-primary" />
//               Team Roster ({players.length} players)
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {players.map((player) => (
//                 <PlayerCard 
//                   key={player.id} 
//                   player={{
//                     ...player,
//                     isCaptain: player.name === team.captain
//                   }} 
//                 />
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Roster History Section */}
//         <Card className="bg-gradient-card shadow-card">
//           <CardHeader>
//             <CardTitle className="text-xl flex items-center gap-2">
//               <Users className="h-5 w-5 text-primary" />
//               Roster History
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             {teamTrades.length === 0 ? (
//               <div className="text-muted-foreground text-center py-4">
//                 No roster changes or trades for this team yet.
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {teamTrades.map(trade => (
//                   <div key={trade.id} className="border-b pb-4">
//                     <div className="font-semibold text-primary mb-1">
//                       {trade.date} &mdash; {trade.description}
//                     </div>
//                     <ul className="ml-2">
//                       {trade.playersTraded
//                         .filter(pt => pt.toTeam === team.name)
//                         .map((pt, idx) => (
//                           <li key={idx} className="text-sm flex items-center gap-2 py-1">
//                             <span className="font-bold">{pt.player.name}</span>
//                             <span>
//                               {`acquired from ${pt.fromTeam}`}
//                             </span>
//                           </li>
//                         ))}
//                     </ul>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>


        
//       </div>
//     </div>
//   );
// };

// export default TeamDetail;