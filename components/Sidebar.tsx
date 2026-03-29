"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ScanLine, Leaf, Cloud, BarChart2, Map, Satellite, MessageSquare, DollarSign
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Scan", icon: ScanLine, href: "/scan" },
  { label: "Soil", icon: Leaf, href: "/soil" },
  { label: "Weather", icon: Cloud, href: "/weather" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
  { label: "Map", icon: Map, href: "/farm-map" },
  { label: "Satellite", icon: Satellite, href: "/satellite" },
  { label: "Assistant", icon: MessageSquare, href: "/assistant" },
  { label: "Finance", icon: DollarSign, href: "/finance" },
  { label: "Farm Setup", icon: Leaf, href: "/setup" },
];

export default function Sidebar() {
  const pathname = usePathname();

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
    </aside>
  );
}
