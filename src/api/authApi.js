import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const authApi = {
  // Kullanıcı kaydı
  async register(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore'a kullanıcı bilgilerini kaydet
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        email: user.email,
        createdAt: new Date()
      });

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          ...userData
        }
      };
    } catch (error) {
      let errorMessage = 'Kayıt olurken bir hata oluştu';
      
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

  // Kullanıcı girişi
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        return { success: false, error: 'Kullanıcı bilgileri bulunamadı' };
      }

      return {
        success: true,
        user: {
          id: userCredential.user.uid,
          ...userDoc.data()
        }
      };
    } catch (error) {
      let errorMessage = 'Giriş yapılırken bir hata oluştu';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Bu hesap devre dışı bırakılmış';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'E-posta veya şifre hatalı';
      }

      return { success: false, error: errorMessage };
    }
  },

  // Çıkış yapma
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Çıkış yapılırken bir hata oluştu' };
    }
  },

  // Hesap silme
  async deleteAccount() {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
        return { success: true };
      }
      return { success: false, error: 'Kullanıcı bulunamadı' };
    } catch (error) {
      return { success: false, error: 'Hesap silinirken bir hata oluştu' };
    }
  }
}; 