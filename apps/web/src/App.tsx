import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type ApiState = 'idle' | 'checking' | 'online' | 'offline';

export default function App() {
  const [apiState, setApiState] = useState<ApiState>('idle');

  async function checkApi() {
    setApiState('checking');
    try {
      const response = await fetch(`${apiUrl}/health`);
      setApiState(response.ok ? 'online' : 'offline');
    } catch {
      setApiState('offline');
    }
  }

  const statusLabel = {
    idle: 'Sin comprobar',
    checking: 'Comprobando...',
    online: 'API disponible',
    offline: 'API no disponible'
  }[apiState];

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.shell}>
        <Text style={styles.eyebrow}>ERP MULTIGESTIÓN</Text>
        <Text accessibilityRole="header" style={styles.title}>Centro operativo empresarial</Text>
        <Text style={styles.subtitle}>Base web conectada a la API central. Los módulos aparecerán cuando cuenten con persistencia y permisos del servidor.</Text>
        <View style={styles.statusPanel}>
          <View>
            <Text style={styles.panelLabel}>Estado de plataforma</Text>
            <Text style={styles.status}>{statusLabel}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={checkApi} style={styles.button}>
            <Text style={styles.buttonText}>Comprobar API</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3efe6' },
  shell: { flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center', justifyContent: 'center', padding: 32 },
  eyebrow: { color: '#bb5d3b', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#123b36', fontSize: 42, fontWeight: '700', marginTop: 14, maxWidth: 620 },
  subtitle: { color: '#52615c', fontSize: 17, lineHeight: 27, marginTop: 18, maxWidth: 650 },
  statusPanel: { alignItems: 'center', backgroundColor: '#fffdf8', borderColor: '#dfd7c9', borderRadius: 8, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 42, maxWidth: 650, padding: 22 },
  panelLabel: { color: '#7b8179', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  status: { color: '#123b36', fontSize: 20, fontWeight: '600', marginTop: 7 },
  button: { backgroundColor: '#bb5d3b', borderRadius: 6, paddingHorizontal: 18, paddingVertical: 13 },
  buttonText: { color: '#fffdf8', fontSize: 14, fontWeight: '700' }
});
