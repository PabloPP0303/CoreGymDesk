import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
 
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
      <Tabs.Screen name="dashboard" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="clases" options={{ title: 'Clases', tabBarIcon: ({color, size}) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="rutinas" options={{ title: 'Rutinas', tabBarIcon: ({color, size}) => <Ionicons name="fitness-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="tienda" options={{ title: 'Tienda', tabBarIcon: ({color, size}) => <Ionicons name="cart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({color, size}) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}