import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeftRight, FileText } from "lucide-react";
import { getTeamColorByName } from "@/data/mockData";
import { supabase } from "@/lib/supabase"; // Adjust this path to your Supabase client

interface Player {
  id: string;
  name: string;
  primary_position: string;
}

interface PlayerTrade {
  player_id: string;
  from_team: string;
  to_team: string;
  player: Player;
}

interface Trade {
  id: string;
  date: string;
  description: string;
  playersTraded: PlayerTrade[];
}

const Trades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrades() {
      setLoading(true);

      // Fetch trades with their related playersTraded and player details via RPC or join
      // Assuming your Supabase setup supports foreign table relationships and you have 'players_traded' and 'players' linked
      
      const { data, error } = await supabase
        .from("trades")
        .select(`
          id,
          date,
          description,
          players_traded:players_traded (
            player_id,
            from_team,
            to_team,
            player:players (
              id,
              name,
              primary_position
            )
          )
        `)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching trades:", error);
        setTrades([]);
      } else if (data) {
        // Map data to expected structure: convert snake_case keys to camelCase
        const formattedTrades = data.map((trade: any) => ({
          id: trade.id,
          date: trade.date,
          description: trade.description,
          playersTraded: trade.players_traded.map((pt: any) => ({
            player_id: pt.player_id,
            fromTeam: pt.from_team,
            toTeam: pt.to_team,
            player: {
              id: pt.player.id,
              name: pt.player.name,
              primary_position: pt.player.primary_position,
            },
          })),
        }));
        setTrades(formattedTrades);
      }

      setLoading(false);
    }

    fetchTrades();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Draft History
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-6">
            Complete record of all player movements and trades
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <FileText className="mr-2 h-4 w-4" />
            {trades.length} Redrafts
          </Badge>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">Loading trades...</div>
        ) : trades.length > 0 ? (
          <div className="space-y-6">
            {trades.map((trade) => (
              <Card key={trade.id} className="bg-gradient-card shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-primary" />
                      Trade Record
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(trade.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trade Details */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-card-foreground font-medium">{trade.description}</p>
                  </div>

                  {/* Players Traded */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Players Involved
                    </h4>
                    {trade.playersTraded.map((playerTrade, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gradient-stats rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="font-semibold text-card-foreground">
                              {playerTrade.player.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {playerTrade.player.primary_position}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span
                            style={{
                              color: getTeamColorByName(playerTrade.from_team),
                              fontWeight: "bold",
                            }}
                          >
                            {playerTrade.from_team}
                          </span>
                          <span className="mx-1">→</span>
                          <span
                            style={{
                              color: getTeamColorByName(playerTrade.to_team),
                              fontWeight: "bold",
                            }}
                          >
                            {playerTrade.to_team}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ArrowLeftRight className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No trades yet</h3>
            <p className="text-muted-foreground">
              Trade history will appear here when players are moved between teams
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trades;




// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, ArrowLeftRight, FileText } from "lucide-react";
// import { useLeague } from "@/context/LeagueContext";
// import { getTeamColorByName } from "@/data/mockData";

// const Trades = () => {
//   const { trades } = useLeague();

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header Section */}
//       <section className="bg-gradient-hero py-16 px-4">
//         <div className="max-w-6xl mx-auto text-center">
//           <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
//             Draft History
//           </h1>
//           <p className="text-lg text-primary-foreground/90 mb-6">
//             Complete record of all player movements and trades
//           </p>
//           <Badge variant="secondary" className="text-lg px-4 py-2">
//             <FileText className="mr-2 h-4 w-4" />
//             {trades.length} Redrafts
//           </Badge>
//         </div>
//       </section>

//       <div className="max-w-4xl mx-auto px-4 py-12">
//         {trades.length > 0 ? (
//           <div className="space-y-6">
//             {trades.map((trade) => (
//               <Card key={trade.id} className="bg-gradient-card shadow-card">
//                 <CardHeader>
//                   <div className="flex items-start justify-between">
//                     <CardTitle className="text-lg flex items-center gap-2">
//                       <ArrowLeftRight className="h-5 w-5 text-primary" />
//                       Trade Record
//                     </CardTitle>
//                     <Badge variant="outline" className="flex items-center gap-1">
//                       <Calendar className="h-3 w-3" />
//                       {new Date(trade.date).toLocaleDateString()}
//                     </Badge>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   {/* Trade Details */}
//                   <div className="p-4 bg-muted/30 rounded-lg">
//                     <p className="text-card-foreground font-medium">{trade.description}</p>
//                   </div>

//                   {/* Players Traded */}
//                   <div className="space-y-3">
//                     <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
//                       Players Involved
//                     </h4>
//                     {trade.playersTraded.map((playerTrade, index) => (
//                       <div key={index} className="flex items-center justify-between p-3 bg-gradient-stats rounded-lg">
//                         <div className="flex items-center gap-3">
//                           <div className="text-center">
//                             <div className="font-semibold text-card-foreground">
//                               {playerTrade.player.name}
//                             </div>
//                             <div className="text-sm text-muted-foreground">
//                               {playerTrade.player.position}
//                             </div>
//                           </div>
//                         </div>
                        
//                         <div className="flex items-center gap-2 text-sm">
//                           <span
//                             style={{
//                               color: getTeamColorByName(playerTrade.fromTeam),
//                               fontWeight: "bold"
//                             }}
//                           >
//                             {playerTrade.fromTeam}
//                           </span>
//                           <span className="mx-1">→</span>
//                           <span
//                             style={{
//                               color: getTeamColorByName(playerTrade.toTeam),
//                               fontWeight: "bold"
//                             }}
//                           >
//                             {playerTrade.toTeam}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-12">
//             <ArrowLeftRight className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-foreground mb-2">No trades yet</h3>
//             <p className="text-muted-foreground">Trade history will appear here when players are moved between teams</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Trades;