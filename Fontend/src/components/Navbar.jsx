import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span>HealthPartner</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/" 
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Home
            </NavLink>
            <NavLink 
              to="/health-info" 
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Health Info
            </NavLink>
            {user ? (
              <>
                <NavLink 
                  to={user.role === "provider" ? "/provider-dashboard" : "/patient-dashboard"}
                  className="text-foreground/80 hover:text-foreground transition-colors"
                  activeClassName="text-foreground font-semibold"
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/profile" 
                  className="text-foreground/80 hover:text-foreground transition-colors"
                  activeClassName="text-foreground font-semibold"
                >
                  Profile
                </NavLink>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")} size="sm">
                Get Started
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <NavLink 
              to="/" 
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink 
              to="/health-info" 
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Health Info
            </NavLink>
            {user ? (
              <>
                <NavLink 
                  to={user.role === "provider" ? "/provider-dashboard" : "/patient-dashboard"}
                  className="block text-foreground/80 hover:text-foreground transition-colors py-2"
                  activeClassName="text-foreground font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/profile" 
                  className="block text-foreground/80 hover:text-foreground transition-colors py-2"
                  activeClassName="text-foreground font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </NavLink>
                <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} size="sm" className="w-full">
                Get Started
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
