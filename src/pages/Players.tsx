import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";
import { List, Grid } from "lucide-react";

const statKeys = [
  "Overall Rating",
  "Serving",
  "Receiving",
  "Defensive Positioning",
  "Setting",
  "Blocking",
  "Hitting",
  "Hustle",
  "Stamina",
  "Vertical Jump",
  "Communication",
  "+/-",
  "Games Played",
];

const getOverallRating = (player: any) => {
  if (!player.stats) return 0;
  const values = Object.values(player.stats);
  const total = values.reduce((sum: number, val: number) => sum + val, 0);
  return Math.min(total * 2, 100);
};

const fetchPlayersAndTeams = async () => {
  const { data: players, error: playerError } = await supabase.from("players").select("*");
  if (playerError) throw new Error(playerError.message);

  const { data: teams, error: teamError } = await supabase.from("teams").select("*");
  if (teamError) throw new Error(teamError.message);

  // Map player IDs to team
  const playerTeamMap: Record<number, any> = {};
  teams.forEach((team) => {
    if (team.player_ids) {
      team.player_ids.forEach((pid: number) => {
        playerTeamMap[pid] = team;
      });
    }
  });

  // Attach team info to players
  const playersWithTeam = players.map((player: any) => {
    const team = playerTeamMap[player.id];
    return { ...player, teamName: team?.name || "Free Agent", teamColor: team?.color };
  });

  return { players: playersWithTeam, teams };
};

const Players = () => {
  const [sortKey, setSortKey] = useState("Overall Rating");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [selectedTeam, setSelectedTeam] = useState("All");

  const { data, isLoading, error } = useQuery({
    queryKey: ["playersAndTeams"],
    queryFn: fetchPlayersAndTeams,
  });

  const allPlayers = data?.players || [];
  const allTeams = data?.teams || [];

  const teams = ["All", ...new Set(allPlayers.map((p) => p.teamName).filter(Boolean))];

  const filteredPlayers = allPlayers.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = selectedTeam === "All" || player.teamName === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortKey === "Overall Rating") return getOverallRating(b) - getOverallRating(a);
    if (sortKey === "+/-") return (b.plus_minus || 0) - (a.plus_minus || 0);
    if (sortKey === "Games Played") return (b.games_played || 0) - (a.games_played || 0);
    return (b.stats?.[sortKey] || 0) - (a.stats?.[sortKey] || 0);
  });

  const renderListView = () => (
    <div className="max-w-6xl mx-auto divide-y divide-border bg-card rounded-lg shadow-card overflow-hidden">
      {sortedPlayers.map((player) => {
        const initials = player.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase();
        const overall = getOverallRating(player);
        return (
          <div
            key={player.id}
            className="flex flex-col md:flex-row items-center justify-between p-4 hover:bg-muted/50 transition-colors duration-200 gap-4"
          >
            {/* Player Info */}
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-card-foreground">{player.name}</h3>
                  {player.title && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                      {player.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {player.primary_position}
                  {player.secondary_position && <span className="ml-1">/ {player.secondary_position}</span>}
                  {player.teamName && (
                    <span className="ml-2 font-medium" style={{ color: player.teamColor || undefined }}>
                      {player.teamName}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2 mt-2 md:mt-0 md:gap-4 items-center justify-end">
              <Badge
                variant={sortKey === "Overall Rating" ? "secondary" : "default"}
                className="text-sm px-2 py-1 font-bold"
              >
                OVR: {overall}
              </Badge>
              <Badge
                variant={sortKey === "+/-" ? "secondary" : "default"}
                className={`text-sm px-2 py-1 font-bold ${
                  player.plus_minus > 0 ? "text-green-600" : player.plus_minus < 0 ? "text-red-500" : ""
                }`}
              >
                +/-: {player.plus_minus > 0 ? "+" : ""}
                {player.plus_minus}
              </Badge>
              <Badge
                variant={sortKey === "Games Played" ? "secondary" : "default"}
                className="text-sm px-2 py-1 font-bold text-primary"
              >
                Games: {player.games_played}
              </Badge>
              {Object.entries(player.stats || {}).map(([stat, value]) => (
                <Badge
                  key={stat}
                  variant={sortKey === stat ? "secondary" : "default"}
                  className="text-sm px-2 py-1 font-bold"
                >
                  {stat}: {value}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-hero py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            All Players
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-6">
            Complete roster and individual stats for every player in the league.
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {allPlayers.length} Players
          </Badge>
        </div>
      </section>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap gap-4 justify-center items-center">
        <Input
          type="text"
          placeholder="Search for a player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {/* View toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            onClick={() => setViewMode("card")}
            size="icon"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            onClick={() => setViewMode("list")}
            size="icon"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Team filter */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-medium text-primary">Team:</span>
          {teams.map((team) => (
            <Button
              key={team}
              variant={selectedTeam === team ? "secondary" : "ghost"}
              className="text-xs px-3 py-1"
              onClick={() => setSelectedTeam(team)}
            >
              {team}
            </Button>
          ))}
        </div>
      </div>

      {/* Sort Buttons */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center gap-2 justify-center">
        <span className="font-medium text-primary mr-2">Sort By:</span>
        {statKeys.map((key) => (
          <Button
            key={key}
            variant={sortKey === key ? "secondary" : "ghost"}
            className="text-xs px-3 py-1"
            onClick={() => setSortKey(key)}
          >
            {key}
          </Button>
        ))}
      </div>

      {/* Player Display */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <p className="text-center">Loading players...</p>
        ) : error ? (
          <p className="text-center text-red-500">Error: {error.message}</p>
        ) : viewMode === "card" ? (
          <div className="grid md:grid-cols-3 gap-6">
            {sortedPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} sortKey={sortKey} />
            ))}
          </div>
        ) : (
          renderListView()
        )}
      </div>
    </div>
  );
};

export default Players;
