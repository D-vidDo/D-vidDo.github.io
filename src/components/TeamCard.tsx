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
    captain: string;
    color: string;
    player_ids?: string[];
  };
}

const TeamCard = ({ team }: TeamCardProps) => {
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [pointsFor, setPointsFor] = useState<number>(0);
  const [pointsAgainst, setPointsAgainst] = useState<number>(0);

  useEffect(() => {
    async function fetchStats() {
      // Fetch player count
      if (team.player_ids?.length) {
        const { data } = await supabase
          .from("players")
          .select("id")
          .in("id", team.player_ids);
        setPlayerCount(data?.length || 0);
      }

      // Fetch games and sets
      const { data: games } = await supabase
        .from("games")
        .select(`
          id,
          team_id,
          sets (
            points_for,
            points_against
          )
        `)
        .eq("team_id", team.team_id);

      let w = 0, l = 0, pf = 0, pa = 0;

      (games ?? []).forEach((game) => {
        const sets = game.sets ?? [];
        let gamePF = 0;
        let gamePA = 0;

        sets.forEach((set) => {
          gamePF += set.points_for;
          gamePA += set.points_against;
        });

        pf += gamePF;
        pa += gamePA;

        if (gamePF > gamePA) w++;
        else if (gamePF < gamePA) l++;
      });

      setWins(w);
      setLosses(l);
      setPointsFor(pf);
      setPointsAgainst(pa);
    }

    fetchStats();
  }, [team.team_id, team.player_ids]);

  const winPercentage =
    wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0.0";
  const plusMinus = pointsFor - pointsAgainst;

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={`/logos/${team.team_id}.jpg`}
              alt={`${team.name} logo`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
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
            <div className="text-2xl font-bold text-green-600">{wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-500">{losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{plusMinus}</div>
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
