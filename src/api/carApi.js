import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const carApi = {
  // Tüm araçları getir
  getAllCars: async () => {
    try {
      const carsSnapshot = await getDocs(collection(db, 'cars'));
      const cars = [];
      carsSnapshot.forEach((doc) => {
        cars.push({ id: doc.id, ...doc.data() });
      });
      return cars;
    } catch (error) {
      console.error('Araçları getirme hatası:', error);
      throw error;
    }
  },

  // Yeni araç ekle
  addCar: async (carData) => {
    try {
      const carRef = doc(collection(db, 'cars'));
      await setDoc(carRef, {
        ...carData,
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: carRef.id };
    } catch (error) {
      console.error('Araç ekleme hatası:', error);
      throw error;
    }
  },

  // Araç durumunu güncelle (admin için)
  updateCarStatus: async (carId, status) => {
    try {
      await updateDoc(doc(db, 'cars', carId), {
        status,
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Araç sil
  deleteCar: async (carId) => {
    try {
      await deleteDoc(doc(db, 'cars', carId));
      return { success: true };
    } catch (error) {
      console.error('Araç silme hatası:', error);
      throw error;
    }
  },

  // Bekleyen araçları getir (admin için)
  getPendingCars: async () => {
    try {
      const q = query(collection(db, 'cars'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const cars = [];
      querySnapshot.forEach((doc) => {
        cars.push({ id: doc.id, ...doc.data() });
      });
      return { data: cars, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Kullanıcının arabalarını getirme
  getUserCars: async (userId) => {
    try {
      const q = query(collection(db, "cars"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  // İlan oluşturma
  createCar: async (carData) => {
    try {
      const carRef = doc(db, 'cars', carData.id);
      await setDoc(carRef, {
        ...carData,
        status: 'pending', // İlan durumu: pending (beklemede), approved (onaylandı), rejected (reddedildi)
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // İlanı güncelleme
  updateCar: async (carId, carData) => {
    try {
      await updateDoc(doc(db, 'cars', carId), {
        ...carData,
        updatedAt: serverTimestamp()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // İlanı silme
  deleteCar: async (carId) => {
    try {
      await deleteDoc(doc(db, 'cars', carId));
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // İlan detayını getirme
  getCar: async (carId) => {
    try {
      const carDoc = await getDoc(doc(db, 'cars', carId));
      if (carDoc.exists()) {
        return { data: carDoc.data(), error: null };
      }
      return { data: null, error: 'İlan bulunamadı' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // İlanı onaylama (admin için)
  approveCar: async (carId) => {
    try {
      await updateDoc(doc(db, 'cars', carId), {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // İlanı reddetme (admin için)
  rejectCar: async (carId) => {
    try {
      await updateDoc(doc(db, 'cars', carId), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcının ilanlarını getirme
  getUserAds: async (userId) => {
    try {
      const carsRef = collection(db, 'cars');
      const q = query(carsRef, where('sellerId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const ads = [];
      querySnapshot.forEach((doc) => {
        ads.push({ id: doc.id, ...doc.data() });
      });
      
      return { data: ads, error: null };
    } catch (error) {
      console.error('Kullanıcı ilanları getirme hatası:', error);
      return { data: null, error: error.message };
    }
  },

  // İlan detaylarını getir
  getCarById: async (carId) => {
    try {
      const carDoc = await getDoc(doc(db, 'cars', carId));
      if (carDoc.exists()) {
        return { data: { id: carDoc.id, ...carDoc.data() }, error: null };
      }
      return { data: null, error: 'İlan bulunamadı' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Onaylanan ilanları getir
  getApprovedCars: async () => {
    try {
      const q = query(collection(db, 'cars'), where('status', '==', 'approved'));
      const querySnapshot = await getDocs(q);
      const cars = [];
      querySnapshot.forEach((doc) => {
        cars.push({ id: doc.id, ...doc.data() });
      });
      return { data: cars, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Kullanıcıya ait tüm ilanları sil
  deleteUserCars: async (userId) => {
    try {
      const carsRef = collection(db, 'cars');
      const userCarsQuery = query(carsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(userCarsQuery);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return { success: true, error: null };
    } catch (error) {
      console.error('İlan silme hatası:', error);
      return { success: false, error: error.message };
    }
  }
}; 