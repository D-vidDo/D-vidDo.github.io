import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, ArrowLeftRight } from "lucide-react";
import { useLeague } from "@/context/LeagueContext";
import { Team, Player } from "@/data/mockData";

interface TradeAnnouncerProps {
  trigger?: React.ReactNode;
}

const TradeAnnouncer = ({ trigger }: TradeAnnouncerProps) => {
  const { teams, players, movePlayer, announceTradeRecord } = useLeague();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [fromTeam, setFromTeam] = useState<string>("");
  const [toTeam, setToTeam] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleTrade = () => {
    if (!selectedPlayer || !fromTeam || !toTeam || fromTeam === toTeam) return;

    const player = players.find(p => p.id === selectedPlayer);
    const fromTeamName = teams.find(t => t.id === fromTeam)?.name || "Free Agency";
    const toTeamName = teams.find(t => t.id === toTeam)?.name || "Free Agency";

    if (!player) return;

    // Execute the trade
    movePlayer(selectedPlayer, fromTeam === "free-agency" ? null : fromTeam, toTeam === "free-agency" ? null : toTeam);

    // Record the trade
    announceTradeRecord({
      date: new Date().toISOString().split('T')[0],
      description: description || `${player.name} traded from ${fromTeamName} to ${toTeamName}`,
      playersTraded: [{
        player,
        fromTeam: fromTeamName,
        toTeam: toTeamName
      }]
    });

    // Reset form
    setSelectedPlayer("");
    setFromTeam("");
    setToTeam("");
    setDescription("");
    setIsOpen(false);
  };

  const availableFromTeams = teams.filter(team => 
    team.playerIds.some(id => players.find(p => p.id === id))
  );

  const availableToTeams = teams.filter(team => team.id !== fromTeam);

  const playersInFromTeam = fromTeam === "free-agency" 
    ? players.filter(p => !p.teamId)
    : players.filter(p => p.teamId === fromTeam);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Announce Trade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Announce Trade
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* From Team Selection */}
          <div className="space-y-2">
            <Label>From Team</Label>
            <Select value={fromTeam} onValueChange={setFromTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Select source team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free-agency">Free Agency</SelectItem>
                {availableFromTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player Selection */}
          {fromTeam && (
            <div className="space-y-2">
              <Label>Player</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player to trade" />
                </SelectTrigger>
                <SelectContent>
                  {playersInFromTeam.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} - {player.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* To Team Selection */}
          {selectedPlayer && (
            <div className="space-y-2">
              <Label>To Team</Label>
              <Select value={toTeam} onValueChange={setToTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free-agency">Free Agency</SelectItem>
                  {availableToTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Trade Description */}
          {toTeam && (
            <div className="space-y-2">
              <Label>Trade Description (Optional)</Label>
              <Textarea
                placeholder="Add details about the trade..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Trade Summary */}
          {selectedPlayer && fromTeam && toTeam && (
            <Card className="bg-gradient-stats">
              <CardHeader>
                <CardTitle className="text-lg">Trade Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      {fromTeam === "free-agency" ? "Free Agency" : teams.find(t => t.id === fromTeam)?.name}
                    </Badge>
                    <div className="font-semibold">
                      {players.find(p => p.id === selectedPlayer)?.name}
                    </div>
                  </div>
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      {toTeam === "free-agency" ? "Free Agency" : teams.find(t => t.id === toTeam)?.name}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Destination
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTrade}
              disabled={!selectedPlayer || !fromTeam || !toTeam || fromTeam === toTeam}
            >
              Announce Trade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeAnnouncer;