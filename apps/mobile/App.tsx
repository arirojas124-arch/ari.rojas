import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

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
        <Text style={styles.title}>Operación empresarial desde cualquier lugar</Text>
        <Text style={styles.subtitle}>Base móvil conectada a la API central. Los módulos se habilitarán junto con autenticación y permisos del servidor.</Text>
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
  shell: { flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { color: '#bb5d3b', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#123b36', fontSize: 34, fontWeight: '700', marginTop: 14 },
  subtitle: { color: '#52615c', fontSize: 16, lineHeight: 25, marginTop: 18 },
  statusPanel: { backgroundColor: '#fffdf8', borderColor: '#dfd7c9', borderRadius: 8, borderWidth: 1, marginTop: 36, padding: 20 },
  panelLabel: { color: '#7b8179', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  status: { color: '#123b36', fontSize: 19, fontWeight: '600', marginTop: 7 },
  button: { alignItems: 'center', backgroundColor: '#bb5d3b', borderRadius: 6, marginTop: 18, paddingVertical: 13 },
  buttonText: { color: '#fffdf8', fontSize: 14, fontWeight: '700' }
});
