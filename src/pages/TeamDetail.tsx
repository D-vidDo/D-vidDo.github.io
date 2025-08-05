import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Target, Users, Award } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { mockTeams } from "@/data/mockData";

const TeamDetail = () => {
  const { teamId } = useParams();
  const team = mockTeams.find(t => t.id === teamId);

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Team not found</h1>
          <Link to="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

  const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);
  const pointDifferential = team.pointsFor - team.pointsAgainst;
  
  // Team stats
  const teamKills = team.players.reduce((sum, player) => sum + player.kills, 0);
  const teamAces = team.players.reduce((sum, player) => sum + player.aces, 0);
  const teamBlocks = team.players.reduce((sum, player) => sum + player.blocks, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/teams" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Link>
          
          <div className="flex items-center space-x-6">
            <div 
              className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-primary"
              style={{ backgroundColor: team.color }}
            >
              {team.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                {team.name}
              </h1>
              <p className="text-lg text-primary-foreground/90 mb-4">
                Captain: {team.captain}
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {team.wins}W - {team.losses}L
                </Badge>
                <Badge variant="outline" className="text-lg px-4 py-2 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground">
                  {winPercentage}% Win Rate
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Team Statistics */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{team.pointsFor}</div>
              <div className="text-sm text-muted-foreground">Points For</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{teamKills}</div>
              <div className="text-sm text-muted-foreground">Team Kills</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{teamAces}</div>
              <div className="text-sm text-muted-foreground">Team Aces</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-stats shadow-card">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{teamBlocks}</div>
              <div className="text-sm text-muted-foreground">Team Blocks</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">Season Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">{team.wins}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-red-500 mb-1">{team.losses}</div>
                <div className="text-sm text-muted-foreground">Losses</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className={`text-3xl font-bold mb-1 ${pointDifferential > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {pointDifferential > 0 ? '+' : ''}{pointDifferential}
                </div>
                <div className="text-sm text-muted-foreground">Point Differential</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Roster */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Roster ({team.players.length} players)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.players.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamDetail;