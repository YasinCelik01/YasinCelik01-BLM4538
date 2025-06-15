import { db, auth } from '../services/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { carApi } from './carApi';

export const userApi = {
  // Kullanıcı bilgilerini kaydetme
  createUserProfile: async (userId, userData) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        email: userData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı bilgilerini getirme
  getUserProfile: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { data: userDoc.data(), error: null };
      }
      return { data: null, error: 'Kullanıcı bulunamadı' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Kullanıcı bilgilerini güncelleme
  updateUserProfile: async (userId, userData) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...userData,
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı verilerini silme
  deleteUserProfile: async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı rolünü ayarlama
  setUserRole: async (userId, role) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: role,
        updatedAt: new Date().toISOString()
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Tüm kullanıcıları getir
  getAllUsers: async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      console.error('Kullanıcıları getirme hatası:', error);
      return [];
    }
  },

  // Kullanıcı silme (admin için)
  deleteUserByAdmin: async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı rolünü kontrol etme
  checkUserRole: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        console.error('Kullanıcı bulunamadı:', userId);
        return { role: null, error: 'Kullanıcı bulunamadı' };
      }

      const userData = userDoc.data();
      console.log('Kullanıcı rolü:', userData.role);
      
      return { 
        role: userData.role || 'user',
        error: null 
      };
    } catch (error) {
      console.error('Rol kontrol hatası:', error);
      return { 
        role: null, 
        error: error.message 
      };
    }
  },

  // Admin kayıt fonksiyonu
  registerAdmin: async (userData, adminCode) => {
    try {
      // Admin kodu kontrolü
      if (adminCode !== 'ARABASATIS2024') {
        throw new Error('Geçersiz admin kodu');
      }

      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Firestore'da kullanıcı dokümanı oluştur
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userData.email,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Admin kayıt hatası:', error);
      let errorMessage = 'Kayıt sırasında bir hata oluştu';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  updateUserRole: async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { error };
    }
  },

  // Kullanıcıyı tamamen silme
  deleteUser: async (userId) => {
    try {
      // 1. Kullanıcının ilanlarını sil
      const { success: carsDeleted, error: carsError } = await carApi.deleteUserCars(userId);
      if (!carsDeleted) {
        console.error('İlanlar silinirken hata:', carsError);
      }

      // 2. Firestore'dan kullanıcıyı sil
      await deleteDoc(doc(db, 'users', userId));

      // 3. Firebase Authentication'dan kullanıcıyı sil
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        await deleteUser(currentUser);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      return { success: false, error: error.message };
    }
  },
};

export const checkAdminAccess = async (navigation) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace('Login');
      return false;
    }

    const { data: userProfile, error } = await getUserProfile(user.uid);
    if (error || !userProfile) {
      navigation.replace('Login');
      return false;
    }

    if (userProfile.role !== 'admin') {
      navigation.replace('Home');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Rol kontrol hatası:', error);
    navigation.replace('Login');
    return false;
  }
}; 