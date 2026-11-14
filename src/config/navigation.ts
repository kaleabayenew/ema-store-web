import {
  BarChart3, Bell, Bike, Boxes, Building2, CreditCard, FileText, Flame, Gavel,
  Image, Inbox, Info, LayoutDashboard, Megaphone, MessageSquareText, PackageCheck, Plug, Star,
  Settings, ShoppingCart, Sparkles, UserRoundCog, Users, Wallet, Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem { title: string; href: string; icon: LucideIcon }

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard },
      { title: 'Reports',    href: '/reports',   icon: BarChart3 },
    ],
  },
  {
    title: 'Operations',
    items: [
      { title: 'Customers',  href: '/customers', icon: Users },
      { title: 'Partners',   href: '/partners',  icon: Building2 },
      { title: 'Products',   href: '/products',  icon: Boxes },
      { title: 'Orders',     href: '/orders',    icon: ShoppingCart },
      { title: 'Ride',       href: '/ride',      icon: Bike },
      { title: 'Marketing',  href: '/marketing', icon: Sparkles },
      { title: 'Flash Deals', href: '/flash-deals', icon: Flame },
      { title: 'Bid Control', href: '/bids',        icon: Gavel },
      { title: 'Support',    href: '/support',   icon: MessageSquareText },
      { title: 'Reviews',    href: '/reviews',   icon: Star },
      { title: 'Feedback',   href: '/feedback',  icon: Inbox },
      { title: 'Delivery',   href: '/delivery',  icon: Warehouse },
      { title: 'Finance',    href: '/finance',   icon: CreditCard },
      { title: 'Credits',    href: '/credits',   icon: Wallet },
      { title: 'Approvals',  href: '/approvals', icon: PackageCheck },
      { title: 'Banners',    href: '/banners',   icon: Image },
      { title: 'Announcements', href: '/announcements', icon: Megaphone },
      { title: 'About',      href: '/about',     icon: Info },
    ],
  },
  {
    title: 'Admin',
    items: [
      { title: 'Manage Users', href: '/users',              icon: UserRoundCog },
      { title: 'Notifications', href: '/notifications',      icon: Bell },
      { title: 'API',          href: '/integrations',       icon: Plug },
      { title: 'Settings',     href: '/settings',           icon: Settings },
      { title: 'Audit Log',    href: '/settings/audit-log', icon: FileText },
    ],
  },
]

// Pages that can be granted to non-super-admin staff — everything except the
// Admin group (Manage Users, Notifications, API, Settings, Audit Log).
export const assignablePages: { route: string; label: string }[] = navGroups
  .filter((g) => g.title !== 'Admin')
  .flatMap((g) => g.items.map((i) => ({ route: i.href, label: i.title })))