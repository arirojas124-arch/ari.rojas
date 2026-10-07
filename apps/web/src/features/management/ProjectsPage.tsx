import { ResourcePage } from './ResourcePage.js';

const projectStatuses = [
  { label: 'Planeado', value: 'planned' },
  { label: 'Activo', value: 'active' },
  { label: 'En pausa', value: 'on_hold' },
  { label: 'Completado', value: 'completed' }
];
const projectStatusName = (value: unknown) => projectStatuses.find((status) => status.value === value)?.label ?? String(value ?? '—');

export function ProjectsPage() {
  return <ResourcePage
    title="Proyectos y tareas"
    description="Crea proyectos, define responsables y consulta las fechas y el estado de cada iniciativa."
    endpoint="/projects"
    permission="projects:read"
    fields={[
      { name: 'name', label: 'Nombre del proyecto', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'status', label: 'Estado', type: 'select', required: true, options: projectStatuses },
      { name: 'startDate', label: 'Fecha de inicio', type: 'date' },
      { name: 'dueDate', label: 'Fecha objetivo', type: 'date' }
    ]}
    columns={[
      { key: 'name', label: 'Proyecto' },
      { key: 'status', label: 'Estado', format: projectStatusName },
      { key: 'startDate', label: 'Inicio', format: (value) => value ? new Date(String(value)).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '—' },
      { key: 'dueDate', label: 'Fecha objetivo', format: (value) => value ? new Date(String(value)).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '—' }
    ]}
  />;
}
