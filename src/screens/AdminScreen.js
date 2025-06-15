import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { carApi } from '../api/carApi';
import { userApi } from '../api/userApi';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const AdminScreen = () => {
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, users
  const [ads, setAds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCars, setPendingCars] = useState([]);
  const navigation = useNavigation();

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'users') {
        const usersData = await userApi.getAllUsers();
        setUsers(usersData);
      } else if (activeTab === 'pending') {
        const { data, error } = await carApi.getPendingCars();
        if (error) {
          console.error('Bekleyen ilanlar yükleme hatası:', error);
          setAds([]);
          return;
        }
        setAds(data || []);
      } else {
        // Onaylanan ilanlar için
        const { data, error } = await carApi.getApprovedCars();
        if (error) {
          console.error('Onaylanan ilanlar yükleme hatası:', error);
          setAds([]);
          return;
        }
        setAds(data || []);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setAds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPendingCars();
  }, [activeTab]);

  const loadPendingCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await carApi.getPendingCars();
      if (error) {
        console.error('Bekleyen ilanlar yükleme hatası:', error);
        setPendingCars([]);
        return;
      }
      setPendingCars(data || []);
    } catch (error) {
      console.error('Bekleyen ilanlar yükleme hatası:', error);
      setPendingCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adId) => {
    try {
      await carApi.updateCarStatus(adId, 'approved');
      Alert.alert('Başarılı', 'İlan onaylandı');
      loadData();
      loadPendingCars();
    } catch (error) {
      console.error('İlan onaylama hatası:', error);
      Alert.alert('Hata', 'İlan onaylanırken bir hata oluştu');
    }
  };

  const handleReject = async (adId) => {
    try {
      await carApi.updateCarStatus(adId, 'rejected');
      Alert.alert('Başarılı', 'İlan reddedildi');
      loadData();
      loadPendingCars();
    } catch (error) {
      console.error('İlan reddetme hatası:', error);
      Alert.alert('Hata', 'İlan reddedilirken bir hata oluştu');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await userApi.updateUserRole(userId, newRole);
      Alert.alert('Başarılı', 'Kullanıcı rolü güncellendi');
      loadData();
    } catch (error) {
      Alert.alert('Hata', 'Kullanıcı rolü güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Kullanıcıyı Sil',
      'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await userApi.deleteUser(userId);
              if (success) {
                Alert.alert('Başarılı', 'Kullanıcı başarıyla silindi');
                if (auth.currentUser && auth.currentUser.uid === userId) {
                  await signOut(auth);
                  navigation.replace('Login');
                } else {
                  loadData();
                }
              } else {
                Alert.alert('Hata', error || 'Kullanıcı silinirken bir hata oluştu');
              }
            } catch (error) {
              Alert.alert('Hata', 'Kullanıcı silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const handleDeleteCar = async (carId) => {
    Alert.alert(
      'İlanı Sil',
      'Bu ilanı silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await carApi.deleteCar(carId);
              if (success) {
                Alert.alert('Başarılı', 'İlan başarıyla silindi');
                navigation.navigate('Home', { refresh: true });
                loadData();
              } else {
                Alert.alert('Hata', error || 'İlan silinirken bir hata oluştu');
              }
            } catch (error) {
              Alert.alert('Hata', 'İlan silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const renderAdItem = ({ item }) => (
    <View style={styles.carItem}>
      <View style={styles.carHeader}>
        <Text style={styles.carTitle}>{item.brand || 'Belirtilmemiş'} {item.model || 'Belirtilmemiş'}</Text>
        <Text style={styles.carYear}>{item.year || 'Belirtilmemiş'}</Text>
      </View>
      
      <View style={styles.carDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fiyat:</Text>
          <Text style={styles.detailValue}>
            {item.price ? item.price.toLocaleString('tr-TR') : 'Belirtilmemiş'} TL
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kilometre:</Text>
          <Text style={styles.detailValue}>
            {item.mileage ? parseInt(item.mileage).toLocaleString('tr-TR') : 'Belirtilmemiş'} km
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Yakıt:</Text>
          <Text style={styles.detailValue}>{item.fuelType || 'Belirtilmemiş'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vites:</Text>
          <Text style={styles.detailValue}>{item.transmission || 'Belirtilmemiş'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Durum:</Text>
          <Text style={[
            styles.detailValue,
            styles.statusText,
            item.status === 'pending' && styles.statusPending,
            item.status === 'approved' && styles.statusApproved,
            item.status === 'rejected' && styles.statusRejected
          ]}>
            {item.status === 'pending' ? 'Onay Bekliyor' : 
             item.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
          </Text>
        </View>
      </View>

      <Text style={styles.descriptionTitle}>Açıklama:</Text>
      <Text style={styles.descriptionText}>{item.description || 'Açıklama bulunmamaktadır.'}</Text>

      <View style={styles.buttonContainer}>
        {item.status === 'pending' ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={() => handleApprove(item.id)}
            >
              <Text style={styles.buttonText}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleReject(item.id)}
            >
              <Text style={styles.buttonText}>Reddet</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDeleteCar(item.id)}
          >
            <Text style={styles.buttonText}>İlanı Sil</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name || `${item.firstName} ${item.lastName}`}</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.role}>Rol: {item.role}</Text>
      <View style={styles.buttonContainer}>
        {item.role !== 'admin' && (
          <TouchableOpacity
            style={[styles.button, styles.makeAdminButton]}
            onPress={() => handleUpdateUserRole(item.id, 'admin')}
          >
            <Text style={styles.buttonText}>Admin Yap</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Text style={styles.buttonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCarItem = ({ item }) => (
    <View style={styles.carItem}>
      <View style={styles.carHeader}>
        <Text style={styles.carTitle}>{item.brand || 'Belirtilmemiş'} {item.model || 'Belirtilmemiş'}</Text>
        <Text style={styles.carYear}>{item.year || 'Belirtilmemiş'}</Text>
      </View>
      
      <View style={styles.carDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fiyat:</Text>
          <Text style={styles.detailValue}>
            {item.price ? item.price.toLocaleString('tr-TR') : 'Belirtilmemiş'} TL
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kilometre:</Text>
          <Text style={styles.detailValue}>
            {item.mileage ? parseInt(item.mileage).toLocaleString('tr-TR') : 'Belirtilmemiş'} km
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Yakıt:</Text>
          <Text style={styles.detailValue}>{item.fuelType || 'Belirtilmemiş'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vites:</Text>
          <Text style={styles.detailValue}>{item.transmission || 'Belirtilmemiş'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Durum:</Text>
          <Text style={[
            styles.detailValue,
            styles.statusText,
            item.status === 'pending' && styles.statusPending,
            item.status === 'approved' && styles.statusApproved,
            item.status === 'rejected' && styles.statusRejected
          ]}>
            {item.status === 'pending' ? 'Onay Bekliyor' : 
             item.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
          </Text>
        </View>
      </View>

      <Text style={styles.descriptionTitle}>Açıklama:</Text>
      <Text style={styles.descriptionText}>{item.description || 'Açıklama bulunmamaktadır.'}</Text>

      {item.status === 'pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.buttonText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <Text style={styles.buttonText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Bekleyen İlanlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
            Onaylanan İlanlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Kullanıcılar
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={activeTab === 'users' ? users : activeTab === 'pending' ? pendingCars : ads}
          renderItem={activeTab === 'users' ? renderUserItem : activeTab === 'pending' ? renderCarItem : renderAdItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              loadData();
              loadPendingCars();
            }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'pending' && 'Bekleyen ilan bulunmamaktadır'}
                {activeTab === 'approved' && 'Onaylanan ilan bulunmamaktadır'}
                {activeTab === 'users' && 'Kullanıcı bulunmamaktadır'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  makeAdminButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  carItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  carYear: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  carDetails: {
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  descriptionTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  statusText: {
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#f39c12',
  },
  statusApproved: {
    color: '#27ae60',
  },
  statusRejected: {
    color: '#e74c3c',
  },
});

export default AdminScreen; 