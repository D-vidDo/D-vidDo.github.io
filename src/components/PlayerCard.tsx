
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Player {
  id: string;
  name: string;
  primary_position: string;
  secondary_position: string;
  plus_minus: number;
  games_played: number;
  isCaptain?: boolean;
  title?: string; // Assigned in DB
  team: string;
  stats: Record<string, number>;
}

// Local mapping for tooltip labels

const STAT_LABELS: Record<string, string> = {
  Hustle: "Hustle",
  Hitting: "Hitting",
  Serving: "Serving",
  Setting: "Setting",
  Stamina: "Stamina",
  Blocking: "Blocking",
  Receiving: "Receiving",
  Communication: "Communication",
  "Vertical Jump": "Vertical Jump",
  "Defensive Positioning": "Defensive Positioning",
};


const PlayerCard = ({ player, sortKey }: { player: Player; sortKey?: string }) => {
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const overallRating = Math.min(
    Object.values(player.stats || {}).reduce((sum, val) => sum + val, 0) * 2,
    100
  );

const displayLabel = player.title
  ? STAT_LABELS[player.title] || player.title
  : null;

const tooltipText = displayLabel
  ? `Highest ${displayLabel} score`
  : null;


  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3 relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground">{player.name}</h3>

              {displayLabel && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="text-sm font-semibold px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm cursor-help"
                        aria-label={`Title: ${displayLabel}`}
                      >
                        {displayLabel}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-[240px]">
                      <p className="text-xs leading-snug">
                        Highest {displayLabel} score
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {player.isCaptain && (
              <Badge variant="default" className="text-xs">
                <Award className="h-3 w-3 mr-1" /> Captain
              </Badge>
            )}

            <p className="text-sm text-muted-foreground">
              {player.primary_position}
              {player.secondary_position && (
                <span className="ml-2 text-xs text-muted-foreground">
                  / {player.secondary_position}
                </span>
              )}
            </p>
          </div>

          <div className="absolute top-0 right-0 flex flex-col items-center">
            <span className="text-[10px] font-semibold text-muted-foreground mb-0.5">OVR</span>
            <Badge variant="secondary" className="text-base px-2 py-1 font-bold">
              {overallRating}
            </Badge>
          </div>
        </div>
      </CardHeader>


      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <div
              className={`text-lg font-bold ${
                player.plus_minus > 0
                  ? "text-green-600"
                  : player.plus_minus < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            >
              {player.plus_minus > 0 ? "+" : ""}
              {player.plus_minus}
            </div>
            <div className="text-xs text-muted-foreground">+/-</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">{player.games_played}</div>
            <div className="text-xs text-muted-foreground">Games</div>
          </div>
        </div>

        {player.games_played > 0 && (
          <div className="mt-3 pt-3 border-t text-center">
            <div className="text-sm text-muted-foreground">Average per game:</div>
            <div
              className={`text-lg font-semibold ${
                player.plus_minus / player.games_played > 0
                  ? "text-green-600"
                  : player.plus_minus / player.games_played < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            >
              {player.plus_minus / player.games_played > 0 ? "+" : ""}
              {(player.plus_minus / player.games_played).toFixed(1)}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {sortKey === "Overall Rating" && (
            <div className="col-span-2 flex justify-between items-center bg-yellow-100 rounded px-2 py-1 font-bold">
              <span className="font-medium">Overall Rating</span>
              <span className="text-primary">{overallRating}</span>
            </div>
          )}
          {Object.entries(player.stats || {}).map(([stat, value]) => (
            <div
              key={stat}
              className={`flex justify-between items-center rounded px-2 py-1 ${
                sortKey === stat ? "bg-yellow-100 font-bold" : "bg-muted/30"
              }`}
            >
              <span className="font-medium capitalize">{stat}</span>
              <span className="text-primary">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;