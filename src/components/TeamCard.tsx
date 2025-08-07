import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    captain: string;
    color: string;
    playerIds?: string[]; // Optional array of player IDs
  };
}

const TeamCard = ({ team }: TeamCardProps) => {
  const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);
  const [playerCount, setPlayerCount] = useState<number>(
    Array.isArray(team.playerIds) ? team.playerIds.length : 0
  );

  // Optional: fetch player count from Supabase if playerIds exists
  useEffect(() => {
    async function fetchPlayerCount() {
      if (team.playerIds && team.playerIds.length > 0) {
        // Assuming you have a 'players' table and want to confirm existing players
        const { data, error } = await supabase
          .from("players")
          .select("id")
          .in("id", team.playerIds);

        if (error) {
          console.error("Error fetching players:", error);
        } else {
          setPlayerCount(data?.length || 0);
        }
      } else {
        setPlayerCount(0);
      }
    }

    fetchPlayerCount();
  }, [team.playerIds]);

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: team.color }}
            >
              {team.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
                {team.name}
              </h3>
              <p className="text-sm text-muted-foreground">Captain: {team.captain}</p>
            </div>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {winPercentage}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{team.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-500">{team.losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{playerCount}</div>
            <div className="text-xs text-muted-foreground">Players</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              {playerCount} player{playerCount !== 1 ? "s" : ""}
            </div>
          </div>

          <Link to={`/teams/${team.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              View Team
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;





// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Users, Trophy, TrendingUp } from "lucide-react";
// import { Link } from "react-router-dom";



// interface TeamCardProps {
//   team: {
//     id: string;
//     name: string;
//     wins: number;
//     losses: number;
//     captain: string;
//     color: string;
//     playerIds: string[];
//   };
// }

// const TeamCard = ({ team }: TeamCardProps) => {
//   const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);

//   return (
//     <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 group">
//       <CardHeader className="pb-3">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div 
//               className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
//               style={{ backgroundColor: team.color }}
//             >
//               {team.name.substring(0, 2).toUpperCase()}
//             </div>
//             <div>
//               <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
//                 {team.name}
//               </h3>
//               <p className="text-sm text-muted-foreground">Captain: {team.captain}</p>
//             </div>
//           </div>
//           <Badge variant="secondary" className="font-semibold">
//             {winPercentage}%
//           </Badge>
//         </div>
//       </CardHeader>
      
//       <CardContent className="space-y-4">
//         <div className="grid grid-cols-3 gap-4 text-center">
//           <div className="space-y-1">
//             <div className="text-2xl font-bold text-green-600">{team.wins}</div>
//             <div className="text-xs text-muted-foreground">Wins</div>
//           </div>
//           <div className="space-y-1">
//             <div className="text-2xl font-bold text-red-500">{team.losses}</div>
//             <div className="text-xs text-muted-foreground">Losses</div>
//           </div>
//           <div className="space-y-1">
//             <div className="text-2xl font-bold text-primary">{team.playerIds.length}</div>
//             <div className="text-xs text-muted-foreground">Players</div>
//           </div>
//         </div>

//         <div className="flex justify-between items-center pt-2">
//           <div className="flex space-x-2">
//             <div className="flex items-center text-xs text-muted-foreground">
//               <Users className="h-3 w-3 mr-1" />
//               {team.playerIds.length} players
//             </div>
//           </div>
          
//           <Link to={`/teams/${team.id}`}>
//             <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
//               View Team
//             </Button>
//           </Link>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default TeamCard;