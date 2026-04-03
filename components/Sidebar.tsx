"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, ScanLine, Leaf, Cloud, BarChart2, Map, Satellite, MessageSquare, DollarSign, TrendingUp, Sun, Moon, LogOut, MessageCircle, Phone
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Scan", icon: ScanLine, href: "/scan" },
  { label: "Soil", icon: Leaf, href: "/soil" },
  { label: "Weather", icon: Cloud, href: "/weather" },
  { label: "Crop Prices", icon: TrendingUp, href: "/crop-price" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
  { label: "Map", icon: Map, href: "/farm-map" },
  { label: "Satellite", icon: Satellite, href: "/satellite" },
  { label: "Assistant", icon: MessageSquare, href: "/assistant" },
  { label: "Helpline", icon: Phone, href: "/helpline" },
  { label: "Finance", icon: DollarSign, href: "/finance" },
  { label: "Farm Setup", icon: Leaf, href: "/setup" },
  { label: "Feedback", icon: MessageCircle, href: "/feedback" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 18 }}>🌱</span>
          <div>
            <div className="sidebar-brand-title">Smart Agri Ai</div>
            <div className="sidebar-brand-subtitle">Your Agriculture Ai Platform</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="sidebar-footer-btn" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>
        <button onClick={handleLogout} className="sidebar-footer-btn logout-btn" title="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
