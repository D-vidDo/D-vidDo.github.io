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
          ${teamA.color},
          ${teamA.color}80,
          rgba(0,0,0,.08),
          ${teamB.color}80,
          ${teamB.color}
        )`,
      }}
    >
      <Card className="border-0 bg-white text-slate-900 rounded-[22px] overflow-hidden">
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
                      <span className="text-amber-400">•</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TEAM A */}
          <div className="order-2 2xl:order-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <img
                src={teamA.logo}
                alt={teamA.name}
                className="
                  w-8 h-8
                  md:w-12 md:h-12
                  object-contain
                  shrink-0
                "
                style={{
                  filter: `drop-shadow(0 0 8px ${teamA.color})`,
                }}
              />

              <div className="min-w-0">
                <h2
                  className="
                    font-black
                    uppercase
                    truncate
                    text-sm
                    md:text-xl
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
              {teamA.players.map((player, index) => (
                <div
                  key={player}
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
                    {index + 1}
                  </div>

                  <span className="text-xs md:text-sm flex-1 truncate">
                    {player}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM B */}
          <div className="order-3 min-w-0">
            <div className="flex items-center justify-end gap-2 mb-3">
              <div className="text-right min-w-0">
                <h2
                  className="
                    font-black
                    uppercase
                    truncate
                    text-sm
                    md:text-xl
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

              <img
                src={teamB.logo}
                alt={teamB.name}
                className="
                  w-8 h-8
                  md:w-12 md:h-12
                  object-contain
                  shrink-0
                "
                style={{
                  filter: `drop-shadow(0 0 8px ${teamB.color})`,
                }}
              />
            </div>

            <div className="space-y-1">
              {teamB.players.map((player, index) => (
                <div
                  key={player}
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
                    {player}
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
                    {index + 1}
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