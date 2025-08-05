import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import TeamCard from "@/components/TeamCard";
import { mockTeams, getTopPerformers } from "@/data/mockData";

const Home = () => {
  const topTeams = mockTeams
    .sort((a, b) => {
      const winPercentageA = a.wins / (a.wins + a.losses);
      const winPercentageB = b.wins / (b.wins + b.losses);
      return winPercentageB - winPercentageA;
    })
    .slice(0, 3);

  const { topPlusMinus, topAverage } = getTopPerformers();
  const totalGames = mockTeams.reduce((sum, team) => sum + team.wins + team.losses, 0) / 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
            Volleyball League Central
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Welcome to your competitive volleyball league hub. Track teams, players, standings, and statistics all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/teams">
              <Button size="lg" variant="secondary" className="font-semibold">
                <Users className="mr-2 h-5 w-5" />
                View All Teams
              </Button>
            </Link>
            <Link to="/standings">
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20">
                <Trophy className="mr-2 h-5 w-5" />
                League Standings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* League Stats */}
        <section className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{mockTeams.length}</div>
              <div className="text-sm text-muted-foreground">Teams</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {mockTeams.reduce((sum, team) => sum + team.playerIds.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Players</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{totalGames}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {Math.round(mockTeams.reduce((sum, team) => sum + team.pointsFor, 0) / mockTeams.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Points</div>
            </CardContent>
          </Card>
        </section>

        {/* Top Teams */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Top Teams</h2>
            <Link to="/teams">
              <Button variant="outline">View All Teams</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {topTeams.map((team, index) => (
              <div key={team.id} className="relative">
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-hero">
                    🏆 #1
                  </Badge>
                )}
                <TeamCard team={team} />
              </div>
            ))}
          </div>
        </section>

        {/* Player Highlights */}
        <section className="grid md:grid-cols-2 gap-8">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Top Plus/Minus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPlusMinus.slice(0, 3).map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.position}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${player.plusMinus > 0 ? 'text-green-600' : player.plusMinus < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {player.plusMinus > 0 ? '+' : ''}{player.plusMinus}
                      </div>
                      <div className="text-xs text-muted-foreground">+/-</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                Best Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAverage.slice(0, 3).map((player, index) => {
                  const average = player.gamesPlayed > 0 ? (player.plusMinus / player.gamesPlayed) : 0;
                  return (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.position}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${average > 0 ? 'text-green-600' : average < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {average > 0 ? '+' : ''}{average.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">avg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Home;