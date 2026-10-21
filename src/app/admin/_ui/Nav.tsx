"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpenText,
  CalendarCheck,
  FileClock,
  HelpCircle,
  Images,
  Inbox,
  LayoutDashboard,
  Map,
  Menu,
  Plane,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/admin/users";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  min: Role;
  count?: "orders" | "leads";
}
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "", items: [{ href: "/", label: "Bosh sahifa", icon: LayoutDashboard, min: "manager" }] },
  {
    title: "Savdo",
    items: [
      { href: "/orders", label: "Bronlar", icon: CalendarCheck, min: "manager", count: "orders" },
      { href: "/leads", label: "Murojaatlar", icon: Inbox, min: "manager", count: "leads" },
    ],
  },
  {
    title: "Kontent",
    items: [
      { href: "/tours", label: "Turlar", icon: Plane, min: "admin" },
      { href: "/destinations", label: "Yo'nalishlar", icon: Map, min: "admin" },
      { href: "/blog", label: "Blog", icon: BookOpenText, min: "admin" },
      { href: "/faq", label: "Savol-javob", icon: HelpCircle, min: "admin" },
      { href: "/media", label: "Rasmlar", icon: Images, min: "admin" },
    ],
  },
  {
    title: "Tizim",
    items: [
      { href: "/settings", label: "Sozlamalar", icon: Settings, min: "admin" },
      { href: "/users", label: "Foydalanuvchilar", icon: Users, min: "owner" },
      { href: "/audit", label: "Harakatlar jurnali", icon: FileClock, min: "admin" },
      { href: "/account", label: "Mening hisobim", icon: UserCog, min: "manager" },
    ],
  },
];
const RANK: Record<Role, number> = { manager: 1, admin: 2, owner: 3 };

export function Nav({
  role,
  counts,
  footer,
}: {
  role: Role;
  counts: { orders: number; leads: number };
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <aside className="side" data-open={open ? "1" : undefined}>
      <div className="side-brand">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo */}
          <img src="/brand/ravon-horizontal.svg" alt="Ravon Travel" style={{ height: 30, width: "auto", display: "block" }} />
          <small>Boshqaruv paneli</small>
        </div>
        <button type="button" className="menu-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <Menu size={18} aria-hidden="true" />
          <span className="sr-only">Menyu</span>
        </button>
      </div>
      {GROUPS.map((group) => {
        const items = group.items.filter((i) => RANK[role] >= RANK[i.min]);
        if (!items.length) return null;
        return (
          <div key={group.title || "main"}>
            {group.title && <div className="nav-group">{group.title}</div>}
            <nav className="nav" aria-label={group.title || "Asosiy"}>
              {items.map((item) => {
                const n = item.count ? counts[item.count] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active(item.href) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span>{item.label}</span>
                    {n > 0 && (
                      <span className="count" aria-label={`${n} ta yangi`}>
                        {n}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        );
      })}
      <div className="side-foot">{footer}</div>
    </aside>
  );
}
