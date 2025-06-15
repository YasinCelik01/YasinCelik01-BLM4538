import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { carApi } from '../api/carApi';
import { useNavigation, useRoute } from '@react-navigation/native';

const EditCarScreen = () => {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params;

  useEffect(() => {
    loadCarData();
  }, []);

  const loadCarData = async () => {
    try {
      const { data, error } = await carApi.getCarById(carId);
      if (error) throw error;
      setCar(data);
    } catch (error) {
      Alert.alert('Hata', 'İlan bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!car.brand) newErrors.brand = 'Marka alanı zorunludur';
    if (!car.model) newErrors.model = 'Model alanı zorunludur';
    if (!car.year) newErrors.year = 'Yıl alanı zorunludur';
    if (!car.price) newErrors.price = 'Fiyat alanı zorunludur';
    if (!car.description) newErrors.description = 'Açıklama alanı zorunludur';
    if (car.price && isNaN(car.price)) newErrors.price = 'Geçerli bir fiyat giriniz';
    if (car.year && (car.year < 1900 || car.year > new Date().getFullYear())) {
      newErrors.year = 'Geçerli bir yıl giriniz';
    }
    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const { success, error } = await carApi.updateCar(carId, car);
      if (success) {
        Alert.alert('Başarılı', 'İlan başarıyla güncellendi', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Hata', error);
      }
    } catch (error) {
      Alert.alert('Hata', 'İlan güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
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
      <View style={styles.formContainer}>
        <TextInput
          style={[styles.input, errors.brand && styles.inputError]}
          value={car?.brand}
          onChangeText={(text) => setCar({ ...car, brand: text })}
          placeholder="Marka"
        />
        {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}

        <TextInput
          style={[styles.input, errors.model && styles.inputError]}
          value={car?.model}
          onChangeText={(text) => setCar({ ...car, model: text })}
          placeholder="Model"
        />
        {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}

        <TextInput
          style={[styles.input, errors.year && styles.inputError]}
          value={car?.year?.toString()}
          onChangeText={(text) => setCar({ ...car, year: parseInt(text) || '' })}
          placeholder="Yıl"
          keyboardType="numeric"
        />
        {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}

        <TextInput
          style={[styles.input, errors.price && styles.inputError]}
          value={car?.price?.toString()}
          onChangeText={(text) => setCar({ ...car, price: parseInt(text) || '' })}
          placeholder="Fiyat"
          keyboardType="numeric"
        />
        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          value={car?.description}
          onChangeText={(text) => setCar({ ...car, description: text })}
          placeholder="Açıklama"
          multiline
          numberOfLines={4}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Kaydet</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.buttonText}>İptal</Text>
          </TouchableOpacity>
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
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditCarScreen; 