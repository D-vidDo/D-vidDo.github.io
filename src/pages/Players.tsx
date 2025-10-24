import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import PlayerCard from "@/components/PlayerCard";
import { supabase } from "@/lib/supabase";

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

const fetchPlayers = async () => {
  const { data, error } = await supabase.from("players").select("*");
  if (error) throw new Error(error.message);
  return data;
};

const Players = () => {
  const [sortKey, setSortKey] = useState("Overall Rating");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [selectedTeam, setSelectedTeam] = useState("All");

  const { data: allPlayers = [], isLoading, error } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });

  // Extract unique teams for dropdown
  const teams = useMemo(() => {
    const teamNames = Array.from(new Set(allPlayers.map((p: any) => p.team).filter(Boolean)));
    return ["All", ...teamNames];
  }, [allPlayers]);

  // Filter + search
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = selectedTeam === "All" || player.team === selectedTeam;
      return matchesSearch && matchesTeam;
    });
  }, [allPlayers, search, selectedTeam]);

  // Sorting logic
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      if (sortKey === "Overall Rating") return getOverallRating(b) - getOverallRating(a);
      if (sortKey === "+/-") return (b.plus_minus || 0) - (a.plus_minus || 0);
      if (sortKey === "Games Played") return (b.games_played || 0) - (a.games_played || 0);
      return (b.stats?.[sortKey] || 0) - (a.stats?.[sortKey] || 0);
    });
  }, [filteredPlayers, sortKey]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-4 items-center justify-center">
        <Input
          type="text"
          placeholder="Search for a player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        {/* Team Filter Dropdown */}
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort + View Toggle */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
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

        <div className="flex gap-2">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="w-4 h-4 mr-1" /> Card View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-1" /> List View
          </Button>
        </div>
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
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-700 rounded-md text-gray-200">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Team</th>
                  <th className="p-2 text-left">Position</th>
                  <th className="p-2 text-left">+/-</th>
                  <th className="p-2 text-left">Games Played</th>
                  <th className="p-2 text-left">Overall</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className="border-t border-gray-800 hover:bg-gray-800 transition-colors"
                  >
                    <td className="p-2">{player.name}</td>
                    <td className="p-2">{player.team}</td>
                    <td className="p-2">{player.position}</td>
                    <td className="p-2">{player.plus_minus ?? 0}</td>
                    <td className="p-2">{player.games_played ?? 0}</td>
                    <td className="p-2">{getOverallRating(player)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
