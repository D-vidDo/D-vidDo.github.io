import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Award, Shield, Users } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { getTopPerformers, getAllPlayers } from "@/data/mockData";

const Stats = () => {
  const [activeTab, setActiveTab] = useState("killers");
  const { topKillers, topAces, topBlockers } = getTopPerformers();
  const allPlayers = getAllPlayers();

  const tabs = [
    { id: "killers", label: "Top Killers", icon: Target, data: topKillers, stat: "kills" },
    { id: "aces", label: "Top Aces", icon: Award, data: topAces, stat: "aces" },
    { id: "blockers", label: "Top Blockers", icon: Shield, data: topBlockers, stat: "blocks" },
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const Icon = currentTab?.icon || Target;

  // Calculate league totals
  const totalKills = allPlayers.reduce((sum, player) => sum + player.kills, 0);
  const totalAces = allPlayers.reduce((sum, player) => sum + player.aces, 0);
  const totalBlocks = allPlayers.reduce((sum, player) => sum + player.blocks, 0);

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
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-card-foreground">{totalKills.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Kills</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-3xl font-bold text-card-foreground">{totalAces.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Aces</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-3xl font-bold text-card-foreground">{totalBlocks.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Blocks</div>
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
                  {currentTab?.data.map((player, index) => (
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
                        <div className="text-xl font-bold text-primary">
                          {player[currentTab?.stat as keyof typeof player]}
                        </div>
                        <div className="text-xs text-muted-foreground">{currentTab?.stat}</div>
                      </div>
                    </div>
                  ))}
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