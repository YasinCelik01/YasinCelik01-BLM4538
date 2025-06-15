import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { auth, db } from '../services/firebase';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { carApi } from '../api/carApi';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [myAds, setMyAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'ads') {
      loadMyAds();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        
        // Kullanıcı profilini yükle
        const { data: profileData, error: profileError } = await userApi.getUserProfile(currentUser.uid);
        if (profileError) throw profileError;
        setUserProfile(profileData);
        
        // Kullanıcı rolünü kontrol et
        const { role, error: roleError } = await userApi.checkUserRole(currentUser.uid);
        if (roleError) throw roleError;
        setUserRole(role);
      }
    } catch (error) {
      Alert.alert('Hata', 'Profil bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = (profile) => {
    const newErrors = {};
    if (userRole === 'admin') {
      if (!profile.name) newErrors.firstName = 'Ad Soyad alanı zorunludur';
      if (!profile.email) newErrors.email = 'E-posta alanı zorunludur';
      if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
        newErrors.email = 'Geçerli bir e-posta adresi giriniz';
      }
    } else {
      if (!profile.firstName) newErrors.firstName = 'Ad alanı zorunludur';
      if (!profile.lastName) newErrors.lastName = 'Soyad alanı zorunludur';
      if (!profile.phone) newErrors.phone = 'Telefon alanı zorunludur';
      if (!profile.email) newErrors.email = 'E-posta alanı zorunludur';
      if (profile.phone && !/^[0-9]{10}$/.test(profile.phone)) {
        newErrors.phone = 'Geçerli bir telefon numarası giriniz';
      }
      if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
        newErrors.email = 'Geçerli bir e-posta adresi giriniz';
      }
    }
    return newErrors;
  };

  const handleEditStart = () => {
    // Admin için name alanını, normal kullanıcı için firstName ve lastName alanlarını ayarla
    const initialProfile = userRole === 'admin'
      ? { ...userProfile, name: userProfile?.name || '' }
      : { ...userProfile, firstName: userProfile?.firstName || '', lastName: userProfile?.lastName || '' };
    
    setEditedProfile(initialProfile);
    setIsEditing(true);
    setErrors({});
  };

  const handleSave = async () => {
    const validationErrors = validateProfile(editedProfile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const { success, error } = await userApi.updateUserProfile(user.uid, editedProfile);
      if (success) {
        setUserProfile(editedProfile);
        setIsEditing(false);
        setEditedProfile(null);
        Alert.alert('Başarılı', 'Profil başarıyla güncellendi');
      } else {
        Alert.alert('Hata', error);
      }
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(null);
    setErrors({});
  };

  const loadMyAds = async () => {
    setAdsLoading(true);
    try {
      const { data, error } = await carApi.getUserAds(user.uid);
      if (error) throw error;
      setMyAds(data);
    } catch (error) {
      Alert.alert('Hata', 'İlanlar yüklenirken bir hata oluştu');
    } finally {
      setAdsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { success: deleteProfileSuccess, error: deleteProfileError } = 
        await userApi.deleteUserProfile(user.uid);
      
      if (deleteProfileError) {
        Alert.alert('Hata', 'Profil verileri silinirken bir hata oluştu');
        return;
      }

      const { success: deleteAuthSuccess, error: deleteAuthError } = 
        await authApi.deleteAccount();
      
      if (deleteAuthError) {
        Alert.alert('Hata', 'Hesap silinirken bir hata oluştu');
        return;
      }

      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Hata', 'Hesap silinirken bir hata oluştu');
    }
  };

  const handleDeleteAd = async (carId) => {
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
                setMyAds(myAds.filter(ad => ad.id !== carId));
                Alert.alert('Başarılı', 'İlan başarıyla silindi');
              } else {
                Alert.alert('Hata', error);
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
    <View style={styles.adItem}>
      {item.images && item.images.length > 0 && (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.adImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.adInfo}>
        <Text style={styles.adTitle}>{item.brand} {item.model}</Text>
        <Text style={styles.adPrice}>{item.price} TL</Text>
        <Text style={[
          styles.adStatus,
          item.status === 'pending' && styles.statusPending,
          item.status === 'approved' && styles.statusApproved,
          item.status === 'rejected' && styles.statusRejected
        ]}>
          {item.status === 'pending' ? 'Onay Bekliyor' : 
           item.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
        </Text>
        <Text style={styles.adDate}>
          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </Text>
        {(item.status === 'pending' || item.status === 'approved') && (
          <View style={styles.adActions}>
            <TouchableOpacity
              style={[styles.adActionButton, styles.editButton]}
              onPress={() => navigation.navigate('EditCar', { carId: item.id })}
            >
              <Text style={styles.adActionButtonText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adActionButton, styles.deleteButton]}
              onPress={() => handleDeleteAd(item.id)}
            >
              <Text style={styles.adActionButtonText}>Sil</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profil
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ads' && styles.activeTab]}
          onPress={() => setActiveTab('ads')}
        >
          <Text style={[styles.tabText, activeTab === 'ads' && styles.activeTabText]}>
            İlanlarım
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'profile' ? (
        <ScrollView style={styles.profileContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userProfile?.firstName?.charAt(0).toUpperCase() || 
                 userProfile?.name?.charAt(0).toUpperCase() || 
                 user?.email?.charAt(0).toUpperCase()}
              </Text>
            </View>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={editedProfile?.firstName || editedProfile?.name}
                  onChangeText={(text) => {
                    if (userRole === 'admin') {
                      setEditedProfile({ ...editedProfile, name: text });
                    } else {
                      setEditedProfile({ ...editedProfile, firstName: text });
                    }
                  }}
                  placeholder={userRole === 'admin' ? 'Ad Soyad' : 'Ad'}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                {userRole !== 'admin' && (
                  <>
                    <TextInput
                      style={[styles.input, errors.lastName && styles.inputError]}
                      value={editedProfile?.lastName}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, lastName: text })}
                      placeholder="Soyad"
                    />
                    {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                  </>
                )}
                {userRole !== 'admin' && (
                  <>
                    <TextInput
                      style={[styles.input, errors.phone && styles.inputError]}
                      value={editedProfile?.phone}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, phone: text })}
                      placeholder="Telefon"
                      keyboardType="phone-pad"
                    />
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                  </>
                )}
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={editedProfile?.email}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
                  placeholder="E-posta"
                  keyboardType="email-address"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </>
            ) : (
              <>
                <Text style={styles.name}>
                  {userRole === 'admin' 
                    ? userProfile?.name 
                    : `${userProfile?.firstName} ${userProfile?.lastName}`}
                </Text>
                <Text style={styles.email}>{userProfile?.email}</Text>
                {userRole !== 'admin' && <Text style={styles.phone}>{userProfile?.phone}</Text>}
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Kaydet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.buttonText}>İptal</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={handleEditStart}
                >
                  <Text style={styles.buttonText}>Profili Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.logoutButton]}
                  onPress={handleLogout}
                >
                  <Text style={styles.buttonText}>Çıkış Yap</Text>
                </TouchableOpacity>
                {userRole === 'admin' && (
                  <TouchableOpacity
                    style={[styles.button, styles.adminButton]}
                    onPress={() => navigation.navigate('Admin')}
                  >
                    <Text style={styles.buttonText}>Admin Paneli</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.buttonText}>Hesabı Sil</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.adsContainer}>
          {adsLoading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : (
            <FlatList
              data={myAds}
              renderItem={renderAdItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.adsList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Henüz ilanınız bulunmuyor.</Text>
              }
            />
          )}
        </View>
      )}

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hesabı Sil</Text>
            <Text style={styles.modalText}>
              Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalButtonText}>Hesabı Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileContainer: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  phone: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 1,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  adminButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#c0392b',
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  adsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  adsList: {
    padding: 15,
  },
  adItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  adImage: {
    width: '100%',
    height: 200,
  },
  adInfo: {
    padding: 15,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  adPrice: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  statusPending: {
    color: '#f39c12',
  },
  statusApproved: {
    color: '#2ecc71',
  },
  statusRejected: {
    color: '#e74c3c',
  },
  adDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 20,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  adActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  adActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 