import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Award, Target } from "lucide-react";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    position: string;
    kills: number;
    aces: number;
    blocks: number;
    isCaptain?: boolean;
  };
}

const PlayerCard = ({ player }: PlayerCardProps) => {
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
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
            <p className="text-sm text-muted-foreground">{player.position}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">{player.kills}</div>
            <div className="text-xs text-muted-foreground">Kills</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-secondary">{player.aces}</div>
            <div className="text-xs text-muted-foreground">Aces</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-accent">{player.blocks}</div>
            <div className="text-xs text-muted-foreground">Blocks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;