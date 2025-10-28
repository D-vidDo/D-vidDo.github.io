import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  teamColor: string;
  teamColor2: string;
  stats: Record<string, number>;
  height?: string;
  dominant_hand?: string;
  reach?: string;
  vertical_jump?: string;
  imageUrl?: string;
  jersey_number?: string;
}

interface PlayerCardProps {
  player: Player;
  allPlayers?: Player[];
  sortKey?: string;
  allTeams?: Player[];
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

  const overallRating = Math.min(
    Object.values(player.stats || {}).reduce((sum, val) => sum + val, 0) * 2,
    100
  );

  const chartData = Object.entries(player.stats || {}).map(([key, value]) => ({
    stat: key,
    value,
  }));

  const compareChartData = () => {
    if (!comparePlayer) return [];
    const allStats = new Set([
      ...Object.keys(player.stats),
      ...Object.keys(comparePlayer.stats),
    ]);
    return Array.from(allStats).map((stat) => ({
      stat,
      [player.name]: player.stats[stat] || 0,
      [comparePlayer.name]: comparePlayer.stats[stat] || 0,
    }));
  };

  return (
    <>
      {/* PLAYER CARD */}
      <Card
        onClick={() => setOpen(true)}
        className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
      >
        <CardHeader
          className="pb-3 rounded-t-lg flex items-center"
          style={{
            background: `linear-gradient(90deg, #ffffff
             70%, ${player.teamColor || "#ffffff"} 100%)`,
          }}
        >
          <div className="flex items-center space-x-3">
            {/* CARD AVATAR */}
            <Avatar className="h-12 w-12">
              {player.imageUrl ? (
                <>
                  <AvatarImage src={player.imageUrl} alt={player.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-gray-500 text-white font-semibold flex items-center justify-center">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {/* CARD TITLE */}

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
                {/* Free Agent Badge */}
                {player.team === "Free Agent" && (
                  <Badge
                    variant="default"
                    className="text-sm font-semibold px-2 py-0.5 rounded text-white shadow-sm"
                    style={{
                      backgroundColor: "#6b7280", // Tailwind gray-500
                    }}
                  >
                    FA
                  </Badge>
                )}
              </div>

              {/* CARD POSITIONS */}
              <p className="text-sm text-muted-foreground">
                {player.primary_position}
                {player.secondary_position && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    / {player.secondary_position}
                  </span>
                )}
              </p>
            </div>

            {/* CARD OVERALL RATING */}
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

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          open={open}
          onOpenChange={setOpen}
          className="max-w-3xl p-0 overflow-hidden bg-[#1f1f1f] rounded-lg"
          style={
            {
              // background: "transparent", // make DialogContent itself transparent
            }
          }
          onClick={() => setOpen(false)} // clicking header closes modal
        >
          {/* MODAL HEADER */}
          <div
            className="flex flex-col sm:flex-row items-center sm:items-start text-white p-6 sm:p-8"
            style={{
              background: `linear-gradient(90deg, ${player.teamColor} 0%, ${player.teamColor2} 100%)`,
            }}
          >
            {/* PLAYER IMAGE */}
            <div
              className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden bg-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              {/* JERSEY NUMBER OVERLAY */}
              {player.jersey_number && (
                <div
                  className="absolute top-2 left-2 z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-black/60 text-white font-bold text-xl shadow-md"
                  style={{
                    border: `2px solid ${player.teamColor2 || "#fff"}`,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  #{player.jersey_number}
                </div>
              )}

              {player.imageUrl ? (
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage src={player.imageUrl} alt={player.name} />
                </Avatar>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-500">
                  <User className="w-16 h-16 text-white/80" />
                </div>
              )}
            </div>

            {/* PLAYER INFO */}
            <div className="mt-4 sm:mt-0 sm:ml-8 flex-1 flex flex-col text-center sm:text-left">
              {/* PLAYER NAME */}
              <h1 className="text-3xl font-bold">{player.name}</h1>

              {/* BADGES BELOW NAME */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* TITLE BADGE */}
                {player.title && (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-sm font-semibold shadow max-w-max"
                    style={{
                      background: `linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)`,
                      color: "#fff",
                    }}
                  >
                    {player.title}
                  </span>
                )}

                {/* TEAM BADGE */}
                {player.team && (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-sm font-semibold text-white max-w-max"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${
                        player.teamColor || "#858585"
                      } 0%, ${player.teamColor || "#858585"} 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "white",
                      backgroundClip: "padding-box",
                    }}
                  >
                    {player.team}
                  </span>
                )}
              </div>

              {/* PLAYER POSITIONS BELOW BADGES */}
              <div className="mt-2 text-sm text-slate-200">
                {player.primary_position}
                {player.secondary_position && (
                  <span> / {player.secondary_position}</span>
                )}
              </div>

              {/* OVERALL RATING */}
              <div className="mt-3 text-lg font-semibold">
                Overall Rating:{" "}
                <span className="text-yellow-400">{overallRating}</span>
              </div>

              {/* Compare Button
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
    )} */}
            </div>

            {/* TOP-RIGHT STATS */}
            <div className="absolute top-6 right-6 flex flex-col gap-1 text-sm text-slate-200 bg-slate-800/70 backdrop-blur-md rounded-lg px-3 py-2 text-right shadow-md">
              {player.height && (
                <div>
                  <span className="font-medium">Height:</span> {player.height}
                </div>
              )}
              {player.dominant_hand && (
                <div>
                  <span className="font-medium">Hits:</span>{" "}
                  {player.dominant_hand}
                </div>
              )}
              {player.reach && (
                <div>
                  <span className="font-medium">Reach:</span> {player.reach}
                </div>
              )}
              {player.vertical_jump && (
                <div>
                  <span className="font-medium">Vertical:</span>{" "}
                  {player.vertical_jump}
                </div>
              )}
            </div>
          </div>

          {/* BODY SECTION */}
          <div className="p-6 sm:p-8">
            {/* Radar Chart */}
            {chartData.length > 0 && (
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="stat"
                      stroke="#374151"
                      tick={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fill: "#f3f4f6",
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 6]}
                      ticks={[1, 3, 5]}
                      stroke="#9ca3af"
                      tick={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 10,
                        fill: "#e5e7eb",
                      }}
                    />
                    <Radar
                      name="Stats"
                      dataKey="value"
                      stroke="#facc15"
                      fill="#facc15"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* EXTENDED ATTRIBUTES */}
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {player.height && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">
                    Height
                  </span>
                  <span>{player.height}</span>
                </div>
              )}
              {player.dominant_hand && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">
                    Dominant Hand
                  </span>
                  <span>{player.dominant_hand}</span>
                </div>
              )}
              {player.reach && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">
                    Reach
                  </span>
                  <span>{player.reach}</span>
                </div>
              )}
              {player.vertical_jump && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">
                    Vertical Jump
                  </span>
                  <span>{player.vertical_jump}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* COMPARE MODAL
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Compare Stats</DialogTitle>
            <DialogDescription>
              Compare {player.name} with another player
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 sm:p-8">
            <div className="mb-4">
              <select
                className="border px-3 py-2 rounded w-full"
                onChange={(e) =>
                  setComparePlayer(
                    allPlayers.find((p) => p.id === e.target.value) || null
                  )
                }
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

            {comparePlayer && compareChartData().length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={compareChartData()}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="stat" stroke="#374151" />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      stroke="#9ca3af"
                    />
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
          </div>
        </DialogContent>
      </Dialog> */}
    </>
  );
};

export default PlayerCard;
