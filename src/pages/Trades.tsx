import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowLeftRight, FileText } from "lucide-react";

interface Trade {
  id: number;
  date: string;
  description: string;
  playersTraded: {
    from_team: string;
    to_team: string;
    player: {
      id: number;
      name: string;
      position: string;
    };
  }[];
}

// ============================================================
// TEAM COLORS
// ============================================================

const teamColorMap: Record<string, string> = {
  // Previous teams
  "Brawl Luu": "#a22418",
  "Balls Luu": "#5f1077",
  "Bull Luu": "#f77418",
  Boscoball: "#2A9D8F",
  "Rufus' Doofuses": "#457B9D",
  "Sally Gang": "#E63946",

  // Season 4 teams
  "Phở-lippines": "#EF0107",
  "Sweet Spaghetti Spikers": "#A81C07",
  "Cucking Kirkified Coolies": "#f7cfb4",
  "Hoang Bao": "#FF69B4",
  "Big Bad Bitties": "#99ccff",
  ATAK: "#50314c",

  // Season 5 teams
  "Barangay Blockers": "#5974D9",
  "Puto Party": "#97E378",
  "Sisig Spikers": "#FF3300",
};

const getTeamColorByName = (teamName: string) => {
  return teamColorMap[teamName] || "#6b7280";
};

// ============================================================
// HELPERS
// ============================================================

const formatDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);

  if (isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const Trades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from("trades")
        .select(`
          id,
          date,
          description,
          players_traded (
            id,
            from_team,
            to_team,
            player:player_id (
              id,
              name,
              primary_position
            )
          )
        `)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching trades:", error);
        setLoading(false);
        return;
      }

      const formatted: Trade[] = (data ?? []).map((trade: any) => ({
        id: trade.id,
        date: trade.date,
        description: trade.description,
        playersTraded: (trade.players_traded ?? []).map((pt: any) => ({
          from_team: pt.from_team,
          to_team: pt.to_team,
          player: {
            id: pt.player.id,
            name: pt.player.name,
            position: pt.player.primary_position,
          },
        })),
      }));

      setTrades(formatted);
      setLoading(false);
    };

    fetchTrades();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f5f7] text-black dark:bg-[#050506] dark:text-white">

      {/* ======================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Orange glow */}
        <div
          className="
            absolute
            -top-40
            left-[15%]
            h-[400px]
            w-[400px]
            rounded-full
            bg-orange-400/[0.10]
            blur-[120px]
            md:h-[550px]
            md:w-[550px]
          "
        />

        {/* Blue glow */}
        <div
          className="
            absolute
            top-[30%]
            -right-40
            h-[450px]
            w-[450px]
            rounded-full
            bg-blue-400/[0.09]
            blur-[130px]
            md:h-[600px]
            md:w-[600px]
          "
        />

        {/* Purple glow */}
        <div
          className="
            absolute
            bottom-0
            left-0
            h-[350px]
            w-[350px]
            rounded-full
            bg-purple-400/[0.06]
            blur-[120px]
          "
        />
      </div>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative px-4 pt-5 md:pt-8">
        <div
          className="
            relative
            mx-auto
            max-w-6xl
            overflow-hidden
            rounded-[30px]
            border
            border-white/30
            shadow-[0_25px_80px_rgba(0,0,0,0.12)]
            md:rounded-[42px]
          "
          style={{
            background: `
              linear-gradient(
                135deg,
                rgba(249,115,22,0.92) 0%,
                rgba(59,130,246,0.88) 100%
              )
            `,
          }}
        >
          {/* Glass highlight */}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-black/10" />

          {/* Top glow */}

          <div className="pointer-events-none absolute -right-32 -top-40 h-[400px] w-[400px] rounded-full bg-white/20 blur-[100px]" />

          {/* Bottom glow */}

          <div className="pointer-events-none absolute -bottom-48 -left-24 h-[400px] w-[400px] rounded-full bg-white/10 blur-[110px]" />

          <div className="relative px-5 py-9 text-center md:px-10 md:py-14">

            {/* Icon */}

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-2xl backdrop-blur-xl md:h-16 md:w-16 md:rounded-3xl">
              <ArrowLeftRight className="h-6 w-6 text-white md:h-7 md:w-7" />
            </div>

            {/* Label */}

            <div className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 backdrop-blur-xl">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-white/90 md:text-[11px]">
                LEAGUE HISTORY
              </span>
            </div>

            {/* Title */}

            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              Draft History
            </h1>

            {/* Subtitle */}

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/75 md:text-lg">
              Complete record of player movements, trades, and roster changes.
            </p>

            {/* Count */}

            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-xl">
                <FileText className="h-4 w-4" />

                {loading
                  ? "Loading..."
                  : `${trades.length} ${
                      trades.length === 1 ? "Redraft" : "Redrafts"
                    }`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="relative mx-auto max-w-5xl px-3 py-7 md:px-4 md:py-12">

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">

              <div className="relative mx-auto mb-5 h-12 w-12">
                <div className="absolute inset-0 rounded-full border-[3px] border-black/5 dark:border-white/10" />

                <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-black dark:border-t-white" />
              </div>

              <p className="text-sm text-black/45 dark:text-white/45">
                Loading trade history…
              </p>
            </div>
          </div>

        ) : trades.length > 0 ? (

          /* ==================================================
             TRADE LIST
          ================================================== */

          <div className="space-y-4 md:space-y-6">

            {trades.map((trade) => (
              <section
                key={trade.id}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-[26px]
                  border
                  border-black/5
                  bg-white/55
                  shadow-[0_8px_35px_rgba(0,0,0,0.05)]
                  backdrop-blur-xl
                  dark:border-white/10
                  dark:bg-white/[0.045]
                  md:rounded-[32px]
                  md:backdrop-blur-2xl
                  md:transition-all
                  md:duration-300
                  md:hover:-translate-y-0.5
                  md:hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]
                "
              >

                {/* Glass highlight */}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent dark:from-white/[0.06]" />

                {/* Accent edge */}

                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-400 via-blue-400 to-transparent opacity-70" />

                {/* =================================================
                    TRADE HEADER
                ================================================= */}

                <div
                  className="
                    relative
                    border-b
                    border-black/5
                    px-4
                    py-4
                    dark:border-white/10
                    md:px-6
                    md:py-5
                  "
                >
                  <div className="flex items-center justify-between gap-3">

                    {/* Left */}

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-black/[0.035] text-black/55 dark:border-white/10 dark:bg-white/[0.07] dark:text-white/60">
                        <ArrowLeftRight className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold tracking-tight md:text-base">
                          Trade Record
                        </div>

                        <div className="mt-0.5 text-[11px] text-black/40 dark:text-white/40">
                          Player movement
                        </div>
                      </div>
                    </div>

                    {/* Date */}

                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/5 bg-black/[0.025] px-2.5 py-1.5 text-[10px] font-medium text-black/50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/50 sm:px-3 sm:text-xs">
                      <Calendar className="h-3 w-3" />

                      <span>{formatDate(trade.date)}</span>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    TRADE CONTENT
                ================================================= */}

                <div className="relative space-y-4 p-4 md:space-y-5 md:p-6">

                  {/* Description */}

                  <div
                    className="
                      rounded-2xl
                      border
                      border-black/5
                      bg-black/[0.025]
                      px-4
                      py-3
                      dark:border-white/5
                      dark:bg-white/[0.025]
                      md:px-5
                      md:py-3.5
                    "
                  >
                    <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-black/30 dark:text-white/30">
                      <FileText className="h-3 w-3" />
                      Transaction
                    </div>

                    <p className="text-sm font-medium leading-relaxed text-black/75 dark:text-white/75">
                      {trade.description}
                    </p>
                  </div>

                  {/* Players */}

                  <div>

                    {/* Section title */}

                    <div className="mb-2.5 flex items-center justify-between">
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
                        Players Involved
                      </h4>

                      <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-black/40 dark:bg-white/[0.07] dark:text-white/40">
                        {trade.playersTraded.length}
                      </span>
                    </div>

                    {/* Player entries */}

                    <div className="space-y-2">

                      {trade.playersTraded.map((pt, index) => {
                        const fromColor = getTeamColorByName(
                          pt.from_team
                        );

                        const toColor = getTeamColorByName(
                          pt.to_team
                        );

                        return (
                          <div
                            key={index}
                            className="
                              group/player
                              relative
                              overflow-hidden
                              rounded-2xl
                              border
                              border-black/5
                              bg-white/35
                              px-3.5
                              py-2.5
                              backdrop-blur-lg
                              dark:border-white/10
                              dark:bg-white/[0.025]
                              md:px-4
                              md:py-3
                              md:transition-colors
                              md:duration-300
                              md:hover:bg-white/50
                              md:dark:hover:bg-white/[0.05]
                            "
                          >

                            {/* Mini glass shine */}

                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-70 dark:from-white/[0.035]" />

                            <div className="relative flex items-center gap-2.5">

                              {/* =================================
                                  PLAYER
                              ================================= */}

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold tracking-tight">
                                  {pt.player.name}
                                </div>

                                {pt.player.position && (
                                  <div className="mt-0.5 truncate text-[10px] text-black/40 dark:text-white/40">
                                    {pt.player.position}
                                  </div>
                                )}
                              </div>

                              {/* =================================
                                  TRADE MOVEMENT
                              ================================= */}

                              <div className="flex min-w-0 shrink-0 items-center gap-1.5">

                                {/* From */}

                                <span
                                  className="
                                    max-w-[72px]
                                    truncate
                                    text-right
                                    text-[10px]
                                    font-bold
                                    sm:max-w-[120px]
                                    sm:text-[11px]
                                    md:max-w-[170px]
                                    md:text-xs
                                  "
                                  style={{
                                    color: fromColor,
                                  }}
                                  title={pt.from_team}
                                >
                                  {pt.from_team}
                                </span>

                                {/* Arrow */}

                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/5 bg-black/[0.035] dark:border-white/10 dark:bg-white/[0.06]">
                                  <ArrowLeftRight className="h-3 w-3 text-black/35 dark:text-white/45" />
                                </div>

                                {/* To */}

                                <span
                                  className="
                                    max-w-[72px]
                                    truncate
                                    text-[10px]
                                    font-bold
                                    sm:max-w-[120px]
                                    sm:text-[11px]
                                    md:max-w-[170px]
                                    md:text-xs
                                  "
                                  style={{
                                    color: toColor,
                                  }}
                                  title={pt.to_team}
                                >
                                  {pt.to_team}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

        ) : (

          /* ==================================================
             EMPTY STATE
          ================================================== */

          <div
            className="
              relative
              overflow-hidden
              rounded-[28px]
              border
              border-black/5
              bg-white/55
              px-6
              py-12
              text-center
              shadow-[0_10px_45px_rgba(0,0,0,0.05)]
              backdrop-blur-xl
              dark:border-white/10
              dark:bg-white/[0.045]
              md:rounded-[34px]
              md:px-10
              md:py-16
              md:backdrop-blur-2xl
            "
          >

            {/* Glass shine */}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent dark:from-white/[0.05]" />

            <div className="relative">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-black/5 bg-black/[0.035] text-black/35 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/35">
                <ArrowLeftRight className="h-7 w-7" />
              </div>

              <h3 className="text-xl font-semibold tracking-tight">
                No trades yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-black/40 dark:text-white/40">
                Trade history will appear here when players are moved between
                teams.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Trades;
