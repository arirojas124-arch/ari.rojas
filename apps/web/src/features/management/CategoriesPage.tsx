import { ResourcePage } from './ResourcePage.js';

export function CategoriesPage() {
  return <ResourcePage
    title="Categorías"
    description="Organiza tus productos y asigna una categoría al crear o editar su ficha."
    endpoint="/categories"
    permission="categories:read"
    fields={[
      { name: 'name', label: 'Nombre de categoría', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea' }
    ]}
    columns={[
      { key: 'name', label: 'Categoría' },
      { key: 'description', label: 'Descripción' }
    ]}
  />;
}
