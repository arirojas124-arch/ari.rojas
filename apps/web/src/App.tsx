import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type ApiState = 'idle' | 'checking' | 'online' | 'offline';
type FormState = { companyName: string; companySlug: string; name: string; email: string; password: string };

export default function App() {
  const [apiState, setApiState] = useState<ApiState>('idle');
  const [form, setForm] = useState<FormState>({ companyName: '', companySlug: '', name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [registering, setRegistering] = useState(false);

  async function checkApi() {
    setApiState('checking');
    try {
      const response = await fetch(`${apiUrl}/health`);
      setApiState(response.ok ? 'online' : 'offline');
    } catch {
      setApiState('offline');
    }
  }

  async function register() {
    setMessage('');
    if (!form.companyName || !form.companySlug || !form.name || !form.email || form.password.length < 12) {
      setMessage('Completa todos los campos. La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    setRegistering(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? 'No se pudo registrar la cuenta.');
      setMessage('Registro creado correctamente en MongoDB.');
      setForm({ companyName: '', companySlug: '', name: '', email: '', password: '' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la cuenta.');
    } finally {
      setRegistering(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.shell}>
        <Text style={styles.eyebrow}>ARI ERP</Text>
        <Text style={styles.title}>Crear cuenta administrativa</Text>
        <Text style={styles.subtitle}>Este registro crea la empresa y su usuario administrador mediante la API.</Text>

        <View style={styles.form}>
          {[
            ['companyName', 'Nombre de la empresa', 'Mi Empresa'],
            ['companySlug', 'Identificador de empresa', 'mi-empresa'],
            ['name', 'Nombre del administrador', 'Ari Rojas'],
            ['email', 'Correo electrónico', 'correo@ejemplo.com']
          ].map(([key, label, placeholder]) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                value={form[key as keyof FormState]}
                onChangeText={(value) => setForm({ ...form, [key]: value })}
                placeholder={placeholder}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          ))}
          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput value={form.password} onChangeText={(value) => setForm({ ...form, password: value })} secureTextEntry style={styles.input} />
          </View>

          <Pressable onPress={register} disabled={registering} style={styles.button}>
            <Text style={styles.buttonText}>{registering ? 'Registrando...' : 'Crear cuenta'}</Text>
          </Pressable>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.statusPanel}>
            <View>
              <Text style={styles.panelLabel}>Estado de API</Text>
              <Text style={styles.status}>{apiState === 'online' ? 'API disponible' : apiState === 'checking' ? 'Comprobando...' : apiState === 'offline' ? 'API no disponible' : 'Sin comprobar'}</Text>
            </View>
            <Pressable onPress={checkApi} style={styles.secondaryButton}><Text style={styles.secondaryText}>Comprobar</Text></Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3efe6' },
  shell: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', justifyContent: 'center', padding: 32 },
  eyebrow: { color: '#bb5d3b', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#123b36', fontSize: 36, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#52615c', fontSize: 16, lineHeight: 24, marginTop: 12 },
  form: { backgroundColor: '#fffdf8', borderColor: '#dfd7c9', borderRadius: 10, borderWidth: 1, marginTop: 28, padding: 24 },
  field: { marginBottom: 14 },
  label: { color: '#52615c', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderColor: '#d8d1c5', borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  button: { backgroundColor: '#bb5d3b', borderRadius: 6, marginTop: 6, padding: 13 },
  buttonText: { color: '#fffdf8', fontWeight: '700', textAlign: 'center' },
  message: { color: '#52615c', fontSize: 13, marginTop: 12 },
  statusPanel: { alignItems: 'center', borderTopColor: '#e8e1d6', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingTop: 18 },
  panelLabel: { color: '#7b8179', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  status: { color: '#123b36', fontSize: 16, fontWeight: '600', marginTop: 4 },
  secondaryButton: { borderColor: '#d8d1c5', borderRadius: 6, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  secondaryText: { color: '#52615c', fontWeight: '700' }
});
