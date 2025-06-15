import { userApi } from '../api/userApi';

export const checkAdminAccess = async (navigation) => {
  try {
    const { data: userRole, error } = await userApi.checkUserRole();
    if (error) throw error;

    if (userRole !== 'admin') {
      navigation.navigate('Home');
      return false;
    }
    return true;
  } catch (error) {
    navigation.navigate('Home');
    return false;
  }
}; 