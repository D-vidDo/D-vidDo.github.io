import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockTrades } from "@/data/mockData";

const DraftAndTrades = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">
      {/* Draft Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">The Draft</CardTitle>
        </CardHeader>
        <CardContent>
          {mockTrades
            .find(trade => trade.id === "1")
            ?.playersTraded.map((pt, idx) => (
              <div key={idx} className="py-2 text-sm">
                <span className="font-bold">{pt.toTeam}</span> has drafted <span className="font-bold">{pt.player.name}</span>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Trades Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {mockTrades
            .filter(trade => trade.id !== "1")
            .map(trade =>
              trade.playersTraded.map((pt, idx) => (
                <div key={trade.id + idx} className="py-2 text-sm">
                  <span className="font-bold">{pt.toTeam}</span> has acquired <span className="font-bold">{pt.player.name}</span> from <span className="font-bold">{pt.fromTeam}</span>
                </div>
              ))
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DraftAndTrades;