import {
  BarChart3, Bell, Bike, Boxes, Building2, CreditCard, FileText, Flame, Gavel, Scale,
  Image, Inbox, Info, LayoutDashboard, Megaphone, MessageSquareText, PackageCheck, Phone, Plug, Smartphone, Star,
  Settings, ShoppingCart, Sparkles, Store, Sun, UserRoundCog, Users, Wallet, Warehouse, AlarmClockCheck, MapPinned,
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
      { title: 'Map',        href: '/locations', icon: MapPinned },
      { title: 'Marketing',  href: '/marketing', icon: Sparkles },
      { title: 'Flash Deals', href: '/flash-deals', icon: Flame },
      { title: 'Seasonal Promos', href: '/seasonal-promotions', icon: Sun },
      { title: 'Bid Control', href: '/bids',        icon: Gavel },
      { title: 'Support',    href: '/support',   icon: MessageSquareText },
      { title: 'Contact Us', href: '/contact',   icon: Phone },
      { title: 'Reviews',    href: '/reviews',   icon: Star },
      { title: 'Feedback',   href: '/feedback',  icon: Inbox },
      { title: 'Delivery',   href: '/delivery',  icon: Warehouse },
      { title: 'Overdue',    href: '/delivery/overdue', icon: AlarmClockCheck },
      { title: 'Finance',    href: '/finance',   icon: CreditCard },
      { title: 'Balance',    href: '/balance',   icon: Scale },
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
      { title: 'Customer App', href: '/app-pages/customer', icon: Smartphone },
      { title: 'Partner App',  href: '/app-pages/partner',  icon: Store },
      { title: 'Manage Users', href: '/users',              icon: UserRoundCog },
      { title: 'Notifications', href: '/notifications',      icon: Bell },
      { title: 'API',          href: '/integrations',       icon: Plug },
      { title: 'Settings',     href: '/settings',           icon: Settings },
      { title: 'Audit Log',    href: '/settings/audit-log', icon: FileText },
    ],
  },
]

// Pages that can be granted to staff, excluding admin-only pages and the map,
// which contains combined customer and partner location data.
export const assignablePages: { route: string; label: string }[] = navGroups
  .filter((g) => g.title !== 'Admin')
  .flatMap((g) => g.items.filter((i) => i.href !== '/locations').map((i) => ({ route: i.href, label: i.title })))