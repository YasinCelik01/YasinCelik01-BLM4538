import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Picker
} from 'react-native';
import { db, storage } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../services/firebase';
import * as Crypto from 'expo-crypto';

const FUEL_TYPES = ['Benzin', 'Dizel', 'LPG', 'Elektrik', 'Hibrit'];
const TRANSMISSIONS = ['Manuel', 'Otomatik', 'Yarı Otomatik'];

function uuidv4() {
  const bytes = Crypto.getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return (
    hex.substr(0, 8) + '-' +
    hex.substr(8, 4) + '-' +
    hex.substr(12, 4) + '-' +
    hex.substr(16, 4) + '-' +
    hex.substr(20, 12)
  );
}

const AddCarScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [carData, setCarData] = useState({
    brand: '',
    model: '',
    year: '',
    km: '',
    price: '',
    fuelType: FUEL_TYPES[0],
    transmission: TRANSMISSIONS[0],
    description: '',
    imageUrl: '',
  });
  const [showFuelPicker, setShowFuelPicker] = useState(false);
  const [showTransmissionPicker, setShowTransmissionPicker] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hata', 'Galeriye erişim izni gerekli');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCarData({ ...carData, imageUrl: result.assets[0].uri });
    }
  };

  const uploadImage = async (uri) => {
    try {
      // Resmi blob'a dönüştür
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Benzersiz dosya adı oluştur
      const filename = `${uuidv4()}.jpg`;
      const storageRef = ref(storage, `car_images/${filename}`);
      
      // Metadata ekle
      const metadata = {
        contentType: 'image/jpeg',
      };
      
      // Dosyayı yükle
      await uploadBytes(storageRef, blob, metadata);
      
      // İndirme URL'sini al
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      throw new Error('Resim yüklenirken bir hata oluştu');
    }
  };

  const validateNumericInput = (value, field) => {
    if (value === '') return true;
    
    // Sadece sayısal karakterler kontrolü
    if (!/^\d*$/.test(value)) return false;
    
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    
    switch (field) {
      case 'year':
        // Yıl için özel kontrol
        const currentYear = new Date().getFullYear();
        // 4 karakterden fazla girilmesini engelle
        if (value.length > 4) return false;
        // Yıl aralığı kontrolü sadece 4 karakter girildiğinde yapılır
        if (value.length === 4) {
          const yearValue = parseInt(value);
          if (yearValue < 1900 || yearValue > currentYear) {
            Alert.alert(
              'Geçersiz Yıl',
              `Lütfen 1900 ile ${currentYear} arasında bir yıl girin.`
            );
            return false;
          }
        }
        return true;
      case 'km':
        // Kilometre için özel kontrol
        if (numValue < 0) {
          Alert.alert('Geçersiz Kilometre', 'Kilometre değeri negatif olamaz.');
          return false;
        }
        if (value.length > 7) {
          Alert.alert('Geçersiz Kilometre', 'Kilometre değeri çok yüksek.');
          return false;
        }
        return true;
      case 'price':
        // Fiyat için özel kontrol
        if (numValue <= 0) {
          Alert.alert('Geçersiz Fiyat', 'Fiyat 0\'dan büyük olmalıdır.');
          return false;
        }
        if (value.length > 10) {
          Alert.alert('Geçersiz Fiyat', 'Fiyat değeri çok yüksek.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNumericChange = (text, field) => {
    // Boş değer kontrolü
    if (text === '') {
      setCarData({ ...carData, [field]: text });
      return;
    }

    // Sadece sayısal değer kontrolü
    if (!/^\d*$/.test(text)) {
      Alert.alert('Uyarı', 'Lütfen sadece sayı girin');
      return;
    }

    // Alan özel validasyonları
    if (validateNumericInput(text, field)) {
      setCarData({ ...carData, [field]: text });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Kullanıcı profilini çek
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      let sellerPhone = '';
      let sellerName = '';
      if (userSnap.exists()) {
        const userData = userSnap.data();
        sellerPhone = userData.phone || '';
        sellerName = userData.firstName && userData.lastName
          ? userData.firstName + ' ' + userData.lastName
          : '';
      }
      const carId = uuidv4();
      const carDataToSave = {
        id: carId,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.km,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        description: carData.description,
        images: carData.imageUrl ? [carData.imageUrl] : [],
        sellerId: auth.currentUser.uid,
        sellerEmail: auth.currentUser.email,
        sellerPhone,
        sellerName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const carRef = doc(db, 'cars', carId);
      await setDoc(carRef, carDataToSave);
      
      Alert.alert(
        'Başarılı', 
        'İlanınız başarıyla eklendi ve onay için gönderildi.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Form alanlarını sıfırla
              setCarData({
                brand: '',
                model: '',
                year: '',
                km: '',
                price: '',
                fuelType: FUEL_TYPES[0],
                transmission: TRANSMISSIONS[0],
                description: '',
                imageUrl: '',
              });
              navigation.navigate('Main', { screen: 'Home' });
            }
          }
        ]
      );
    } catch (error) {
      console.error('İlan ekleme hatası:', error);
      Alert.alert('Hata', 'İlan eklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!carData.brand || !carData.model || !carData.year || !carData.price) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun');
      return false;
    }

    if (!validateNumericInput(carData.year, 'year') || 
        !validateNumericInput(carData.km, 'km') || 
        !validateNumericInput(carData.price, 'price')) {
      Alert.alert('Hata', 'Lütfen geçerli sayısal değerler girin');
      return false;
    }

    return true;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Marka"
          value={carData.brand}
          onChangeText={(text) => setCarData({ ...carData, brand: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Model"
          value={carData.model}
          onChangeText={(text) => setCarData({ ...carData, model: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Yıl"
          value={carData.year}
          onChangeText={(text) => handleNumericChange(text, 'year')}
          keyboardType="numeric"
          maxLength={4}
        />
        <TextInput
          style={styles.input}
          placeholder="Kilometre"
          value={carData.km}
          onChangeText={(text) => handleNumericChange(text, 'km')}
          keyboardType="numeric"
          maxLength={7}
        />
        <TextInput
          style={styles.input}
          placeholder="Fiyat (TL)"
          value={carData.price}
          onChangeText={(text) => handleNumericChange(text, 'price')}
          keyboardType="numeric"
          maxLength={10}
        />

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowFuelPicker(true)}
        >
          <Text style={styles.pickerText}>Yakıt Türü: {carData.fuelType}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTransmissionPicker(true)}
        >
          <Text style={styles.pickerText}>Vites: {carData.transmission}</Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Açıklama"
          value={carData.description}
          onChangeText={(text) => setCarData({ ...carData, description: text })}
          multiline
          numberOfLines={4}
        />
        
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>
            {carData.imageUrl ? 'Resmi Değiştir' : 'Resim Seç'}
          </Text>
        </TouchableOpacity>

        {carData.imageUrl && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: carData.imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>İlanı Yayınla</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFuelPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yakıt Türü Seçin</Text>
            {FUEL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setCarData({ ...carData, fuelType: type });
                  setShowFuelPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowFuelPicker(false)}
            >
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTransmissionPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vites Tipi Seçin</Text>
            {TRANSMISSIONS.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setCarData({ ...carData, transmission: type });
                  setShowTransmissionPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowTransmissionPicker(false)}
            >
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalCancel: {
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});

export default AddCarScreen; 