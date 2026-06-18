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
      <Card className="border-0 bg-white text-slate-950 rounded-[22px] overflow-hidden">
        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-[minmax(0,1fr)_minmax(170px,260px)_minmax(0,1fr)]
            gap-4
            md:gap-6
            p-4
            md:p-6
            lg:p-8
            items-center
          "
        >

          {/* TEAM A */}
          <div className="order-2 lg:order-1 min-w-0">

            <div className="flex items-center gap-3 mb-5">
              <img
                src={teamA.logo}
                alt={teamA.name}
                className="
                  w-10 h-10
                  sm:w-12 sm:h-12
                  md:w-16 md:h-16
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
                    font-black
                    uppercase
                    tracking-wide
                    truncate
                    text-[clamp(1.1rem,2vw,2.5rem)]
                  "
                  style={{
                    color: teamA.color,
                    textShadow: `0 0 20px ${teamA.color}55`,
                  }}
                >
                  {teamA.name}
                </h2>

                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  {teamA.record} Record
                </p>
              </div>
            </div>


            <div className="space-y-3">
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
                    min-w-0
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
                      border:`1px solid ${teamA.color}`,
                      color:teamA.color,
                    }}
                  >
                    {i + 1}
                  </div>

                  <span className="
                    truncate
                    text-sm
                    md:text-lg
                  ">
                    {player}
                  </span>
                </div>
              ))}
            </div>
          </div>



          {/* CENTER */}
          <div className="
            order-1
            lg:order-2
            w-full
            min-w-0
            flex
            justify-center
          ">
            <div
              className="
                w-full
                rounded-[28px]
                border
                border-white/10
                bg-white/[0.03]
                backdrop-blur-sm
                p-3
                sm:p-4
                md:p-5
                shadow-2xl
              "
            >

              <div className="flex justify-center mb-3">
                <div
                  className="
                    w-10 h-10
                    sm:w-12 sm:h-12
                    rounded-full
                    bg-white/10
                    flex
                    items-center
                    justify-center
                    text-xl
                    sm:text-2xl
                  "
                >
                  🏐
                </div>
              </div>


              <div className="text-center">

                <div
                  className="
                    font-black
                    leading-none
                    text-[clamp(2rem,5vw,4rem)]
                  "
                >
                  {timeValue}
                </div>


                <div
                  className="
                    font-semibold
                    text-[clamp(1rem,2vw,1.75rem)]
                  "
                >
                  {period}
                </div>

              </div>


              <div className="my-4 border-t border-white/10" />


              <div
                className="
                  text-center
                  text-muted-foreground
                  tracking-[0.25em]
                  text-[10px]
                  md:text-xs
                "
              >
                COURTS
              </div>


              <div
                className="
                  mt-3
                  flex
                  justify-center
                  items-center
                  flex-wrap
                  gap-2
                "
              >
                {courts.map((court, i) => (
                  <div
                    key={court}
                    className="flex items-center gap-2"
                  >

                    <div
                      className="
                        font-black
                        text-[clamp(1.5rem,3vw,3rem)]
                      "
                    >
                      {court}
                    </div>


                    {i !== courts.length - 1 && (
                      <div
                        className="
                          w-2
                          h-2
                          rounded-full
                          bg-amber-400
                        "
                      />
                    )}

                  </div>
                ))}
              </div>

            </div>
          </div>




          {/* TEAM B */}
          <div className="order-3 min-w-0">

            <div className="
              flex
              items-center
              justify-end
              gap-3
              mb-5
            ">

              <div className="text-right min-w-0">

                <h2
                  className="
                    font-black
                    uppercase
                    tracking-wide
                    truncate
                    text-[clamp(1.1rem,2vw,2.5rem)]
                  "
                  style={{
                    color:teamB.color,
                    textShadow:`0 0 20px ${teamB.color}55`,
                  }}
                >
                  {teamB.name}
                </h2>

                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  {teamB.record} Record
                </p>

              </div>


              <img
                src={teamB.logo}
                alt={teamB.name}
                className="
                  w-10 h-10
                  sm:w-12 sm:h-12
                  md:w-16 md:h-16
                  object-contain
                  shrink-0
                "
                style={{
                  filter:`drop-shadow(0 0 12px ${teamB.color})`,
                }}
              />

            </div>



            <div className="space-y-3">

              {teamB.players.map((player,i)=>(
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
                    min-w-0
                  "
                >

                  <span className="
                    truncate
                    text-sm
                    md:text-lg
                  ">
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
                      border:`1px solid ${teamB.color}`,
                      color:teamB.color,
                    }}
                  >
                    {i+1}
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