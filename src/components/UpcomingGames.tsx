import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  "https://bqqotvjpvaznkjfldcgm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

type Game = {
  id: string;
  date: string;
  time: string;
  court: string;
  opponent: string;
};

const UpcomingGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from("games")
        .select("*")
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
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Upcoming Games</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p className="text-muted-foreground">No upcoming games scheduled.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-muted-foreground">
                  <th>Date</th>
                  <th>Time</th>
                  <th>Court</th>
                  <th>Opponent</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id} className="border-t border-muted">
                    <td>{new Date(game.date).toLocaleDateString()}</td>
                    <td>{game.time}</td>
                    <td>{game.court}</td>
                    <td>{game.opponent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default UpcomingGames;
