import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, Users } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { getTopPerformers, allPlayers } from "@/data/mockData";

const Stats = () => {
  const [activeTab, setActiveTab] = useState("plusMinus");
  const { topPlusMinus, topAverage } = getTopPerformers();

  const tabs = [
    { id: "plusMinus", label: "Top +/-", icon: TrendingUp, data: topPlusMinus, stat: "plusMinus" },
    { id: "average", label: "Best Average", icon: Trophy, data: topAverage, stat: "average" },
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const Icon = currentTab?.icon || TrendingUp;

  // Calculate league totals
  const totalPlusMinus = allPlayers.reduce((sum, player) => sum + player.plusMinus, 0);
  const totalGames = allPlayers.reduce((sum, player) => sum + player.gamesPlayed, 0);
  const averagePerGame = totalGames > 0 ? (totalPlusMinus / totalGames) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Player Statistics
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-6">
            Individual performance metrics and league leaders
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="mr-2 h-4 w-4" />
            {allPlayers.length} Active Players
          </Badge>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* League Totals */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className={`text-3xl font-bold ${totalPlusMinus > 0 ? 'text-green-600' : totalPlusMinus < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {totalPlusMinus > 0 ? '+' : ''}{totalPlusMinus}
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

        {/* Category Tabs */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    onClick={() => setActiveTab(tab.id)}
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
              {/* Top 3 Podium */}
              <div className="grid md:grid-cols-3 gap-6">
                {currentTab?.data.slice(0, 3).map((player, index) => (
                  <div key={player.id} className="relative">
                    <Badge 
                      className={`absolute -top-2 -right-2 z-10 ${
                        index === 0 ? 'bg-gradient-hero' : 
                        index === 1 ? 'bg-secondary' : 'bg-accent'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #{index + 1}
                    </Badge>
                    <PlayerCard player={player} />
                  </div>
                ))}
              </div>

              {/* Detailed Rankings */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  Complete Rankings - {currentTab?.label}
                </h3>
                
                <div className="space-y-2">
                  {currentTab?.data.map((player, index) => {
                    const statValue = activeTab === "average" 
                      ? (player.gamesPlayed > 0 ? (player.plusMinus / player.gamesPlayed) : 0)
                      : player.plusMinus;
                    
                    return (
                      <div key={player.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <div className="font-semibold text-card-foreground">{player.name}</div>
                            <div className="text-sm text-muted-foreground">{player.position}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${statValue > 0 ? 'text-green-600' : statValue < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {statValue > 0 ? '+' : ''}{activeTab === "average" ? statValue.toFixed(1) : statValue}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activeTab === "average" ? "avg" : "+/-"}
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