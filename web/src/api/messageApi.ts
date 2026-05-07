import axiosClient from './axiosClient';

export const getMessagesByConversationApi = async (conversationId: number) => {
  const response = await axiosClient.get(`/messages/${conversationId}`);
  return response.data;
};

export const sendMessageApi = async (payload: {
  conversationId: number;
  content: string;
}) => {
  const response = await axiosClient.post('/messages', payload);
  return response.data;
};

export const sendImageMessageApi = async (payload: {
  conversationId: number;
  file: File;
  content?: string;
}) => {
  const formData = new FormData();
  formData.append('conversationId', String(payload.conversationId));
  formData.append('image', payload.file);

  if (payload.content) {
    formData.append('content', payload.content);
  }

  const response = await axiosClient.post('/messages/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};