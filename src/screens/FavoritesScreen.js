import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { favoriteApi } from '../api/favoriteApi';
import { carApi } from '../api/carApi';
import { auth } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';

const FavoritesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [favoriteCars, setFavoriteCars] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Hata', 'Kullanıcı bulunamadı.');
        setLoading(false);
        return;
      }
      const { data: carIds, error } = await favoriteApi.getUserFavoriteCarIds(userId);
      if (error) throw new Error(error);
      if (!carIds || carIds.length === 0) {
        setFavoriteCars([]);
        setLoading(false);
        return;
      }
      // Favori arabaların detaylarını çek
      const carDetailsPromises = carIds.map(carId => carApi.getCarById(carId));
      const carDetailsResults = await Promise.all(carDetailsPromises);
      const cars = carDetailsResults
        .filter(res => res.data)
        .map(res => res.data);
      setFavoriteCars(cars);
    } catch (error) {
      Alert.alert('Hata', 'Favoriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const renderCarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.carItem}
      onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
    >
      {item.images && item.images.length > 0 && (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.carImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.carInfo}>
        <Text style={styles.carTitle}>{item.brand} {item.model}</Text>
        <Text style={styles.carYear}>Yıl: {item.year}</Text>
        <Text style={styles.carPrice}>{item.price} TL</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favori İlanlarım</Text>
      </View>
      <FlatList
        data={favoriteCars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>Favori ilanınız yok.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  listContainer: {
    padding: 15,
  },
  carItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 200,
  },
  carInfo: {
    padding: 15,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  carYear: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  carPrice: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: 'bold',
  },
});

export default FavoritesScreen; 