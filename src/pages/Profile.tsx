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

    supabase
      .from("players")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setPlayer(data));
  }, [user]);

  // Login / Signup handler
  const handleAuth = async () => {
    setError(null);

    try {
      let result;

      if (isSignup) {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Something went wrong. Try again.");
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

        <Button className="w-full" onClick={handleAuth}>
          {isSignup ? "Sign Up" : "Login"}
        </Button>

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
