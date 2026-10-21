import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

interface TeamCardProps {
  team: {
    team_id: string;
    name: string;
    captain: string;
    color: string;
    player_ids?: string[];
    wins: number;
    losses: number;
    points_for?: number;
    points_against?: number;
    season_id?: number;
  };
}

const TeamCard = ({ team }: TeamCardProps) => {
  // Derived entirely from props the caller already fetched — no extra
  // round-trips needed per card (this used to fire 3 sequential queries
  // per team, which was a serious N+1 on any page listing multiple teams).
  const playerCount = team.player_ids?.length ?? 0;
  const plusMinus = (team.points_for ?? 0) - (team.points_against ?? 0);

  const winPercentage =
    team.wins + team.losses > 0
      ? ((team.wins / (team.wins + team.losses)) * 100).toFixed(1)
      : "0.0";

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={`/logos/${team.team_id}.png`}
              alt={`${team.name} logo`}
              loading="lazy"
              width={48}
              height={48}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              className="w-12 h-12 rounded-lg object-contain shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
                  {team.name}
                </h3>

                <span title={`Season ${team.season_id}`} className="text-sm">
                  {team.season_id === 1
                    ? "🍂"
                    : team.season_id === 2
                      ? "❄️"
                      : team.season_id === 3
                        ? "🌸"
                        : team.season_id === 4
                          ? "☀️"
                          : team.season_id === 5
                            ? "🍂"
                            : null}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                Captain: {team.captain}
              </p>
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
