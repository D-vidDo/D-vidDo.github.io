import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PlayerCard from "@/components/PlayerCard";
import { allPlayers } from "@/data/mockData";

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
];

const getOverallRating = (player) =>
  Math.min(
    Object.values(player.stats).reduce((sum, val) => sum + val, 0) * 2,
    100
  );

const Players = () => {
  const [sortKey, setSortKey] = useState("Overall Rating");

  const sortedPlayers = [...allPlayers].sort((a, b) => {
    if (sortKey === "Overall Rating") {
      return getOverallRating(b) - getOverallRating(a);
    }
    return b.stats[sortKey] - a.stats[sortKey];
  });

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

      {/* Sort buttons in white space */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center gap-2 justify-center bg-background">
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {sortedPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} sortKey={sortKey} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Players;