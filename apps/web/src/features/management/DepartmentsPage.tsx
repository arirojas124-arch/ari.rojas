import { ResourcePage } from './ResourcePage.js';

export function DepartmentsPage() {
  return <ResourcePage
    title="Departamentos"
    description="Define las áreas de tu organización y asígnalas a los perfiles de empleados."
    endpoint="/departments"
    permission="departments:read"
    fields={[
      { name: 'name', label: 'Nombre del departamento', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea' }
    ]}
    columns={[
      { key: 'name', label: 'Departamento' },
      { key: 'description', label: 'Descripción' }
    ]}
  />;
}
