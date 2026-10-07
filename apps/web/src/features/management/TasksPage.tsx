import { ResourcePage } from './ResourcePage.js';

const taskStatuses = [
  { label: 'Por hacer', value: 'todo' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Bloqueada', value: 'blocked' },
  { label: 'Completada', value: 'done' }
];
const taskStatusName = (value: unknown) => taskStatuses.find((status) => status.value === value)?.label ?? String(value ?? '—');

export function TasksPage() {
  return <ResourcePage
    title="Seguimiento"
    description="Da seguimiento a tareas de proyectos, responsables, fechas y bloqueos."
    endpoint="/tasks"
    permission="projects:read"
    fields={[
      { name: 'projectId', label: 'Proyecto', type: 'select', required: true, optionsEndpoint: '/projects' },
      { name: 'title', label: 'Tarea', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'status', label: 'Estado', type: 'select', required: true, options: taskStatuses },
      { name: 'assignedEmployeeId', label: 'Responsable', type: 'select', optionsEndpoint: '/employees' },
      { name: 'dueDate', label: 'Fecha objetivo', type: 'date' }
    ]}
    columns={[
      { key: 'projectName', label: 'Proyecto' },
      { key: 'title', label: 'Tarea' },
      { key: 'assignedEmployeeName', label: 'Responsable' },
      { key: 'status', label: 'Estado', format: taskStatusName },
      { key: 'dueDate', label: 'Fecha objetivo', format: (value) => value ? new Date(String(value)).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '—' }
    ]}
  />;
}
