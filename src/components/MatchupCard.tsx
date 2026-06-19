import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface MatchupCardProps {
  matchupId: number;
}

interface PlayerData {
  name: string;
  jerseyNumber: string | null;
}

interface TeamData {
  name: string;
  logo: string;
  color: string;
  record: string;
  players: PlayerData[];
}

export default function MatchupCard({ matchupId }: MatchupCardProps) {
  const [teamA, setTeamA] = useState<TeamData | null>(null);
  const [teamB, setTeamB] = useState<TeamData | null>(null);
  const [time, setTime] = useState("");
  const [courts, setCourts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatchup() {
      try {
        const { data: matchup, error } = await supabase
          .from("trios_matchups")
          .select(
            `
            id,
            game_ids,

            teamA:teams!trios_matchups_team_a_fkey(
              team_id,
              name,
              color,
              wins,
              losses,
              player_ids
            ),

            teamB:teams!trios_matchups_team_b_fkey(
              team_id,
              name,
              color,
              wins,
              losses,
              player_ids
            )
          `,
          )
          .eq("id", matchupId)
          .single();

        if (error) throw error;

        async function fetchPlayers(playerIds: number[]) {
          if (!playerIds || playerIds.length === 0) {
            return [];
          }

        const { data, error } = await supabase
  .from("players")
  .select("id, name, display_name, jersey_number")
  .in("id", playerIds);

if (error) throw error;

return (
  data?.map((player) => ({
    name: player.display_name || player.name,
    jerseyNumber: player.jersey_number,
  })) || []
);
        }

        const teamAPlayers = await fetchPlayers(matchup.teamA.player_ids);

        const teamBPlayers = await fetchPlayers(matchup.teamB.player_ids);

setTeamA({
  name: matchup.teamA.name,
  logo: `/logos/${matchup.teamA.team_id}.png`,
  color: matchup.teamA.color || "#64748b",
  record: `${matchup.teamA.wins}-${matchup.teamA.losses}`,
  players: teamAPlayers,
});

setTeamB({
  name: matchup.teamB.name,
  logo: `/logos/${matchup.teamB.team_id}.png`,
  color: matchup.teamB.color || "#64748b",
  record: `${matchup.teamB.wins}-${matchup.teamB.losses}`,
  players: teamBPlayers,
});

        // Load games for time + courts
        const gameIds = matchup.game_ids || [];

        if (gameIds.length > 0) {
          const { data: games, error: gamesError } = await supabase
            .from("games")
            .select("time, court")
            .in("id", gameIds);

          if (gamesError) throw gamesError;

          if (games && games.length > 0) {
            const firstGameTime = games[0].time;

            if (firstGameTime) {
              const formattedTime = new Date(
                `2000-01-01T${firstGameTime}`,
              ).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });

              setTime(formattedTime);
            }

            setCourts(games.map((game) => game.court).filter(Boolean));
          }
        }
      } catch (error) {
        console.error("Error fetching matchup:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatchup();
  }, [matchupId]);

  if (loading) {
    return <Card className="p-6">Loading matchup...</Card>;
  }

  if (!teamA || !teamB) {
    return null;
  }

  const [timeValue, period] = time.split(" ");

  return (
    <div
      className="relative w-full rounded-3xl shadow-lg"
      style={{
        background: `linear-gradient(
        90deg,
        ${teamA.color},
        ${teamA.color}aa,
        rgba(255,255,255,0.7),
        ${teamB.color}aa,
        ${teamB.color}
      )`,
        padding: "6px",
      }}
    >
      <Card
        className="
        relative
        border-0
        bg-white
        text-slate-900
        rounded-[22px]
        overflow-hidden
      "
      >
        <div
          className="
            grid
            grid-cols-2
            2xl:grid-cols-[1fr_120px_1fr]
            gap-3
            md:gap-4
            p-3
            md:p-4
          "
        >
          {/* MATCH INFO */}

          <div
            className="
              col-span-2
              2xl:col-span-1
              order-1
              2xl:order-2
              flex
              justify-center
            "
          >
            <div
              className="
                w-full
                max-w-[220px]
                2xl:max-w-[120px]
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-2
                text-center
                shadow-sm
              "
            >
              <div
                className="
                  font-black
                  text-lg
                  md:text-xl
                  2xl:text-2xl
                  leading-none
                "
              >
                {timeValue}
              </div>

              <div className="text-xs font-semibold text-slate-500">
                {period}
              </div>

              <div className="my-2 border-t border-slate-200" />

              <div className="text-[10px] tracking-[0.25em] text-slate-500">
                COURTS
              </div>

              <div className="flex justify-center gap-2 mt-1 flex-wrap">
                {courts.map((court, index) => (
                  <div key={court} className="flex items-center gap-2">
                    <span className="text-base md:text-lg font-black">
                      {court}
                    </span>

                    {index !== courts.length - 1 && (
                      <span className="text-amber-400">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TEAM A */}

          <div className="order-2 2xl:order-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="min-w-0 max-w-full">
                <h2
                  className="
  font-black
  uppercase
  break-words
  text-sm
  md:text-lg
  2xl:text-xl
  leading-tight
"
                  style={{
                    color: teamA.color,
                  }}
                >
                  {teamA.name}
                </h2>

                <p className="text-[10px] md:text-xs text-slate-500">
                  {teamA.record}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {teamA.players.map((player) => (
                <div
                  key={player.name}
                  className="
                    flex
                    items-center
                    gap-2
                    border-b
                    border-slate-200
                    pb-1
                    min-w-0
                  "
                >
                  <div
                    className="
                      w-5 h-5
                      md:w-6 md:h-6
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-[9px]
                      font-bold
                      shrink-0
                    "
                    style={{
                      border: `1px solid ${teamA.color}`,
                      color: teamA.color,
                    }}
                  >
                    {player.jerseyNumber || "-"}
                  </div>

                  <span className="text-xs md:text-sm flex-1 truncate">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM B */}

          <div className="order-3 min-w-0">
            <div className="flex items-center justify-end gap-2 mb-3">
              <div className="text-right min-w-0 max-w-full">
                <h2
                  className="
  font-black
  uppercase
  break-words
  text-sm
  md:text-lg
  2xl:text-xl
  leading-tight
"
                  style={{
                    color: teamB.color,
                  }}
                >
                  {teamB.name}
                </h2>

                <p className="text-[10px] md:text-xs text-slate-500">
                  {teamB.record}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {teamB.players.map((player) => (
                <div
                  key={player.name}
                  className="
                    flex
                    items-center
                    justify-end
                    gap-2
                    border-b
                    border-slate-200
                    pb-1
                    min-w-0
                  "
                >
                  <span className="text-xs md:text-sm flex-1 truncate text-right">
                    {player.name}
                  </span>

                  <div
                    className="
                      w-5 h-5
                      md:w-6 md:h-6
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-[9px]
                      font-bold
                      shrink-0
                    "
                    style={{
                      border: `1px solid ${teamB.color}`,
                      color: teamB.color,
                    }}
                  >
                    {player.jerseyNumber || "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
