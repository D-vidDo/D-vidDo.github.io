import React, { useEffect, useState, createContext, useContext } from "react";
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Standings from "./pages/Standings";
import Stats from "./pages/Stats";
import Trades from "./pages/Trades";
import NotFound from "./pages/NotFound";
import Players from "./pages/Players";
import Admin from "./pages/Admin";
import Rules from "./pages/Rules";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://bqqotvjpvaznkjfldcgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW90dmpwdmF6bmtqZmxkY2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NDE4NjEsImV4cCI6MjA3MDAxNzg2MX0.VPClABOucYEo-bVPg_brc6WvSx17zR4LADC2FEWdI5Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const queryClient = new QueryClient();

// Create a LeagueContext to provide teams, players, etc.
const LeagueContext = createContext<any>(null);

export const useLeague = () => useContext(LeagueContext);

const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeagueData() {
      setLoading(true);
      try {
        const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*");
        const { data: playersData, error: playersError } = await supabase.from("players").select("*");

        if (teamsError) throw teamsError;
        if (playersError) throw playersError;

        setTeams(teamsData ?? []);
        setPlayers(playersData ?? []);
      } catch (error: any) {
        console.error("Failed to load league data:", error.message);
      } finally {
        setLoading(false);
      }
    }
    loadLeagueData();
  }, []);

  return (
    <LeagueContext.Provider value={{ teams, players, loading, refresh: () => {
      // Optional: function to refresh data on demand
      setLoading(true);
      supabase
        .from("teams")
        .select("*")
        .then(({ data }) => setTeams(data ?? []))
        .finally(() => setLoading(false));

      supabase
        .from("players")
        .select("*")
        .then(({ data }) => setPlayers(data ?? []));
    } }}>
      {children}
      <Analytics />
    </LeagueContext.Provider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LeagueProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:teamId" element={<TeamDetail />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/players" element={<Players />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/Admin" element={<Admin />} />
            <Route path="/rules" element={<Rules />} />
            {/* Add a NotFound route at the end */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LeagueProvider>
    </TooltipProvider>
  </QueryClientProvider>
  
);

export default App;


{/* // import { loadLeagueData } from "@/data/mockData";
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { LeagueProvider } from "./context/LeagueContext";
// import Navigation from "./components/Navigation";
// import Home from "./pages/Home";
// import Teams from "./pages/Teams";
// import TeamDetail from "./pages/TeamDetail";
// import Standings from "./pages/Standings";
// import Stats from "./pages/Stats";
// import Trades from "./pages/Trades";
// import NotFound from "./pages/NotFound";
// import Players from "./pages/Players";
// import Admin from "./pages/Admin";

// const queryClient = new QueryClient();

// loadLeagueData();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <LeagueProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter>
//           <Navigation />
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/teams" element={<Teams />} />
//             <Route path="/teams/:teamId" element={<TeamDetail />} />
//             <Route path="/standings" element={<Standings />} />
//             <Route path="/players" element={<Players />} />
//             <Route path="/stats" element={<Stats />} />
//             <Route path="/trades" element={<Trades />} />
//             <Route path="/Admin" element={<Admin />} />
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </BrowserRouter>
//       </LeagueProvider>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App; */}
