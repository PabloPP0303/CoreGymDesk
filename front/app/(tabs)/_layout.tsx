import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
 
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.black,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Inicio', tabBarIcon: () => null }} />
      <Tabs.Screen name="clases" options={{ title: 'Clases', tabBarIcon: () => null }} />
      <Tabs.Screen name="rutinas" options={{ title: 'Rutinas', tabBarIcon: () => null }} />
      <Tabs.Screen name="tienda" options={{ title: 'Tienda', tabBarIcon: () => null }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: () => null }} />
    </Tabs>
  );
}