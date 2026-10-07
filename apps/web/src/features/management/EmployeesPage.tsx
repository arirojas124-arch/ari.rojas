import { ResourcePage } from './ResourcePage.js';

export function EmployeesPage() {
  return <ResourcePage
    title="Empleados"
    description="Administra perfiles laborales, áreas, datos de contacto y fecha de ingreso."
    endpoint="/employees"
    permission="employees:read"
    fields={[
      { name: 'employeeNumber', label: 'Número de empleado', required: true },
      { name: 'name', label: 'Nombre completo', required: true },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'phone', label: 'Teléfono' },
      { name: 'departmentId', label: 'Departamento', type: 'select', optionsEndpoint: '/departments' },
      { name: 'jobTitle', label: 'Puesto' },
      { name: 'startDate', label: 'Fecha de ingreso', type: 'date' }
    ]}
    columns={[
      { key: 'employeeNumber', label: 'No. empleado' },
      { key: 'name', label: 'Nombre' },
      { key: 'jobTitle', label: 'Puesto' },
      { key: 'departmentName', label: 'Departamento' },
      { key: 'email', label: 'Correo' }
    ]}
  />;
}
