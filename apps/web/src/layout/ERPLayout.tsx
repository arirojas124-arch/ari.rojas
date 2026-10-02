import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BriefcaseBusiness, Building2, ChartNoAxesColumn, ChevronDown, CircleHelp, CreditCard, LayoutDashboard, LogOut, Menu, Package, Search, Settings, ShoppingCart, Users, X } from 'lucide-react';
import { moduleGroups } from '../navigation/modules.js';
import { typography } from '@ari-erp/ui';
import { clearSession, getSession } from '../services/auth.service.js';
import './erp-layout.css';

const iconFor: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard, Comercial: Users, Inventario: Package, Compras: ShoppingCart,
  Finanzas: CreditCard, Personas: Users, Proyectos: BriefcaseBusiness, Reportes: ChartNoAxesColumn, Configuración: Settings
};
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type HealthState = 'unknown' | 'checking' | 'online' | 'offline';
type OpenMenu = 'notifications' | 'profile' | 'help' | null;

export function ERPLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [health, setHealth] = useState<HealthState>('unknown');
  const [menu, setMenu] = useState<OpenMenu>(null);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const filteredGroups = useMemo(() => moduleGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()))
  })).filter((group) => group.items.length), [search]);

  async function checkApi() {
    setHealth('checking');
    try {
      const response = await fetch(`${apiUrl}/health`);
      setHealth(response.ok ? 'online' : 'offline');
    } catch {
      setHealth('offline');
    }
  }

  const healthLabel = { unknown: 'API sin comprobar', checking: 'Conectando con API', online: 'API disponible', offline: 'API no disponible' }[health];

  function logout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="erp-frame">
      {drawerOpen ? <button aria-label="Cerrar navegación" className="erp-scrim" onClick={() => setDrawerOpen(false)} /> : null}
      <aside className={`erp-sidebar${drawerOpen ? ' erp-sidebar-open' : ''}`} aria-label="Navegación principal">
        <div className="erp-brand-row">
          <Link className="erp-brand" to="/dashboard" aria-label="ARI ERP, inicio">
            <span className="erp-brand-mark">A</span><span className="erp-brand-name">ARI <b>ERP</b></span>
          </Link>
          <button className="erp-icon-button erp-sidebar-close" type="button" aria-label="Cerrar navegación" onClick={() => setDrawerOpen(false)}><X size={19} /></button>
        </div>
        <div className="erp-company-switcher">
          <span className="erp-company-icon"><Building2 size={17} /></span>
          <span className="erp-company-copy"><small>EMPRESA ACTIVA</small><strong>{session ? `Tenant ${session.tenantId.slice(0, 8)}...` : 'Sin empresa seleccionada'}</strong></span>
        </div>
        <label className="erp-nav-search">
          <Search size={16} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar módulo" aria-label="Buscar módulo" />
          <kbd>/</kbd>
        </label>
        <nav className="erp-nav">
          {filteredGroups.map((group, index) => {
            const Icon = iconFor[group.label ?? 'Dashboard'] ?? LayoutDashboard;
            return <section className="erp-nav-group" key={`${group.label ?? 'group'}-${index}`}>
              {group.label ? <div className="erp-nav-heading">{group.label}</div> : null}
              {group.items.map((item) => item.available && item.path ? (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => `erp-nav-item${isActive ? ' erp-nav-item-active' : ''}`}>
                  <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>
                </NavLink>
              ) : (
                <div key={item.path} className="erp-nav-item erp-nav-item-disabled" aria-disabled="true" title="Próximamente">
                  <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span><span className="erp-coming-soon">Próximo</span>
                </div>
              ))}
              {index === 0 ? <div className="erp-nav-divider" /> : null}
            </section>;
          })}
        </nav>
        <div className="erp-sidebar-footer">
          <div className="erp-menu-anchor erp-help-anchor">
            <button className="erp-footer-link" type="button" aria-expanded={menu === 'help'} onClick={() => setMenu(menu === 'help' ? null : 'help')}><CircleHelp size={16} /> Ayuda y soporte</button>
            {menu === 'help' ? <div className="erp-popover erp-help-popover"><strong>Centro de ayuda</strong><p>Los canales de soporte se configurarán para tu organización.</p></div> : null}
          </div>
          <div className="erp-sidebar-version"><span className="erp-online-dot" /> Plataforma en preparación</div>
        </div>
      </aside>

      <div className="erp-main-column">
        <header className="erp-topbar">
          <button className="erp-icon-button erp-mobile-menu" aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setDrawerOpen((open) => !open)}>
            {drawerOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="erp-topbar-context"><span>ARI ERP</span><span className="erp-context-divider">/</span><strong>{location.pathname === '/dashboard' ? 'Dashboard' : 'Vista'}</strong></div>
          <div className="erp-topbar-actions">
            <button className="erp-api-check" type="button" onClick={checkApi} disabled={health === 'checking'}>
              <span className={`erp-health-dot erp-health-${health}`} />{healthLabel}
            </button>
            <div className="erp-menu-anchor">
              <button className={`erp-icon-button${menu === 'notifications' ? ' erp-icon-button-active' : ''}`} aria-label="Notificaciones" aria-expanded={menu === 'notifications'} onClick={() => setMenu(menu === 'notifications' ? null : 'notifications')}><Bell size={18} /></button>
              {menu === 'notifications' ? <div className="erp-popover"><strong>Notificaciones</strong><p>No hay notificaciones nuevas.</p></div> : null}
            </div>
            <div className="erp-profile-divider" />
            <div className="erp-menu-anchor">
              <button className="erp-profile-button" aria-expanded={menu === 'profile'} onClick={() => setMenu(menu === 'profile' ? null : 'profile')}>
                <span className="erp-avatar">U</span><span className="erp-profile-copy"><strong>Usuario autenticado</strong><small>{session ? `ID ${session.userId.slice(0, 8)}...` : 'Cuenta de usuario'}</small></span><ChevronDown size={15} />
              </button>
              {menu === 'profile' ? <div className="erp-popover erp-profile-popover"><strong>Sesión activa</strong><p>Empresa: {session?.tenantId ?? 'No disponible'}</p><button type="button" onClick={logout}><LogOut size={15} /> Cerrar sesión</button></div> : null}
            </div>
          </div>
        </header>
        <main className="erp-content" style={{ fontFamily: typography.family }}>
          <Outlet context={{ health, checkApi }} />
          <footer className="erp-content-footer"><span>ARI ERP</span><span>Gestión clara. Decisiones mejor informadas.</span></footer>
        </main>
      </div>
    </div>
  );
}
