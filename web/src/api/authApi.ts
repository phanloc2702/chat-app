import axiosClient from './axiosClient';

export const registerApi = async (payload: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await axiosClient.post('/auth/register', payload);
  return response.data;
};

export const loginApi = async (payload: {
  email: string;
  password: string;
}) => {
  const response = await axiosClient.post('/auth/login', payload);
  return response.data;
};