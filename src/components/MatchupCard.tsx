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
          rgba(0,0,0,.1),
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
            lg:grid-cols-[1fr_160px_1fr]
            gap-4
            md:gap-6
            p-4
            md:p-6
          "
        >
          {/* TEAM A */}
          <div className="order-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <img
                src={teamA.logo}
                alt={teamA.name}
                className="
                  w-10 h-10
                  md:w-14 md:h-14
                  object-contain
                  shrink-0
                "
                style={{
                  filter: `drop-shadow(0 0 10px ${teamA.color})`,
                }}
              />

              <div className="min-w-0">
                <h2
                  className="
                    font-black
                    uppercase
                    truncate
                    text-lg
                    md:text-2xl
                  "
                  style={{
                    color: teamA.color,
                  }}
                >
                  {teamA.name}
                </h2>

                <p className="text-xs md:text-sm text-slate-500">
                  {teamA.record} Record
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {teamA.players.map((player, index) => (
                <div
                  key={player}
                  className="
                    flex
                    items-center
                    gap-2
                    border-b
                    border-slate-200
                    pb-2
                  "
                >
                  <div
                    className="
                      w-7
                      h-7
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-xs
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

                  <span className="text-sm truncate">{player}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM B */}
          <div className="order-2 min-w-0 lg:order-3">
            <div
              className="
              flex
              items-center
              justify-end
              gap-2
              mb-4
            "
            >
              <div className="text-right min-w-0">
                <h2
                  className="
                    font-black
                    uppercase
                    truncate
                    text-lg
                    md:text-2xl
                  "
                  style={{
                    color: teamB.color,
                  }}
                >
                  {teamB.name}
                </h2>

                <p className="text-xs md:text-sm text-slate-500">
                  {teamB.record} Record
                </p>
              </div>

              <img
                src={teamB.logo}
                alt={teamB.name}
                className="
                  w-10 h-10
                  md:w-14 md:h-14
                  object-contain
                  shrink-0
                "
                style={{
                  filter: `drop-shadow(0 0 10px ${teamB.color})`,
                }}
              />
            </div>

            <div className="space-y-2">
              {teamB.players.map((player, index) => (
                <div
                  key={player}
                  className="
                    flex
                    justify-end
                    items-center
                    gap-2
                    border-b
                    border-slate-200
                    pb-2
                  "
                >
                  <span className="text-sm truncate">{player}</span>

                  <div
                    className="
                      w-7
                      h-7
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-xs
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

          {/* CENTER INFO */}
          <div
            className="
              col-span-2
              lg:col-span-1
              order-3
              lg:order-2
              flex
              items-center
              justify-center
            "
          >
            <div
              className="
                w-full
                lg:w-[150px]
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-3
                text-center
                shadow-sm
              "
            >
              <div
                className="
                  font-black
                  text-2xl
                  md:text-3xl
                  lg:text-4xl
                  leading-none
                "
              >
                {timeValue}
              </div>

              <div
                className="
                  text-sm
                  md:text-base
                  font-semibold
                  text-slate-500
                "
              >
                {period}
              </div>

              <div className="my-3 border-t border-slate-200" />

              <div
                className="
                  text-[10px]
                  tracking-[0.25em]
                  text-slate-500
                "
              >
                COURTS
              </div>

              <div
                className="
                  flex
                  justify-center
                  gap-2
                  mt-2
                "
              >
                {courts.map((court, index) => (
                  <div key={court} className="flex items-center gap-2">
                    <span
                      className="
                        text-xl
                        md:text-2xl
                        font-black
                      "
                    >
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
        </div>
      </Card>
    </div>
  );
}
