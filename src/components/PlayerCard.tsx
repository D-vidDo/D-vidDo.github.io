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
  stat_visibility: Boolean;
  height?: string;
  dominant_hand?: string;
  reach?: string;
  vertical_jump?: string;
  imageUrl?: string;
  jersey_number?: string;
  wins?: number;
  losses?: number;
  ties?: number;
}

interface PlayerCardProps {
  player: Player;
  allPlayers?: Player[];
  sortKey?: string;
  allTeams?: Player[];
  forceShowStats?: Boolean;
}

const PlayerCard = ({
  player,
  allPlayers = [],
  sortKey,
  forceShowStats = false,
}: PlayerCardProps) => {
  const [open, setOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [comparePlayer, setComparePlayer] = useState<Player | null>(null);

  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const hasVisibleStats =
    (forceShowStats || player.stat_visibility) &&
    Object.keys(player.stats || {}).length > 0;

  const overallRating = hasVisibleStats
    ? Math.min(
        Math.round(
          (Object.values(player.stats).reduce((sum, val) => sum + val, 0) *
            100) /
            40
        ),
        100
      )
    : null;

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

  const hasRecord =
    player.wins !== undefined ||
    player.losses !== undefined ||
    player.ties !== undefined;

  return (
    <>
      {/* PLAYER CARD */}
      <Card
        onClick={() => setOpen(true)}
        className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
      >
        <CardHeader
          className="pb-3 relative rounded-t-lg flex items-start"
          style={{
            background: `linear-gradient(0deg, #ffffff 85%, ${player.teamColor || "#ffffff"} 100%)`,
          }}
        >
          <div className="flex items-start space-x-3">
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
              <div className="flex items-start gap-2">
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
                    style={{ backgroundColor: "#6b7280" }}
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
          </div>

          {/* CARD OVERALL RATING */}
          <div className="flex flex-col items-center absolute top-3 right-3">
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
              <div className="text-xs text-muted-foreground">Sets</div>
            </div>
          </div>

          {/* W-L-T RECORD */}
          {hasRecord && (
            <div className="mt-3 pt-3 border-t text-center">
              <div className="text-xs text-muted-foreground mb-1">Record</div>
              <div className="text-lg font-bold">
                <span className="text-green-600">{player.wins ?? 0}</span>
                <span className="text-muted-foreground font-normal"> - </span>
                <span className="text-red-500">{player.losses ?? 0}</span>
                <span className="text-muted-foreground font-normal"> - </span>
                <span className="text-primary">{player.ties ?? 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">W - L - T</div>
            </div>
          )}

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
            {hasVisibleStats &&
              Object.entries(player.stats).map(([stat, value]) => (
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
            {!hasVisibleStats && (
              <div className="text-xs text-muted-foreground italic text-center">
                Stats are private
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          open={open}
          onOpenChange={setOpen}
          className="max-w-3xl p-0 overflow-hidden bg-[#1f1f1f] rounded-lg"
          onClick={() => setOpen(false)}
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

              {/* PLAYER POSITIONS */}
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

              {/* W-L-T RECORD IN MODAL HEADER */}
              {hasRecord && (
                <div className="mt-2 text-lg font-semibold">
                  Record:{" "}
                  <span className="text-green-400">{player.wins ?? 0}</span>
                  <span className="text-slate-300 font-normal"> - </span>
                  <span className="text-red-400">{player.losses ?? 0}</span>
                  <span className="text-slate-300 font-normal"> - </span>
                  <span className="text-yellow-400">{player.ties ?? 0}</span>
                  <span className="text-slate-400 text-sm font-normal ml-1">
                    W - L - T
                  </span>
                </div>
              )}
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
              {/* W-L-T IN MODAL BODY */}
              {hasRecord && (
                <div className="flex justify-between border-b pb-1">
                  <span className="font-medium text-muted-foreground">
                    Record (W-L-T)
                  </span>
                  <span>
                    <span className="text-green-500">{player.wins ?? 0}</span>
                    {" - "}
                    <span className="text-red-500">{player.losses ?? 0}</span>
                    {" - "}
                    <span>{player.ties ?? 0}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlayerCard;
