import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerCard from "@/components/PlayerCard";

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
          <PlayerCard player={player} />

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
