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
  "+/-",
  "Games Played",
  "Overall Rating",
  "Serving",
  "Passing",
  "Setting",
  "Blocking",
  "Hitting",
  "Stamina",
  "Game Sense",
  "Communication",
];

const statAbbreviations: Record<string, string> = {
  Hitting: "HIT",
  Serving: "SER",
  Setting: "SET",
  Stamina: "STA",
  Blocking: "BLO",
  Passing: "PAS",
  Communication: "COM",
  "Game Sense": "IQ",
  "+/-": "+/-",
  "Games Played": "GP",
  "Overall Rating": "OVR",
};

const getOverallRating = (player: any) => {
  if (!player.stats) return 0;
  const values = Object.values(player.stats);
  const total = values.reduce((sum: number, val: number) => sum + val, 0);
  return Math.min((total / 40)*100, 100);
};

const fetchPlayers = async () => {
  const { data, error } = await supabase.from("players").select("*");
  if (error) throw new Error(error.message);
  return data;
};

const fetchTeams = async () => {
  const { data, error } = await supabase.from("teams").select("*").eq("season_id", 2); // only get teams from season 2
  if (error) throw new Error(error.message);
  return data;
};

const Players = () => {
  const [sortKey, setSortKey] = useState("+/-");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [selectedTeam, setSelectedTeam] = useState("All");

  const {
    data: allPlayers = [],
    isLoading: loadingPlayers,
    error: errorPlayers,
  } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const teams = ["All", ...allTeams.map((t: any) => t.name)];

  const playersWithTeam = allPlayers.map((p) => {
    const team =
      allTeams.find((t: any) => (t.player_ids || []).includes(p.id)) || null;
    return {
      ...p,
      team: team ? team.name : "Free Agent",
      teamColor: team?.color || "#999",
      teamColor2: team?.color2 || "#999",
    };
  });

  const filteredPlayers = playersWithTeam.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesTeam = selectedTeam === "All" || player.team === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  /* SORT FUNCTION */
const sortedPlayers = [...filteredPlayers].sort((a, b) => {
  let diff = 0;

  if (sortKey === "Overall Rating") {
    diff = getOverallRating(b) - getOverallRating(a);
  } else if (sortKey === "+/-") {
    diff = (b.plus_minus || 0) - (a.plus_minus || 0);
  } else if (sortKey === "Games Played") {
    diff = (b.games_played || 0) - (a.games_played || 0);
  } else {
    diff = (b.stats?.[sortKey] || 0) - (a.stats?.[sortKey] || 0);
  }

  return sortOrder === "asc" ? -diff : diff; // flip for ascending
});


  {
    /* LIST VIEW */
  }
  const renderListView = () => (
    <div className="max-w-5xl mx-auto divide-y divide-border bg-card rounded-lg shadow-card overflow-hidden">
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
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors duration-200 gap-2 sm:gap-4"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-card-foreground truncate">
                    {player.name}
                  </h3>
                  {player.title && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                      {player.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {player.primary_position}
                  {player.secondary_position && (
                    <span className="ml-1 text-muted-foreground/70">
                      / {player.secondary_position}
                    </span>
                  )}
                  <span
                    className="ml-2 font-semibold truncate"
                    style={{ color: player.teamColor }}
                  >
                    {player.team}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 justify-center text-center mt-2 sm:mt-0">
              <div>
                <div
                  className={`font-bold ${
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
                <div className="text-[10px] text-muted-foreground">
                  {statAbbreviations["+/-"]}
                </div>
              </div>
              <div>
                <div className="font-bold text-primary">
                  {player.games_played}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {statAbbreviations["Games Played"]}
                </div>
              </div>
              <div>
                <Badge
                  variant="secondary"
                  className="text-sm px-2 py-1 font-bold"
                >
                  {overall}
                </Badge>
                <div className="text-[10px] text-muted-foreground">
                  {statAbbreviations["Overall Rating"]}
                </div>
              </div>
              {statKeys
                .filter(
                  (s) => !["Overall Rating", "+/-", "Games Played"].includes(s)
                )
                .map((stat) => (
                  <div key={stat}>
                    <div
                      className={`font-bold ${
                        stat === sortKey ? "text-yellow-400" : "text-primary"
                      }`}
                    >
                      {player.stats?.[stat]}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {statAbbreviations[stat]}
                    </div>
                  </div>
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

        {/* Team Dropdown */}
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="border border-border rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition font-sans"
        >
          {/* Team select option */}
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
          {/* Free Agent option */}
          <option value="Free Agent">Free Agents</option>
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="border border-border rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition font-sans"
        >
          {statKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        {/* Asc/Desc Button */}
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          className="border border-border rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>

      {/* Player Display */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loadingPlayers ? (
          <p className="text-center">Loading players...</p>
        ) : errorPlayers ? (
          <p className="text-center text-red-500">
            Error: {errorPlayers.message}
          </p>
        ) : viewMode === "card" ? (
          <div className="grid md:grid-cols-3 gap-6">
            {sortedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                sortKey={sortKey}
                allPlayers={sortedPlayers}
              />
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
