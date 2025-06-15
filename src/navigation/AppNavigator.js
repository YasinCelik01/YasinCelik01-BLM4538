import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AddCarScreen from '../screens/AddCarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CarDetailScreen from '../screens/CarDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AdminScreen from '../screens/AdminScreen';
import EditCarScreen from '../screens/EditCarScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#fff',
      paddingTop: insets.top,
      paddingBottom: insets.bottom 
    }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingBottom: 5,
            height: 60,
          },
          headerStyle: {
            backgroundColor: '#3498db',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'AddCar') iconName = focused ? 'add-circle' : 'add-circle-outline';
            else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
        <Tab.Screen name="AddCar" component={AddCarScreen} options={{ title: 'Araba Ekle' }} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorilerim' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
      </Tab.Navigator>
    </View>
  );
};

const AppNavigator = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#3498db" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#3498db',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#fff',
            },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="CarDetail" component={CarDetailScreen} options={{ title: 'Araba Detayı' }} />
          <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin Paneli' }} />
          <Stack.Screen name="EditCar" component={EditCarScreen} options={{ title: 'İlanı Düzenle' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigator; 