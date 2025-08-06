import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy } from "lucide-react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/teams", label: "Teams" },
    { path: "/standings", label: "Standings" },
    { path: "/players", label: "Players" },
    { path: "/stats", label: "Stats" },
    { path: "/trades", label: "Trades" },
    { path: "/drafts", label: "Drafts" },
  ];

  const isActive = (path: string) => location.pathname === path;

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
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setIsMenuOpen(false)}>
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;