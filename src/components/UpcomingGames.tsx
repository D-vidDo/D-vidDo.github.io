import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

type Game = {
  id: number;
  date: string;
  time: string;
  court: number;
  opponent: string;
  teams: {
    name: string;
    color?: string;
  };
};

const UpcomingGameCard = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const { data, error } = await supabase
        .from("games")
        .select(`
          id,
          date,
          time,
          court,
          opponent,
          teams:team_id (
            name,
            color
          )
        `)
        //.gte("date", today)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching games:", error.message);
      } else {
        setGames(data ?? []);
      }
      setLoading(false);
    }

    fetchGames();
  }, []);

  if (loading) return <div>Loading upcoming games...</div>;

  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.length === 0 ? (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <h3 className="text-lg font-bold text-card-foreground">Upcoming Games</h3>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No upcoming games scheduled.</p>
          </CardContent>
        </Card>
      ) : (
        games.map((game) => (
          <Card
            key={game.id}
            className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Team Initials or Color Box */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                    style={{ backgroundColor: game.teams?.color ?? "#666" }}
                  >
                    {game.teams?.name?.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
                      {game.teams?.name ?? "Unknown Team"}
                    </h3>
                    <p className="text-sm text-muted-foreground">vs {game.opponent}</p>
                  </div>
                </div>

                <Badge variant="secondary" className="font-semibold">
                  {new Date(game.date).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-accent">{game.time}</div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-primary">Court {game.court}</div>
                  <div className="text-xs text-muted-foreground">Court</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </section>
  );
};

export default UpcomingGameCard;
