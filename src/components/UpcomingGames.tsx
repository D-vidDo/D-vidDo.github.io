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
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)

    // Get start (Sunday) and end (Saturday) of the current week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);

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
      .gte("date", startOfWeek.toISOString().split("T")[0])
      .lte("date", endOfWeek.toISOString().split("T")[0])
      .order("date", { ascending: true })
      .order("time", { ascending: true });

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

  
function formatGameTime(time24) {
  // time24 like "20:10:00" or "20:10"
  const [hh, mm] = time24.split(':').map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}


  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader className="flex items-center justify-between">
  <div className="flex items-center space-x-3">
    <Calendar className="text-primary" />
    <h2 className="text-xl font-bold text-card-foreground">Upcoming Games</h2>
  </div>
  <div className="warmup-note">Warm‑up starts 10 minutes before the first game</div>
  {games.length > 0 && (
    <Badge variant="secondary">
              {new Date(games[0].date).toLocaleDateString("en-CA", {
                timeZone: "UTC",
              month: "short",
              day: "numeric",
              year: "numeric"
              }
              )}
            </Badge>
  )}
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
<div className="flex items-center space-x-3">
  {/* Time Badge - team color */}
  <div
    className="px-2 py-1 rounded text-xs font-medium text-white text-center w-20"
    style={{ backgroundColor: game.teams?.color ?? "#666" }}
  >
    {formatGameTime(game.time)}
  </div>

  {/* Court Badge - neutral, lighter style */}
  <div
    className="px-2 py-1 rounded text-xs font-medium text-card-foreground text-center w-20"
    style={{ backgroundColor: "#e2e8f0" }} // Tailwind's slate-200 equivalent
  >
    Court {game.court}
  </div>
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
