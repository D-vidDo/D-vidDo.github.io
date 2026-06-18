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
  const [timeValue, period] = time.split(" ");

  return (
    <div
      className="w-full rounded-3xl p-[2px] overflow-hidden"
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
      <Card className="border-0 bg-slate-950 rounded-[22px] overflow-hidden">
        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-[1fr_auto_1fr]
            gap-6
            p-4
            md:p-6
            lg:p-8
            items-start
          "
        >
          {/* TEAM A */}
          <div className="order-2 xl:order-1 min-w-0">
            <div className="flex items-center gap-3 md:gap-4 mb-6">
              <img
                src={teamA.logo}
                alt={teamA.name}
                className="
                  w-12 h-12
                  md:w-16 md:h-16
                  lg:w-20 lg:h-20
                  object-contain
                  shrink-0
                "
                style={{
                  filter: `drop-shadow(0 0 12px ${teamA.color})`,
                }}
              />

              <div className="min-w-0">
                <h2
                  className="
                    text-xl
                    md:text-2xl
                    lg:text-4xl
                    font-black
                    uppercase
                    tracking-wide
                    truncate
                  "
                  style={{
                    color: teamA.color,
                    textShadow: `0 0 20px ${teamA.color}55`,
                  }}
                >
                  {teamA.name}
                </h2>

                <p className="text-sm md:text-base text-muted-foreground">
                  {teamA.record} Record
                </p>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {teamA.players.map((player, i) => (
                <div
                  key={player}
                  className="
                    flex
                    items-center
                    gap-3
                    border-b
                    border-white/10
                    pb-3
                  "
                >
                  <div
                    className="
                      w-8 h-8
                      md:w-10 md:h-10
                      rounded-full
                      flex
                      items-center
                      justify-center
                      font-bold
                      shrink-0
                    "
                    style={{
                      border: `1px solid ${teamA.color}`,
                      color: teamA.color,
                    }}
                  >
                    {i + 1}
                  </div>

                  <span className="text-sm md:text-lg lg:text-xl truncate">
                    {player}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER BADGE */}
          <div className="order-1 xl:order-2 flex justify-center">
            <div
              className="
                w-full
                max-w-[320px]
                rounded-[28px]
                md:rounded-[36px]
                border
                border-white/10
                bg-white/[0.03]
                backdrop-blur-sm
                p-4
                md:p-6
                lg:p-8
                shadow-2xl
              "
            >
              <div className="flex justify-center mb-4">
                <div
                  className="
                    w-12 h-12
                    md:w-16 md:h-16
                    rounded-full
                    bg-white/10
                    flex
                    items-center
                    justify-center
                    text-2xl
                    md:text-3xl
                  "
                >
                  🏐
                </div>
              </div>

              <div className="text-center">
                <div
                  className="
                    text-4xl
                    md:text-5xl
                    lg:text-7xl
                    font-black
                    leading-none
                  "
                >
                  {timeValue}
                </div>

                <div
                  className="
                    text-lg
                    md:text-2xl
                    lg:text-3xl
                    font-semibold
                    mt-1
                  "
                >
                  {period}
                </div>
              </div>

              <div className="my-4 md:my-6 border-t border-white/10" />

              <div
                className="
                  text-center
                  text-muted-foreground
                  tracking-[0.25em]
                  text-xs
                  md:text-sm
                "
              >
                COURTS
              </div>

              <div className="mt-4 flex justify-center items-center gap-3 md:gap-6 flex-wrap">
                {courts.map((court, i) => (
                  <div key={court} className="flex items-center gap-3">
                    <div
                      className="
                        text-2xl
                        md:text-4xl
                        lg:text-5xl
                        font-black
                      "
                    >
                      {court}
                    </div>

                    {i !== courts.length - 1 && (
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-amber-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TEAM B */}
          <div className="order-3 min-w-0">
            <div className="flex items-center justify-end gap-3 md:gap-4 mb-6">
              <div className="text-right min-w-0">
                <h2
                  className="
                    text-xl
                    md:text-2xl
                    lg:text-4xl
                    font-black
                    uppercase
                    tracking-wide
                    truncate
                  "
                  style={{
                    color: teamB.color,
                    textShadow: `0 0 20px ${teamB.color}55`,
                  }}
                >
                  {teamB.name}
                </h2>

                <p className="text-sm md:text-base text-muted-foreground">
                  {teamB.record} Record
                </p>
              </div>

              <img
                src={teamB.logo}
                alt={teamB.name}
                className="
                  w-12 h-12
                  md:w-16 md:h-16
                  lg:w-20 lg:h-20
                  object-contain
                  shrink-0
                "
                style={{
                  filter: `drop-shadow(0 0 12px ${teamB.color})`,
                }}
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              {teamB.players.map((player, i) => (
                <div
                  key={player}
                  className="
                    flex
                    items-center
                    justify-end
                    gap-3
                    border-b
                    border-white/10
                    pb-3
                  "
                >
                  <span className="text-sm md:text-lg lg:text-xl truncate">
                    {player}
                  </span>

                  <div
                    className="
                      w-8 h-8
                      md:w-10 md:h-10
                      rounded-full
                      flex
                      items-center
                      justify-center
                      font-bold
                      shrink-0
                    "
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