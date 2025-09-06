import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface TeamCardProps {
  team: {
    team_id: string;
    name: string;
    wins: number;
    losses: number;
    captain: string;
    color: string;
    player_ids?: string[]; // Optional array of player IDs
    points_for: number;
    points_against: number;
  };
}

const TeamCard = ({ team }: TeamCardProps) => {
  const winPercentage = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1);
  const [playerCount, setPlayerCount] = useState<number>(
    Array.isArray(team.player_ids) ? team.player_ids.length : 0
  );

  // Optional: fetch player count from Supabase if playerIds exists
  useEffect(() => {
    async function fetchPlayerCount() {
      if (team.player_ids && team.player_ids.length > 0) {
        // Assuming you have a 'players' table and want to confirm existing players
        const { data, error } = await supabase
          .from("players")
          .select("id")
          .in("id", team.player_ids);

        if (error) {
          console.error("Error fetching players:", error);
        } else {
          setPlayerCount(data?.length || 0);
        }
      } else {
        setPlayerCount(0);
      }
    }

    fetchPlayerCount();
  }, [team.player_ids]);

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">

            {/* icon  */}
            
            <img
              src={`/logos/${team.team_id}.jpg`} // or team.logo if you store it in the object
              alt={`${team.name} logo`}
              
              onError={(e) => {
                   <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: team.color }}
            >
              {team.name.substring(0, 2).toUpperCase()}
            </div> 
                }}

              className="w-12 h-12 rounded-lg object-contain shadow-md"
            />

            
            <div>
              <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
                {team.name}
              </h3>
              <p className="text-sm text-muted-foreground">Captain: {team.captain}</p>
            </div>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {winPercentage}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{team.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-500">{team.losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{(team.points_for-team.points_against)}</div>
            <div className="text-xs text-muted-foreground">Team +/-</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              {playerCount} player{playerCount !== 1 ? "s" : ""}
            </div>
          </div>

          <Link to={`/teams/${team.team_id}`}>
            <Button
              variant="outline"
              size="sm"
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              View Team
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;