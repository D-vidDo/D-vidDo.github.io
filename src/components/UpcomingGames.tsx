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
      const today = new Date().toISOString().split("T")[0];
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
    <Card className="bg-gradient-card shadow-card">
      <CardHeader className="flex items-center space-x-3">
        <Calendar className="text-primary" />
        <h2 className="text-xl font-bold text-card-foreground">Upcoming Games</h2>
      </CardHeader>

<CardContent className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
  {games.length === 0 ? (
    <p className="text-muted-foreground">No upcoming games scheduled.</p>
  ) : (
    <ul className="space-y-3">
      {games.map((game) => (
        <li
          key={game.id}
          className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
        >
          {/* Team Info */}
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-sm shadow"
              style={{ backgroundColor: game.teams?.color ?? "#666" }}
            >
              {game.teams?.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-card-foreground">
                {game.teams?.name ?? "Unknown Team"}
              </div>
              <div className="text-sm text-muted-foreground">vs {game.opponent}</div>
            </div>
          </div>

          {/* Game Info */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div>
              {new Date(`1970-01-01T${game.time}Z`).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
            <div>Court {game.court}</div>
            <Badge variant="secondary">
              {new Date(game.date).toLocaleDateString()}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  )}
</CardContent>

    </Card>
  );
};

export default UpcomingGameCard;
