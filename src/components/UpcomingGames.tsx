import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const supabase = createClient(
  "https://bqqotvjpvaznkjfldcgm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW90dmpwdmF6bmtqZmxkY2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDE4NjEsImV4cCI6MjA3MDAxNzg2MX0.VPClABOucYEo-bVPg_brc6WvSx17zR4LADC2FEWdI5Q"
);

type Game = {
  id: string;
  date: string;
  time: string;
  court: number;
  opponent: string;
  teams: {
    name: string;
  };
};

const UpcomingGames = () => {
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
            name
          )
        `)
        .gte("date", today)
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
    <section>
      <Card className="bg-gradient-card shadow-card">
        <CardHeader className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          <CardTitle className="text-2xl font-bold">Upcoming Games</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p className="text-muted-foreground">No upcoming games scheduled.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-muted">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Court</th>
                    <th className="py-2 px-3">Matchup</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-t border-muted hover:bg-muted/30 transition">
                      <td className="py-2 px-3">{new Date(game.date).toLocaleDateString()}</td>
                      <td className="py-2 px-3">{game.time}</td>
                      <td className="py-2 px-3">Court {game.court}</td>
                      <td className="py-2 px-3 font-medium">
                        {game.teams?.name ?? "Unknown"} vs {game.opponent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default UpcomingGames;
