import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Repeat, CalendarDays, Trophy, ClipboardList, Star } from "lucide-react";

const Rules = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              League Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Team Structure
              </h2>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>3 teams, each with 6 players</li>
                <li>Each team must have at least 2 female players</li>
                <li>1 captain per team, who remains on their team for the entire season</li>
                <ul className="list-inside ml-4">
                  <li>Vincent</li>
                  <li>Justin</li>
                  <li>Jaydon</li>
                </ul>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Repeat className="h-5 w-5 text-muted-foreground" />
                Draft
              </h2>
              <h3 className="font-semibold mt-2">Pre-Season Draft</h3>
              <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                <li>Team Captains will draft from an anonymous list of players before the season start</li>
                <li>Players in the pool will only be identified by their player card which shows the following:</li>
                <ul className="list-inside ml-4">
                  <li>Gender</li>
                  <li>Position (Primary & Secondary)</li>
                  <li>Rating</li>
                </ul>
                <li>Draft order will be determined randomly and will be done serpentine style</li>
              </ul>

              <h3 className="font-semibold mt-4">Re-Tier Drafts</h3>
              <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                <li>All players will re-enter the draft pool at each new schedule except for the retained players of the winning team</li>
                <li>The winning team will have the first pick in the re-draft, second highest win/loss ratio will have second, and so forth</li>
                <li>These drafts will not be anonymous</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                Every Re-Tier = 1 “Schedule”
              </h2>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>All non-captain players re-enter the draft pool</li>
                <li>Captains stay with their original team</li>
                <li>Redraft happens, selecting from the full player pool</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                Winning Incentive
              </h2>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>At the end of each re-tier, the team with the highest win/loss ratio can:</li>
                <ul className="list-inside ml-4">
                  <li>Retain up to 2 players from their current roster</li>
                </ul>
                <li>The team with the second highest win/loss ratio can:</li>
                <ul className="list-inside ml-4">
                  <li>Retain 1 player from their current roster</li>
                </ul>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                Retention Rules
              </h2>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>The retained players stay with the captain for the next schedule</li>
                <li>Players can only be retained for 2 consecutive schedules, then must re-enter the draft pool</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                Awards
              </h2>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>At the end of the season, awards will be voted on by each player. Awards below:</li>
                <ul className="list-inside ml-4">
                  <li>Most Valuable Player</li>
                  <li>Defensive Player of the Year</li>
                  <li>Most Improved Player</li>
                  <li>Best Sportsmanship</li>
                  <li>Best Plus Minus</li>
                </ul>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Rules;
