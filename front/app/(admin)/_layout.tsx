import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.black,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Panel' }} />
      <Tabs.Screen name="usuarios" options={{ title: 'Usuarios' }} />
      <Tabs.Screen name="clases" options={{ title: 'Clases' }} />
      <Tabs.Screen name="ejercicios" options={{ title: 'Ejercicios' }} />
      <Tabs.Screen name="productos" options={{ title: 'Productos' }} />
      <Tabs.Screen name="cuotas" options={{ title: 'Cuotas' }} />
    </Tabs>
  );
}