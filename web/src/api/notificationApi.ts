import axiosClient from './axiosClient';

export const getMyNotificationsApi = async () => {
  const response = await axiosClient.get('/notifications');
  return response.data;
};

export const markNotificationAsReadApi = async (notificationId: number) => {
  const response = await axiosClient.patch(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};