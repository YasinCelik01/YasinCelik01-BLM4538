import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase yapılandırma bilgilerinizi buraya yapıştırın
const firebaseConfig = {
  apiKey: "AIzaSyA-6OpGj3iUA8jVqVEY1kj7SY_Hpc-19Vw",
  authDomain: "arabasatis-51235.firebaseapp.com",
  projectId: "arabasatis-51235",
  storageBucket: "arabasatis-51235.firebasestorage.app",
  messagingSenderId: "773487578616",
  appId: "1:773487578616:web:bf41e0f1fd75bd2556da0d",
  measurementId: "G-8BN6GDTREW"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 