import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

export const favoriteApi = {
  // Favori ekle
  addFavorite: async (userId, carId) => {
    try {
      // Aynı favori var mı kontrol et
      const q = query(collection(db, 'favorites'), where('userId', '==', userId), where('carId', '==', carId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { success: false, error: 'Bu ilan zaten favorilerde.' };
      }
      await addDoc(collection(db, 'favorites'), {
        userId,
        carId,
        createdAt: new Date().toISOString(),
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Favoriden çıkar
  removeFavorite: async (userId, carId) => {
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', userId), where('carId', '==', carId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return { success: false, error: 'Favori bulunamadı.' };
      }
      // Tüm eşleşen favorileri sil
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'favorites', docSnap.id)));
      await Promise.all(deletePromises);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcının favori arabalarını getir (sadece carId listesi döner)
  getUserFavoriteCarIds: async (userId) => {
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const carIds = querySnapshot.docs.map(docSnap => docSnap.data().carId);
      return { data: carIds, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
}; 