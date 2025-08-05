import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeftRight, FileText } from "lucide-react";
import { useLeague } from "@/context/LeagueContext";

const Trades = () => {
  const { trades } = useLeague();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Trade History
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-6">
            Complete record of all player movements and trades
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <FileText className="mr-2 h-4 w-4" />
            {trades.length} Total Trades
          </Badge>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {trades.length > 0 ? (
          <div className="space-y-6">
            {trades.map((trade) => (
              <Card key={trade.id} className="bg-gradient-card shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-primary" />
                      Trade Record
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(trade.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trade Details */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-card-foreground font-medium">{trade.description}</p>
                  </div>

                  {/* Players Traded */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Players Involved
                    </h4>
                    {trade.playersTraded.map((playerTrade, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-stats rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="font-semibold text-card-foreground">
                              {playerTrade.player.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {playerTrade.player.position}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{playerTrade.fromTeam}</Badge>
                          <ArrowLeftRight className="h-3 w-3 text-primary" />
                          <Badge variant="outline">{playerTrade.toTeam}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ArrowLeftRight className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No trades yet</h3>
            <p className="text-muted-foreground">Trade history will appear here when players are moved between teams</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trades;