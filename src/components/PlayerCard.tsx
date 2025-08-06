import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Award, TrendingUp } from "lucide-react";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    primaryPosition: string;
    secondaryPosition?: string;
    plusMinus: number;
    gamesPlayed: number;
    isCaptain?: boolean;
    stats: Record<string, number>;
  };
  sortKey?: string;
}

const PlayerCard = ({ player, sortKey }: PlayerCardProps) => {
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const overallRating = Math.min(
    Object.values(player.stats).reduce((sum, val) => sum + val, 0) * 2,
    100
  );

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
              {player.isCaptain && (
                <Badge variant="default" className="text-xs">
                  <Award className="h-3 w-3 mr-1" />
                  Captain
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {player.primaryPosition}
              {player.secondaryPosition ? (
                <span className="ml-2 text-xs text-muted-foreground">
                  / {player.secondaryPosition}
                </span>
              ) : null}
            </p>
          </div>
          {/* Overall Rating Badge */}
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
            <div className={`text-lg font-bold ${player.plusMinus > 0 ? 'text-green-600' : player.plusMinus < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {player.plusMinus > 0 ? '+' : ''}{player.plusMinus}
            </div>
            <div className="text-xs text-muted-foreground">+/-</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">{player.gamesPlayed}</div>
            <div className="text-xs text-muted-foreground">Games</div>
          </div>
        </div>
        {player.gamesPlayed > 0 && (
          <div className="mt-3 pt-3 border-t text-center">
            <div className="text-sm text-muted-foreground">Average per game:</div>
            <div className={`text-lg font-semibold ${(player.plusMinus / player.gamesPlayed) > 0 ? 'text-green-600' : (player.plusMinus / player.gamesPlayed) < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {((player.plusMinus / player.gamesPlayed) > 0 ? '+' : '')}{(player.plusMinus / player.gamesPlayed).toFixed(1)}
            </div>
          </div>
        )}
        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {/* Highlight overall rating if selected */}
          {sortKey === "Overall Rating" && (
            <div className="col-span-2 flex justify-between items-center bg-yellow-100 rounded px-2 py-1 font-bold">
              <span className="font-medium">Overall Rating</span>
              <span className="text-primary">{overallRating}</span>
            </div>
          )}
          {Object.entries(player.stats).map(([stat, value]) => (
            <div
              key={stat}
              className={`flex justify-between items-center rounded px-2 py-1 ${
                sortKey === stat
                  ? "bg-yellow-100 font-bold"
                  : "bg-muted/30"
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