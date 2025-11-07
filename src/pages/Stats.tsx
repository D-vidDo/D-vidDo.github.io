import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, Users, Scale } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  plus_minus: number;
  games_played: number;
  primary_position: string;
}

const Stats = () => {
  const [activeTab, setActiveTab] = useState<"plus_minus" | "average" | "adjusted">("plus_minus");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      const { data, error } = await supabase
        .from<Player>("players")
        .select("*");
      if (error) {
        console.error("Error loading players:", error);
      } else if (data) {
        setPlayers(data);
      }
      setLoading(false);
    }

    fetchPlayers();
  }, []);

  // Helper: league average per game
  const leagueAvgPerGame = players.reduce((sum, p) => sum + (p.plus_minus || 0), 0) /
    (players.reduce((sum, p) => sum + (p.games_played || 0), 0) || 1);

  const priorGames = 5; // weight for the Bayesian adjustment

  // Helper: adjusted per game (Bayesian shrinkage)
  const adjustedPerGame = (p: Player) => {
    const pm = p.plus_minus || 0;
    const gp = p.games_played || 0;
    return (pm + priorGames * leagueAvgPerGame) / (gp + priorGames);
  };

  // Top performers
  const topplus_minus = [...players]
    .sort((a, b) => b.plus_minus - a.plus_minus)
    .slice(0, 20);

  const topAverage = [...players]
    .filter(p => p.games_played > 0)
    .sort((a, b) => (b.plus_minus / b.games_played) - (a.plus_minus / a.games_played))
    .slice(0, 20);

  const topAdjusted = [...players]
    .filter(p => p.games_played > 0 || p.plus_minus !== 0)
    .sort((a, b) => adjustedPerGame(b) - adjustedPerGame(a))
    .slice(0, 20);

  const tabs = [
    { id: "plus_minus", label: "Top +/-", icon: TrendingUp, data: topplus_minus },
    { id: "average", label: "Best Avg/Game", icon: Trophy, data: topAverage },
    { id: "adjusted", label: "Adjusted Avg (Fair)", icon: Scale, data: topAdjusted },
  ];

  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const Icon = currentTab?.icon || TrendingUp;

  // League totals
  const totalplus_minus = players.reduce((sum, p) => sum + p.plus_minus, 0);
  const totalGames = players.reduce((sum, p) => sum + p.games_played, 0);
  const averagePerGame = totalGames > 0 ? totalplus_minus / totalGames : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading player statistics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Player Statistics
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-6">
            Individual performance metrics and league leaders
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2 inline-flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {players.length} Active Players
          </Badge>
        </div>
      </section>

      {/* League totals */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className={`text-3xl font-bold ${totalplus_minus > 0 ? 'text-green-600' : totalplus_minus < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {totalplus_minus > 0 ? '+' : ''}{totalplus_minus}
              </div>
              <div className="text-sm text-muted-foreground">Total +/-</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-3xl font-bold text-card-foreground">{totalGames}</div>
              <div className="text-sm text-muted-foreground">Total Games</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className={`text-3xl font-bold ${averagePerGame > 0 ? 'text-green-600' : averagePerGame < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {averagePerGame > 0 ? '+' : ''}{averagePerGame.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">League Avg</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex items-center gap-2"
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Rankings */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  Complete Rankings - {currentTab?.label}
                </h3>

                <div className="space-y-2">
                  {currentTab?.data.map((player, index) => {
                    const raw = player.games_played > 0 ? player.plus_minus / player.games_played : 0;
                    const adjusted = adjustedPerGame(player);
                    const statValue =
                      activeTab === "plus_minus" ? player.plus_minus :
                      activeTab === "average" ? raw : adjusted;

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Badge
                            variant={index < 3 ? "default" : "secondary"}
                            className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div>
                            <div className="font-semibold text-card-foreground">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.primary_position}
                              {player.games_played < priorGames && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Low Sample
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${statValue > 0 ? 'text-green-600' : statValue < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {statValue > 0 ? '+' : ''}{statValue.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activeTab === "plus_minus"
                              ? "+/-"
                              : activeTab === "average"
                              ? "per game"
                              : "adjusted"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
