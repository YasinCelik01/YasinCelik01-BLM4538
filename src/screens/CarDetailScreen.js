import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { favoriteApi } from '../api/favoriteApi';
import { auth } from '../services/firebase';

const CarDetailScreen = ({ route, navigation }) => {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { carId } = route.params;

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        const carDoc = await getDoc(doc(db, 'cars', carId));
        if (carDoc.exists()) {
          setCar({ id: carDoc.id, ...carDoc.data() });
        } else {
          Alert.alert('Hata', 'Araba bulunamadı');
          navigation.goBack();
        }
      } catch (error) {
        Alert.alert('Hata', 'Araba detayları yüklenirken bir hata oluştu');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    const checkFavorite = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const { data: carIds } = await favoriteApi.getUserFavoriteCarIds(userId);
      setIsFavorite(carIds?.includes(carId));
    };

    fetchCarDetails();
    checkFavorite();
  }, [carId]);

  const handleFavoriteToggle = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Hata', 'Kullanıcı bulunamadı.');
      return;
    }
    if (isFavorite) {
      const { success, error } = await favoriteApi.removeFavorite(userId, carId);
      if (success) {
        setIsFavorite(false);
      } else {
        Alert.alert('Hata', error || 'Favoriden çıkarılamadı.');
      }
    } else {
      const { success, error } = await favoriteApi.addFavorite(userId, carId);
      if (success) {
        setIsFavorite(true);
      } else {
        Alert.alert('Hata', error || 'Favoriye eklenemedi.');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {car.images && car.images.length > 0 ? (
        <Image
          source={{ uri: car.images[0] }}
          style={styles.carImage}
          resizeMode="cover"
        />
      ) : car.imageUrl ? (
        <Image
          source={{ uri: car.imageUrl }}
          style={styles.carImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.carImage, {backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'}]}>
          <Text>Fotoğraf yok</Text>
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{car.brand} {car.model}</Text>
        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite ? styles.favActive : styles.favInactive]}
          onPress={handleFavoriteToggle}
        >
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? 'Favoriden Çıkar' : 'Favorilere Ekle'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{car.price} TL</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Yıl:</Text>
            <Text style={styles.detailValue}>{car.year}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kilometre:</Text>
            <Text style={styles.detailValue}>{car.km} km</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Yakıt:</Text>
            <Text style={styles.detailValue}>{car.fuelType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vites:</Text>
            <Text style={styles.detailValue}>{car.transmission}</Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Açıklama</Text>
          <Text style={styles.description}>{car.description}</Text>
        </View>

        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>İletişim Bilgileri</Text>
          <Text style={styles.contactInfo}>{car.sellerName}</Text>
          <Text style={styles.contactInfo}>{car.sellerPhone}</Text>
          <Text style={styles.contactInfo}>{car.sellerEmail}</Text>
        </View>
      </View>
    </ScrollView>
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
  carImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  priceContainer: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  price: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  contactContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 5,
  },
  favoriteButton: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  favActive: {
    backgroundColor: '#e74c3c',
  },
  favInactive: {
    backgroundColor: '#3498db',
  },
  favoriteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CarDetailScreen; 