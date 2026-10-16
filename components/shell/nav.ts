import { Bell, Bookmark, LayoutDashboard, Megaphone, MessageCircle, Package, Settings, Store, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages";

export type NavItem = { href: string; label: MessageKey; icon: LucideIcon; exact?: boolean };

export const HOME_HREF = "/dashboard";

const dashboard: NavItem = { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard, exact: true };
const explore: NavItem = { href: "/explore", label: "nav.explore", icon: Users };
const campaigns: NavItem = { href: "/campaigns", label: "nav.campaigns", icon: Megaphone };
const orders: NavItem = { href: "/orders", label: "nav.orders", icon: Package };
const brands: NavItem = { href: "/brands", label: "nav.brands", icon: Store };
const balance: NavItem = { href: "/balance", label: "nav.balance", icon: Wallet };
const messages: NavItem = { href: "/messages", label: "nav.messages", icon: MessageCircle };
const notifications: NavItem = { href: "/notifications", label: "nav.notifications", icon: Bell };
const lists: NavItem = { href: "/lists", label: "nav.lists", icon: Bookmark };
const settings: NavItem = { href: "/settings", label: "nav.settings", icon: Settings };

export type NavGroup = { label?: MessageKey; items: NavItem[] };

/** Desktop sidebar. Balance isn't here: it's always on show in the top bar. */
export const sidebarGroups: NavGroup[] = [
  { items: [dashboard] },
  { label: "nav.groupDiscover", items: [explore, lists] },
  { label: "nav.groupManage", items: [campaigns, orders, brands, messages] },
];

/** Mobile tab bar, followed by a "More" tab that opens moreItems. Labels are short to fit five across. */
export const tabItems: NavItem[] = [{ ...dashboard, label: "nav.home" }, { ...explore, label: "nav.creatorsShort" }, campaigns, orders];
export const moreItems: NavItem[] = [brands, balance, lists, notifications, settings];

/** Creator profiles belong to Explore. */
const aliases: Record<string, string> = { "/creators": "/explore" };

export function isActive(item: NavItem, pathname: string): boolean {
  const path = Object.entries(aliases).reduce((p, [from, to]) => (p === from || p.startsWith(`${from}/`) ? to : p), pathname);
  return item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
}
