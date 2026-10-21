import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";

// Everything below Home is code-split so a first-time visitor only
// downloads the landing page instead of all 12 routes up front.
const Teams = lazy(() => import("./pages/Teams"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const Standings = lazy(() => import("./pages/Standings"));
const Stats = lazy(() => import("./pages/Stats"));
const Trades = lazy(() => import("./pages/Trades"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Players = lazy(() => import("./pages/Players"));
const Admin = lazy(() => import("./pages/Admin"));
const Rules = lazy(() => import("./pages/Rules"));
const AdminVod = lazy(() => import("./pages/AdminSetVodLink"));
const HistoryRoute = lazy(() => import("./pages/HistoryRoute"));
const ProfilePage = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Analytics />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Suspense fallback={<RouteFallback />}>
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
            <Route path="/vod" element={<AdminVod />} />
            <Route path="/history/:seasonId" element={<HistoryRoute />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Add a NotFound route at the end */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
