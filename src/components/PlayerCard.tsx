import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Player {
  id: string;
  name: string;
  primary_position: string;
  secondary_position?: string;
  plus_minus: number;
  games_played: number;
  isCaptain?: boolean;
  title: string;
  team: string;
  stats: Record<string, number>;
  height?: string;
  dominant_hand?: string;
  reach?: string;
  vertical_jump?: string;
  imageUrl?: string;
}

interface PlayerCardProps {
  player: Player;
  allPlayers?: Player[];
  sortKey?: string;
}

const PlayerCard = ({ player, allPlayers = [], sortKey }: PlayerCardProps) => {
  const [open, setOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [comparePlayer, setComparePlayer] = useState<Player | null>(null);

  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const overallRating = useMemo(
    () =>
      Math.min(
        Object.values(player.stats || {}).reduce((sum, val) => sum + val, 0) * 2,
        100
      ),
    [player.stats]
  );

  const chartData = useMemo(
    () =>
      Object.entries(player.stats || {}).map(([key, value]) => ({
        stat: key,
        value,
      })),
    [player.stats]
  );

  const compareChartData = useMemo(() => {
    if (!comparePlayer) return [];
    const allStats = new Set([
      ...Object.keys(player.stats || {}),
      ...Object.keys(comparePlayer.stats || {}),
    ]);
    return Array.from(allStats).map((stat) => ({
      stat,
      [player.name]: player.stats[stat] || 0,
      [comparePlayer.name]: comparePlayer.stats[stat] || 0,
    }));
  }, [comparePlayer, player.stats, player.name]);

  return (
    <>
      {/* PLAYER CARD */}
      <Card
        onClick={() => setOpen(true)}
        className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 cursor-pointer"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3 relative">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-card-foreground">
                  {player.name}
                </h3>
                {player.title && (
                  <span className="text-sm font-semibold px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                    {player.title}
                  </span>
                )}
                {player.isCaptain && (
                  <Badge variant="default" className="text-xs">
                    <Award className="h-3 w-3 mr-1" /> Captain
                  </Badge>
                )}
              </div>
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
              <span className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                OVR
              </span>
              <Badge
                variant="secondary"
                className="text-base px-2 py-1 font-bold"
              >
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
              <div className="text-lg font-bold text-primary">
                {player.games_played}
              </div>
              <div className="text-xs text-muted-foreground">Games</div>
            </div>
          </div>

          {player.games_played > 0 && (
            <div className="mt-3 pt-3 border-t text-center">
              <div className="text-sm text-muted-foreground">
                Average per game:
              </div>
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
        </CardContent>
      </Card>

      {/* PLAYER DETAILS MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white p-6 sm:p-8">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-slate-600 flex items-center justify-center">
              {player.imageUrl ? (
                <AvatarImage src={player.imageUrl} alt={player.name} />
              ) : (
                <User className="w-16 h-16 text-slate-300" />
              )}
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-8 flex flex-col text-center sm:text-left">
              <h1 className="text-3xl font-bold">{player.name}</h1>
              {player.title && (
                <span className="mt-1 inline-block px-3 py-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-semibold shadow">
                  {player.title}
                </span>
              )}
              <div className="mt-2 text-sm text-slate-300">
                {player.primary_position}
                {player.secondary_position && (
                  <span> / {player.secondary_position}</span>
                )}
              </div>
              <div className="mt-3 text-lg font-semibold">
                Overall Rating:{" "}
                <span className="text-yellow-400">{overallRating}</span>
              </div>

              {/* Compare Button */}
              {allPlayers.filter((p) => p.id !== player.id).length > 0 && (
                <button
                  className="mt-4 px-4 py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-500 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompareOpen(true);
                  }}
                >
                  Compare Stats
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* COMPARE MODAL */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl p-6 sm:p-8 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Compare Stats</DialogTitle>
            <DialogDescription>
              Compare {player.name} with another player
            </DialogDescription>
          </DialogHeader>

          {/* Player Selection */}
          <div className="mb-4">
            <select
              className="border px-3 py-2 rounded w-full"
              value={comparePlayer?.id || ""}
              onChange={(e) => {
                const selected = allPlayers.find(
                  (p) => p.id === e.target.value
                );
                setComparePlayer(selected || null);
              }}
            >
              <option value="">Select a player to compare</option>
              {allPlayers
                .filter((p) => p.id !== player.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Radar Chart */}
          {comparePlayer && compareChartData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={compareChartData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="stat" stroke="#374151" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#9ca3af" />
                  <Radar
                    name={player.name}
                    dataKey={player.name}
                    stroke="#facc15"
                    fill="#facc15"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name={comparePlayer.name}
                    dataKey={comparePlayer.name}
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlayerCard;
