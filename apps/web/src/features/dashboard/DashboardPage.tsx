import { Activity, ArrowRight, Boxes, ChartNoAxesColumn, CircleDollarSign, Users } from 'lucide-react';
import { Breadcrumbs, Button, EmptyState, PageHeader } from '@ari-erp/ui';
import './dashboard.css';

const plannedAreas = [
  { icon: CircleDollarSign, title: 'Ventas y compras', detail: 'Indicadores del periodo' },
  { icon: Users, title: 'Relaciones comerciales', detail: 'Clientes y proveedores' },
  { icon: Boxes, title: 'Inventario', detail: 'Existencias y movimientos' },
  { icon: Activity, title: 'Actividad reciente', detail: 'Cambios registrados' }
];

export function DashboardPage() {
  return (
    <div className="dashboard-page">
      <Breadcrumbs items={['Inicio', 'Dashboard']} />
      <PageHeader eyebrow="CENTRO DE OPERACIONES" title="Resumen general" description="Tu espacio de trabajo para la operación diaria de la empresa." />
      <section className="dashboard-ready" aria-label="Estado del dashboard">
        <div className="dashboard-ready-art"><ChartNoAxesColumn size={25} strokeWidth={1.7} /></div>
        <div className="dashboard-ready-copy">
          <span className="dashboard-kicker">ARI ERP · BASE OPERATIVA</span>
          <h2>El espacio está preparado para tus datos.</h2>
          <p>El dashboard se conectará a indicadores reales cuando ventas, clientes, productos e inventario tengan sus endpoints funcionales.</p>
          <EmptyState title="Aún no hay métricas disponibles" description="No mostramos cifras de demostración como si fueran información real. La siguiente fase conectará este panel a datos de tu empresa." />
        </div>
      </section>
      <section className="dashboard-areas" aria-labelledby="dashboard-areas-title">
        <div className="dashboard-section-heading"><div><span className="dashboard-kicker">PREPARADO PARA CRECER</span><h2 id="dashboard-areas-title">Áreas de gestión</h2></div><span className="dashboard-phase-badge">Módulos por fases</span></div>
        <div className="dashboard-area-grid">
          {plannedAreas.map(({ icon: Icon, title, detail }) => <div className="dashboard-area" key={title}><span className="dashboard-area-icon"><Icon size={18} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16} className="dashboard-area-arrow" /></div>)}
        </div>
      </section>
      <div className="dashboard-next-step"><span>PRÓXIMO HITO</span><p>Design system y navegación están listos para recibir el módulo de clientes.</p><Button variant="secondary" disabled>Clientes <ArrowRight size={15} /></Button></div>
    </div>
  );
}
