import { Card } from "@/components/ui/card";

interface MatchupCardProps {
  teamA: {
    name: string;
    logo: string;
    color: string;
    record: string;
    players: string[];
  };
  teamB: {
    name: string;
    logo: string;
    color: string;
    record: string;
    players: string[];
  };
  time: string;
  courts: number[];
}

export default function MatchupCard({
  teamA,
  teamB,
  time,
  courts,
}: MatchupCardProps) {
  return (
    <div
      className="rounded-3xl p-[2px]"
      style={{
        background: `linear-gradient(
          90deg,
          ${teamA.color} 0%,
          ${teamA.color}80 35%,
          rgba(255,255,255,.15) 50%,
          ${teamB.color}80 65%,
          ${teamB.color} 100%
        )`,
      }}
    >
      <Card className="bg-slate-950 border-0 rounded-[22px] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-8 p-8 items-start">

          {/* TEAM A */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <img
                src={teamA.logo}
                alt={teamA.name}
                className="w-20 h-20 object-contain"
              />

              <div>
                <h2
                  className="text-4xl font-black uppercase tracking-wide"
                  style={{ color: teamA.color }}
                >
                  {teamA.name}
                </h2>

                <p className="text-muted-foreground">
                  {teamA.record} Record
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {teamA.players.map((player, i) => (
                <div
                  key={player}
                  className="flex items-center gap-4 border-b border-white/10 pb-4"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{
                      border: `1px solid ${teamA.color}`,
                      color: teamA.color,
                    }}
                  >
                    {i + 1}
                  </div>

                  <span className="text-2xl">{player}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER BADGE */}
          <div className="flex justify-center">
            <div className="w-[280px] rounded-[36px] border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl">

              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">
                  🏐
                </div>
              </div>

              <div className="text-center">
                <div className="text-7xl font-black leading-none">
                  {time.split(" ")[0]}
                </div>

                <div className="text-3xl font-semibold mt-1">
                  {time.split(" ")[1]}
                </div>
              </div>

              <div className="my-6 border-t border-white/10" />

              <div className="text-center text-muted-foreground tracking-[.25em] text-sm">
                COURTS
              </div>

              <div className="mt-4 flex justify-center items-center gap-6">
                {courts.map((court, i) => (
                  <>
                    <div
                      key={court}
                      className="text-5xl font-black"
                    >
                      {court}
                    </div>

                    {i !== courts.length - 1 && (
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                    )}
                  </>
                ))}
              </div>
            </div>
          </div>

          {/* TEAM B */}
          <div>
            <div className="flex items-center justify-end gap-4 mb-8">
              <div className="text-right">
                <h2
                  className="text-4xl font-black uppercase tracking-wide"
                  style={{ color: teamB.color }}
                >
                  {teamB.name}
                </h2>

                <p className="text-muted-foreground">
                  {teamB.record} Record
                </p>
              </div>

              <img
                src={teamB.logo}
                alt={teamB.name}
                className="w-20 h-20 object-contain"
              />
            </div>

            <div className="space-y-5">
              {teamB.players.map((player, i) => (
                <div
                  key={player}
                  className="flex items-center justify-end gap-4 border-b border-white/10 pb-4"
                >
                  <span className="text-2xl">{player}</span>

                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{
                      border: `1px solid ${teamB.color}`,
                      color: teamB.color,
                    }}
                  >
                    {i + 1}
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