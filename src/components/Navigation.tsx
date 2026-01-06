import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy, Upload, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/rules", label: "Rules" },
    { path: "/teams", label: "Teams" },
    { path: "/standings", label: "Standings" },
    { path: "/players", label: "Players" },
    { path: "/stats", label: "Stats" },
    { path: "/trades", label: "Trades" },
    { path: "/history/1", label: "History" },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    (path.startsWith("/history") && location.pathname.startsWith("/history"));

  return (
    <nav className="bg-gradient-hero shadow-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-primary-foreground p-2 rounded-lg shadow-primary group-hover:scale-110 transition-transform duration-300">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">
              NCL
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={`text-primary-foreground hover:bg-primary-foreground/20 ${
                    isActive(item.path) ? "bg-primary-foreground/20" : ""
                  }`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}

            <Link to="/vod">
              <Button
                variant="ghost"
                className="text-white hover:bg-white hover:text-black border border-white"
              >
                Upload VOD
              </Button>
            </Link>
            <Link to="/profile">
              <Button
                variant="ghost"
                className="flex items-center justify-center text-white w-10 h-10 p-0 rounded-full hover:bg-white hover:text-black border border-white"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={`w-full justify-start text-primary-foreground hover:bg-primary-foreground/20 ${
                      isActive(item.path) ? "bg-primary-foreground/20" : ""
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}

              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center text-white hover:bg-white hover:text-black border border-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>

              <Link to="/vod" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center text-white hover:bg-white hover:text-black border border-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload VOD
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
