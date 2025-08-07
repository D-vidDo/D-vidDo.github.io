import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Users } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import { supabase } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  wins: number;
  losses: number;
  captain: string;
  color: string;
  playerIds?: string[];
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("winPercentage");
  const [loading, setLoading] = useState(true);

  // Fetch teams from Supabase
  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, wins, losses, captain, color, playerIds");

      if (error) {
        console.error("Error fetching teams:", error);
      } else {
        setTeams(data || []);
      }
      setLoading(false);
    }
    fetchTeams();
  }, []);

  // Total players count
  const totalPlayers = teams.reduce(
    (sum, team) => sum + (Array.isArray(team.playerIds) ? team.playerIds.length : 0),
    0
  );

  // Filter and sort teams locally
  const filteredAndSortedTeams = teams
    .filter(
      (team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.captain.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "winPercentage": {
          const winPercentageA = a.wins / (a.wins + a.losses);
          const winPercentageB = b.wins / (b.wins + b.losses);
          return winPercentageB - winPercentageA;
        }
        case "name":
          return a.name.localeCompare(b.name);
        case "wins":
          return b.wins - a.wins;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            League Teams
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-6">
            Explore all teams competing in our volleyball league
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="mr-2 h-4 w-4" />
            {teams.length} Teams • {totalPlayers} Players
          </Badge>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search teams or captains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={sortBy === "winPercentage" ? "default" : "outline"}
              onClick={() => setSortBy("winPercentage")}
              size="sm"
              disabled={loading}
            >
              <Filter className="mr-2 h-4 w-4" />
              Win %
            </Button>
            <Button
              variant={sortBy === "name" ? "default" : "outline"}
              onClick={() => setSortBy("name")}
              size="sm"
              disabled={loading}
            >
              Name
            </Button>
            <Button
              variant={sortBy === "wins" ? "default" : "outline"}
              onClick={() => setSortBy("wins")}
              size="sm"
              disabled={loading}
            >
              Wins
            </Button>
          </div>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
        ) : filteredAndSortedTeams.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No teams found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;



// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Search, Filter, Users } from "lucide-react";
// import TeamCard from "@/components/TeamCard";
// import { mockTeams } from "@/data/mockData";

// const Teams = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortBy, setSortBy] = useState("winPercentage");

//   const filteredAndSortedTeams = mockTeams
//     .filter(team => 
//       team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       team.captain.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//     .sort((a, b) => {
//       switch (sortBy) {
//         case "winPercentage":
//           const winPercentageA = a.wins / (a.wins + a.losses);
//           const winPercentageB = b.wins / (b.wins + b.losses);
//           return winPercentageB - winPercentageA;
//         case "name":
//           return a.name.localeCompare(b.name);
//         case "wins":
//           return b.wins - a.wins;
//         default:
//           return 0;
//       }
//     });

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header Section */}
//       <section className="bg-gradient-hero py-16 px-4">
//         <div className="max-w-6xl mx-auto text-center">
//           <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
//             League Teams
//           </h1>
//           <p className="text-lg text-primary-foreground/90 mb-6">
//             Explore all teams competing in our volleyball league
//           </p>
//           <Badge variant="secondary" className="text-lg px-4 py-2">
//             <Users className="mr-2 h-4 w-4" />
//             {mockTeams.length} Teams • {mockTeams.reduce((sum, team) => sum + team.playerIds.length, 0)} Players
//           </Badge>
//         </div>
//       </section>

//       <div className="max-w-7xl mx-auto px-4 py-12">
//         {/* Search and Filter Controls */}
//         <div className="flex flex-col md:flex-row gap-4 mb-8">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//             <Input
//               placeholder="Search teams or captains..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
          
//           <div className="flex gap-2">
//             <Button
//               variant={sortBy === "winPercentage" ? "default" : "outline"}
//               onClick={() => setSortBy("winPercentage")}
//               size="sm"
//             >
//               <Filter className="mr-2 h-4 w-4" />
//               Win %
//             </Button>
//             <Button
//               variant={sortBy === "name" ? "default" : "outline"}
//               onClick={() => setSortBy("name")}
//               size="sm"
//             >
//               Name
//             </Button>
//             <Button
//               variant={sortBy === "wins" ? "default" : "outline"}
//               onClick={() => setSortBy("wins")}
//               size="sm"
//             >
//               Wins
//             </Button>
//           </div>
//         </div>

//         {/* Teams Grid */}
//         {filteredAndSortedTeams.length > 0 ? (
//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredAndSortedTeams.map((team) => (
//               <TeamCard key={team.id} team={team} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-12">
//             <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-foreground mb-2">No teams found</h3>
//             <p className="text-muted-foreground">Try adjusting your search criteria</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Teams;