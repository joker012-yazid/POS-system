import {
  HomeIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  CubeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    name: 'Utama',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Carian', href: '/search', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    name: 'Servis',
    items: [
      { name: 'Jobs', href: '/jobs', icon: WrenchScrewdriverIcon },
      { name: 'Pelanggan', href: '/customers', icon: UsersIcon },
      { name: 'Peranti', href: '/devices', icon: ComputerDesktopIcon },
    ],
  },
  {
    name: 'Dokumen',
    items: [
      { name: 'Sebutharga', href: '/quotations', icon: DocumentTextIcon },
      { name: 'Invois', href: '/invoices', icon: DocumentCheckIcon },
    ],
  },
  {
    name: 'Inventori',
    items: [
      { name: 'Produk', href: '/products', icon: CubeIcon },
    ],
  },
  {
    name: 'Sistem',
    items: [
      { name: 'Laporan', href: '/reports', icon: ChartBarIcon },
      { name: 'Pengguna', href: '/users', icon: UserGroupIcon, adminOnly: true },
      { name: 'Audit Log', href: '/audit', icon: ClipboardDocumentListIcon, adminOnly: true },
      { name: 'Tetapan', href: '/settings', icon: Cog6ToothIcon },
    ],
  },
];
