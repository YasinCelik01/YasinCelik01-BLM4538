import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { carApi } from '../api/carApi';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { favoriteApi } from '../api/favoriteApi';
import { auth } from '../services/firebase';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteCarIds, setFavoriteCarIds] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterMinYear, setFilterMinYear] = useState('');
  const [filterMaxYear, setFilterMaxYear] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinKm, setFilterMinKm] = useState('');
  const [filterMaxKm, setFilterMaxKm] = useState('');
  const [filterFuelType, setFilterFuelType] = useState('');
  const [filterTransmission, setFilterTransmission] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadCars();
      loadFavorites();
    }, [])
  );

  const loadCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await carApi.getApprovedCars();
      if (error) {
        console.error('Araçları getirme hatası:', error);
        return;
      }
      setCars(data || []);
    } catch (error) {
      console.error('Araçları getirme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFavorites = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const { data: carIds } = await favoriteApi.getUserFavoriteCarIds(userId);
    setFavoriteCarIds(carIds || []);
  };

  const handleFavoriteToggle = async (carId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Hata', 'Kullanıcı bulunamadı.');
      return;
    }
    if (favoriteCarIds.includes(carId)) {
      const { success, error } = await favoriteApi.removeFavorite(userId, carId);
      if (success) {
        setFavoriteCarIds(favoriteCarIds.filter(id => id !== carId));
      } else {
        Alert.alert('Hata', error || 'Favoriden çıkarılamadı.');
      }
    } else {
      const { success, error } = await favoriteApi.addFavorite(userId, carId);
      if (success) {
        setFavoriteCarIds([...favoriteCarIds, carId]);
      } else {
        Alert.alert('Hata', error || 'Favoriye eklenemedi.');
      }
    }
  };

  // Filtrelenmiş arabalar
  const filteredCars = cars.filter(car => {
    if (filterBrand && car.brand.toLowerCase() !== filterBrand.toLowerCase()) return false;
    if (filterModel && car.model.toLowerCase() !== filterModel.toLowerCase()) return false;
    if (filterMinYear && Number(car.year) < Number(filterMinYear)) return false;
    if (filterMaxYear && Number(car.year) > Number(filterMaxYear)) return false;
    if (filterMinPrice && Number(car.price) < Number(filterMinPrice)) return false;
    if (filterMaxPrice && Number(car.price) > Number(filterMaxPrice)) return false;
    if (filterMinKm && Number(car.km || car.mileage) < Number(filterMinKm)) return false;
    if (filterMaxKm && Number(car.km || car.mileage) > Number(filterMaxKm)) return false;
    if (filterFuelType && car.fuelType !== filterFuelType) return false;
    if (filterTransmission && car.transmission !== filterTransmission) return false;
    return true;
  });

  const renderCarItem = ({ item }) => (
    <View style={styles.carItem}>
      <TouchableOpacity
        style={{ flex: 1 }}
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
      <TouchableOpacity
        style={[styles.favoriteButton, favoriteCarIds.includes(item.id) ? styles.favActive : styles.favInactive]}
        onPress={() => handleFavoriteToggle(item.id)}
      >
        <Text style={styles.favoriteButtonText}>
          {favoriteCarIds.includes(item.id) ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Filtreler Butonu */}
      <TouchableOpacity
        style={{ backgroundColor: '#3498db', padding: 10, margin: 10, borderRadius: 8 }}
        onPress={() => setFilterModalVisible(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Filtreler</Text>
      </TouchableOpacity>

      {/* Filtre Modalı */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '90%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Filtrele</Text>
            <TextInput placeholder="Marka" value={filterBrand} onChangeText={setFilterBrand} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
            <TextInput placeholder="Model" value={filterModel} onChangeText={setFilterModel} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
            <TextInput placeholder="Min Yıl" value={filterMinYear} onChangeText={setFilterMinYear} style={{ borderBottomWidth: 1, marginBottom: 8 }} keyboardType="numeric" />
            <TextInput placeholder="Max Yıl" value={filterMaxYear} onChangeText={setFilterMaxYear} style={{ borderBottomWidth: 1, marginBottom: 8 }} keyboardType="numeric" />
            <TextInput placeholder="Min Fiyat" value={filterMinPrice} onChangeText={setFilterMinPrice} style={{ borderBottomWidth: 1, marginBottom: 8 }} keyboardType="numeric" />
            <TextInput placeholder="Max Fiyat" value={filterMaxPrice} onChangeText={setFilterMaxPrice} style={{ borderBottomWidth: 1, marginBottom: 8 }} keyboardType="numeric" />
            <TextInput placeholder="Min Km" value={filterMinKm} onChangeText={setFilterMinKm} style={{ borderBottomWidth: 1, marginBottom: 8 }} keyboardType="numeric" />
            <TextInput placeholder="Max Km" value={filterMaxKm} onChangeText={setFilterMaxKm} style={{ borderBottomWidth: 1, marginBottom: 8 }} keyboardType="numeric" />
            <TextInput placeholder="Yakıt Türü" value={filterFuelType} onChangeText={setFilterFuelType} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
            <TextInput placeholder="Vites" value={filterTransmission} onChangeText={setFilterTransmission} style={{ borderBottomWidth: 1, marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={{ backgroundColor: '#e74c3c', padding: 10, borderRadius: 8, flex: 1, marginRight: 5 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setFilterBrand(''); setFilterModel(''); setFilterMinYear(''); setFilterMaxYear(''); setFilterMinPrice(''); setFilterMaxPrice(''); setFilterMinKm(''); setFilterMaxKm(''); setFilterFuelType(''); setFilterTransmission('');
              }} style={{ backgroundColor: '#95a5a6', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Temizle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Arabalar Listesi */}
      <FlatList
        data={filteredCars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
    flexDirection: 'row',
    alignItems: 'center',
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
  favoriteButton: {
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
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
    fontSize: 22,
    textAlign: 'center',
  },
});

export default HomeScreen; 