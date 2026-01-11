import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerCard from "@/components/PlayerCard";
import { Play } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string>("");

  // match history consts
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!player?.sets_played || player.sets_played.length === 0) {
      setMatchHistory([]);
      return;
    }

    const fetchMatchHistory = async () => {
      setLoadingHistory(true);
      try {
        // Fetch the set info
        const { data: setsData, error: setsError } = await supabase
          .from("sets")
          .select(
            `
          id,
          set_no,
          points_for,
          points_against,
          result,
          vod_link,
          game_id,
          season_id,
          games (
            id,
            opponent,
            date,
            time,
            team_id,
            teams:teams(name, color)
          )
        `
          )
          .in("id", player.sets_played);

        if (setsError) throw setsError;

        // Optional: sort by date
        const sorted = (setsData || []).sort(
          (a, b) =>
            new Date(a.games?.date || 0).getTime() -
            new Date(b.games?.date || 0).getTime()
        );

        setMatchHistory(sorted);
      } catch (err: any) {
        console.error("Error fetching match history:", err.message);
        setMatchHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchMatchHistory();
  }, [player]);

  // Initialize from player when loaded
  useEffect(() => {
    if (player?.imageUrl) {
      setImageUrl(player.imageUrl);
    }
  }, [player]);

  // Get auth user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch linked player (PRIVATE TABLE)
  useEffect(() => {
    if (!user) {
      setPlayer(null);
      return;
    }

    const fetchPlayer = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*") // select all columns
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching player:", error.message);
        setPlayer(null);
      } else {
        setPlayer(data); // include stat_visibility and all stats
      }
    };

    fetchPlayer();
  }, [user]);

  // Login / Signup handler
  const handleAuth = async () => {
    setError(null);

    try {
      if (isSignup) {
        // SIGNUP FLOW
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/profile", // optional redirect after confirmation
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        // Supabase usually doesn't return user until confirmed
        alert(
          "Signup successful! Please check your email to confirm your account before logging in."
        );
        setIsSignup(false); // optionally switch to login form
        setEmail(""); // clear form
        setPassword("");
      } else {
        // LOGIN FLOW
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        // data.user is now available
        setUser(data.user);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    setError(null);
    setResetMessage(null);

    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/profile",
    });

    if (error) {
      setError(error.message);
    } else {
      setResetMessage(
        "Password reset email sent. Check your inbox (and spam folder)."
      );
    }
  };

  if (loading) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  /* ===========================
     NOT LOGGED IN → AUTH FORM
     =========================== */
  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-24 p-6">
        <h1 className="text-2xl font-bold mb-4">
          {isSignup ? "Create Account" : "Login"}
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault(); // prevent page reload
            handleAuth();
          }}
        >
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />

          {/* Forgot password (LOGIN ONLY) */}
          {!isSignup && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-primary hover:underline mb-2"
            >
              Forgot password?
            </button>
          )}

          {/* Reset success message */}
          {resetMessage && (
            <p className="text-sm text-green-600 mb-2">{resetMessage}</p>
          )}

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <Button className="w-full" type="submit">
            {isSignup ? "Sign Up" : "Login"}
          </Button>
        </form>

        <button
          className="mt-4 text-sm text-muted-foreground"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup
            ? "Already have an account? Login"
            : "Need an account? Sign up"}
        </button>
      </Card>
    );
  }

  /* ===========================
     LOGGED IN → PROFILE
     =========================== */
  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
          Logout
        </Button>
      </div>

      {!player ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No player profile linked to this account yet.
          </p>
        </Card>
      ) : (
        <>
          {/* FULL PRIVATE PLAYER CARD (stats always visible) */}
          <PlayerCard player={player} forceShowStats />

          <Card className="mt-6 p-4">
            <h2 className="text-xl font-bold mb-4">Match History</h2>

            {/* MATCH HISTORY*/}
            {loadingHistory ? (
              <p>Loading match history...</p>
            ) : matchHistory.length === 0 ? (
              <p className="text-muted-foreground">No match history yet.</p>
            ) : (
              <div className="space-y-3">
                {matchHistory.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center bg-muted/30 border border-muted rounded-lg p-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {set.games?.opponent || "Unknown Opponent"} — Set{" "}
                        {set.set_no}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {set.points_for} - {set.points_against} ({set.result})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {set.games?.date} | Team:{" "}
                        {set.games?.teams?.name || "?"}
                      </p>
                    </div>

                    {/* VOD BUTTON */}
                    {set.vod_link ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(set.vod_link, "_blank")}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        VOD
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        -
                      </span>
                    )}

                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ml-auto ${
                        set.result === "W"
                          ? "bg-green-100 text-green-700"
                          : set.result === "L"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {set.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="mt-6 p-4">
            <p className="font-medium mb-2">Player Image</p>

            {/* Preview */}
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Player"
                className="h-32 w-32 object-cover rounded-lg mb-3"
              />
            )}

            {/* Input field */}
            <Input
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mb-3"
            />

            {/* Save button */}
            <Button
              onClick={async () => {
                if (!player) return;

                // ✅ Validate the URL before saving
                if (
                  imageUrl.trim() !== "" &&
                  !/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(imageUrl)
                ) {
                  alert(
                    "Please enter a valid image URL (jpg, jpeg, png, or gif)"
                  );
                  return; // stop the function if invalid
                }

                // Update the player in Supabase
                const { data, error } = await supabase
                  .from("players")
                  .update({ imageUrl }) // matches your column name
                  .eq("id", player.id)
                  .select()
                  .single();

                if (error) {
                  alert("Error updating image: " + error.message);
                } else {
                  setPlayer(data); // update local state
                  alert("Player image updated!");
                }
              }}
            >
              Save Image
            </Button>
          </Card>

          {/* Visibility Toggle */}
          <Card className="mt-6 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Public Stat Visibility</p>
              <p className="text-sm text-muted-foreground">
                Toggle whether your stats appear publicly
              </p>
            </div>

            <input
              type="checkbox"
              checked={player.stat_visibility}
              onChange={async (e) => {
                const checked = e.target.checked;

                await supabase
                  .from("players")
                  .update({ stat_visibility: checked })
                  .eq("id", player.id);

                setPlayer({
                  ...player,
                  stat_visibility: checked,
                });
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
