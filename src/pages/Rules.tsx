import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Repeat, CalendarDays, Trophy, ClipboardList, Star, Clock } from "lucide-react";

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
  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
    <Clock className="h-4 w-4" />
    <span>Last updated on September 8, 2025</span>
  </div>
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
              <h3 className="font-semibold mt-2">Pre-Season Random Draft</h3>
              <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                <li>Teams will be randomly generated at the start of the season</li>
                {/* <li>Players in the pool will only be identified by their player card which shows the following:</li>
                <ul className="list-inside ml-4">
                  <li>Gender</li>
                  <li>Position (Primary & Secondary)</li>
                  <li>Rating</li>
                </ul> */}
                {/* <li>Draft order will be determined randomly and will be done serpentine style</li> */}
              </ul>

              <h3 className="font-semibold mt-4">Re-Tier Drafts</h3>
              <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                <li>All players will re-enter the draft pool at each new schedule except for the retained players as explained in the next section</li>
                <li>The last place team will have the first pick in the re-draft, second highest win/loss ratio will have second, and so forth</li>
                <li>The draft will be anonymously made, only the team captains will know the draft order.</li>
                <ul className="list-inside ml-4">
                  <li>Captains will privately do the draft with the commissioner</li>
                  <li>Each captain will take turns making a pick, following the draft order as outlined by the commissioner</li>
                  <li>Picks will be made until 3 teams of 6 have been made</li>
                  <li>Teams will be revealed at the end of the draft. No indication of draft order will be seen</li>
                </ul>
                {/* <li>Only when the 1st re-tier draft is finished, will the stat ratings be visible to all. Until then, only the Overall Rating score will be visible for each player</li> */}
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
                <li>Captains stay with their original team for the entirety of the season</li>
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
                <li>At the end of each schedule, the team with the highest win/loss ratio can:</li>
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
                <li>First pick cannot use their first pick on the player as their last split first pick. (This is considered retaining for 2 consecutive schedules.)</li>
              </ul>
            </section>

            <Separator />

            <section>
  <h2 className="text-xl font-semibold flex items-center gap-2">
    <ClipboardList className="h-5 w-5 text-muted-foreground" />
    Score Weighting
  </h2>
  <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
    <li>
      To make stats fair between players with different numbers of games, we use a <strong>weighted +/-</strong> system.
    </li>
    <li>
      The formula is: <code>Weighted +/- = Total +/- × √(Games Played)</code>
    </li>
    <li>
      This gives a small boost to players who have played more games while keeping averages from short-term players from being too inflated.
    </li>
    <li>
      Example: A player with +12 over 9 games scores <code>12 × √9 = 36</code>, while another with +12 over 4 games scores <code>12 × √4 = 24</code>.
    </li>
    <li>
      This helps reward consistency and participation, not just one lucky game.
    </li>
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
