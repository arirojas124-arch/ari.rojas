import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type Module = { label: string; group: string };
const modules: Module[] = [
  { label: 'Dashboard', group: 'Principal' },
  { label: 'Clientes', group: 'Gestión' },
  { label: 'Proveedores', group: 'Gestión' },
  { label: 'Productos', group: 'Inventario' },
  { label: 'Inventario', group: 'Inventario' },
  { label: 'Ventas', group: 'Operaciones' },
  { label: 'Compras', group: 'Operaciones' },
  { label: 'Finanzas', group: 'Finanzas' },
  { label: 'Empleados', group: 'Recursos' },
  { label: 'Proyectos', group: 'Recursos' },
  { label: 'Reportes', group: 'Sistema' },
  { label: 'Configuración', group: 'Sistema' }
];

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export default function App() {
  const [selected, setSelected] = useState('Dashboard');
  const [apiState, setApiState] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');

  const groups = useMemo(() => [...new Set(modules.map((item) => item.group))], []);

  async function checkApi() {
    setApiState('checking');
    try {
      const response = await fetch(apiUrl + '/health');
      setApiState(response.ok ? 'online' : 'offline');
    } catch {
      setApiState('offline');
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.app}>
        <View style={styles.sidebar}>
          <View>
            <Text style={styles.brand}>ARI ERP</Text>
            <Text style={styles.brandSub}>Gestión empresarial</Text>
          </View>
          <ScrollView style={styles.nav}>
            {groups.map((group) => (
              <View key={group} style={styles.group}>
                {group !== 'Principal' && <Text style={styles.groupTitle}>{group}</Text>}
                {modules.filter((item) => item.group === group).map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => setSelected(item.label)}
                    style={[styles.navItem, selected === item.label && styles.navItemActive]}
                  >
                    <Text style={[styles.navText, selected === item.label && styles.navTextActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
          <View style={styles.profile}>
            <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
            <View><Text style={styles.profileName}>Administrador</Text><Text style={styles.profileRole}>Empresa</Text></View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>{selected.toUpperCase()}</Text>
              <Text style={styles.heading}>{selected === 'Dashboard' ? 'Resumen general' : selected}</Text>
            </View>
            <Pressable onPress={checkApi} style={styles.apiButton}>
              <View style={[styles.dot, apiState === 'online' && styles.dotOnline, apiState === 'offline' && styles.dotOffline]} />
              <Text style={styles.apiText}>{apiState === 'checking' ? 'Comprobando' : apiState === 'online' ? 'API conectada' : 'Comprobar API'}</Text>
            </Pressable>
          </View>

          {selected === 'Dashboard' ? (
            <ScrollView contentContainerStyle={styles.dashboard}>
              <Text style={styles.greeting}>Buenos días</Text>
              <Text style={styles.description}>Este es el centro de operación de ARI ERP.</Text>

              <View style={styles.kpis}>
                {[
                  ['Clientes', '—', 'Se conectará al módulo de clientes'],
                  ['Ventas', '—', 'Se conectará al módulo de ventas'],
                  ['Ingresos', '—', 'Se conectará a finanzas'],
                  ['Inventario', '—', 'Se conectará al módulo de inventario']
                ].map(([title, value, note]) => (
                  <View key={title} style={styles.card}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardValue}>{value}</Text>
                    <Text style={styles.cardNote}>{note}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.columns}>
                <View style={styles.largeCard}>
                  <View style={styles.cardHeader}><Text style={styles.sectionTitle}>Actividad de ventas</Text><Text style={styles.period}>Este periodo</Text></View>
                  <View style={styles.empty}><Text style={styles.emptyTitle}>Aún no hay datos</Text><Text style={styles.emptyText}>La gráfica se alimentará cuando exista el módulo de ventas.</Text></View>
                </View>
                <View style={styles.largeCard}>
                  <View style={styles.cardHeader}><Text style={styles.sectionTitle}>Estado del inventario</Text></View>
                  <View style={styles.empty}><Text style={styles.emptyTitle}>Módulo pendiente</Text><Text style={styles.emptyText}>Aquí aparecerán existencias, bajo stock y movimientos.</Text></View>
                </View>
              </View>

              <View style={styles.largeCard}>
                <Text style={styles.sectionTitle}>Actividad reciente</Text>
                <View style={styles.activityRow}><Text style={styles.activityText}>Sistema preparado para auditoría y módulos ERP.</Text><Text style={styles.activityStatus}>Base</Text></View>
                <View style={styles.activityRow}><Text style={styles.activityText}>Conexión real con MongoDB Atlas</Text><Text style={styles.pending}>Pendiente</Text></View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.modulePlaceholder}>
              <Text style={styles.placeholderTitle}>{selected}</Text>
              <Text style={styles.placeholderText}>Este módulo está definido en el roadmap y se implementará conectado a la API y MongoDB, sin datos ficticios.</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f7f8fa' },
  app: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 245, backgroundColor: '#ffffff', borderRightColor: '#e6e8ec', borderRightWidth: 1, padding: 22 },
  brand: { color: '#111827', fontSize: 25, fontWeight: '800', letterSpacing: 1 },
  brandSub: { color: '#8b93a1', fontSize: 12, marginTop: 4 },
  nav: { marginTop: 28 },
  group: { marginBottom: 18 },
  groupTitle: { color: '#a0a6b0', fontSize: 11, fontWeight: '700', marginBottom: 7, textTransform: 'uppercase' },
  navItem: { borderRadius: 8, marginBottom: 3, paddingHorizontal: 12, paddingVertical: 10 },
  navItemActive: { backgroundColor: '#f0f1f4' },
  navText: { color: '#606977', fontSize: 14 },
  navTextActive: { color: '#111827', fontWeight: '700' },
  profile: { alignItems: 'center', borderTopColor: '#eef0f3', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingTop: 18 },
  avatar: { alignItems: 'center', backgroundColor: '#111827', borderRadius: 20, height: 38, justifyContent: 'center', width: 38 },
  avatarText: { color: '#ffffff', fontWeight: '800' },
  profileName: { color: '#222833', fontSize: 13, fontWeight: '700' },
  profileRole: { color: '#9299a5', fontSize: 11, marginTop: 2 },
  content: { flex: 1, minWidth: 0 },
  header: { alignItems: 'center', backgroundColor: '#ffffff', borderBottomColor: '#e6e8ec', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 20 },
  kicker: { color: '#9aa1ad', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  heading: { color: '#171b22', fontSize: 24, fontWeight: '800', marginTop: 5 },
  apiButton: { alignItems: 'center', borderColor: '#e1e4e9', borderRadius: 8, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  dot: { backgroundColor: '#b4bac4', borderRadius: 4, height: 8, width: 8 },
  dotOnline: { backgroundColor: '#2f9e68' },
  dotOffline: { backgroundColor: '#d65757' },
  apiText: { color: '#555e6b', fontSize: 12, fontWeight: '600' },
  dashboard: { padding: 32 },
  greeting: { color: '#171b22', fontSize: 26, fontWeight: '800' },
  description: { color: '#7b8390', fontSize: 14, marginTop: 5 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 25 },
  card: { backgroundColor: '#ffffff', borderColor: '#e5e8ed', borderRadius: 12, borderWidth: 1, flex: 1, minWidth: 180, padding: 20 },
  cardTitle: { color: '#747c89', fontSize: 12, fontWeight: '700' },
  cardValue: { color: '#171b22', fontSize: 30, fontWeight: '800', marginTop: 14 },
  cardNote: { color: '#a0a6b0', fontSize: 11, marginTop: 6 },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  largeCard: { backgroundColor: '#ffffff', borderColor: '#e5e8ed', borderRadius: 12, borderWidth: 1, flex: 1, minWidth: 320, padding: 20 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#252a33', fontSize: 14, fontWeight: '800' },
  period: { color: '#9ba2ad', fontSize: 11 },
  empty: { alignItems: 'center', minHeight: 170, justifyContent: 'center', paddingHorizontal: 20 },
  emptyTitle: { color: '#59616e', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#9ca3af', fontSize: 12, lineHeight: 19, marginTop: 7, maxWidth: 360, textAlign: 'center' },
  activityRow: { alignItems: 'center', borderTopColor: '#eef0f3', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  activityText: { color: '#66707e', fontSize: 12 },
  activityStatus: { color: '#2f9e68', fontSize: 11, fontWeight: '700' },
  pending: { color: '#9a7a2f', fontSize: 11, fontWeight: '700' },
  modulePlaceholder: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 40 },
  placeholderTitle: { color: '#171b22', fontSize: 28, fontWeight: '800' },
  placeholderText: { color: '#7b8390', fontSize: 14, lineHeight: 22, marginTop: 10, maxWidth: 520, textAlign: 'center' }
});
