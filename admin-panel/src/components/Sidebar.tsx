import { NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-gold/15 text-gold' : 'text-gold-soft/80 hover:bg-white/5 hover:text-gold-soft'
  }`;

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-on-dark">
      {children}
    </p>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-navy-dark px-3 py-6">
      <div className="mb-4 px-3">
        <p className="text-lg font-semibold tracking-wide text-gold">ORA DE NUIT</p>
        <p className="text-xs text-muted-on-dark">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <NavLink to="/dashboard" className={navLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/reservations" className={navLinkClass}>
          Reservations
        </NavLink>
        <NavLink to="/orders" className={navLinkClass}>
          Orders
        </NavLink>

        <SectionLabel>Content</SectionLabel>
        <NavLink to="/cms/home" className={navLinkClass}>
          Home
        </NavLink>
        <NavLink to="/cms/menu" className={navLinkClass}>
          Menu
        </NavLink>
        <NavLink to="/cms/about" className={navLinkClass}>
          About
        </NavLink>
        <NavLink to="/cms/gallery" className={navLinkClass}>
          Gallery
        </NavLink>
        <NavLink to="/cms/contact" className={navLinkClass}>
          Contact
        </NavLink>
        <NavLink to="/cms/social-media" className={navLinkClass}>
          Social Media
        </NavLink>
        <NavLink to="/cms/settings" className={navLinkClass}>
          Settings
        </NavLink>

        <SectionLabel>Account</SectionLabel>
        <NavLink to="/profile" className={navLinkClass}>
          Profile
        </NavLink>
      </nav>
    </aside>
  );
}
