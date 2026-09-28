    import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const chatService = {
  // Fetch only channels the logged-in user belongs to
  getMyGroups: async () => {
    const response = await axios.get(`${BASE_URL}/chat/groups/my-groups`, getAuthHeaders());
    return response.data;
  },

  // Create a new secure group
  createGroup: async (name, description) => {
    const response = await axios.post(
      `${BASE_URL}/chat/groups/create`,
      { name, description },
      getAuthHeaders()
    );
    return response.data;
  },

  // Add member to group (creator only)
  addMemberToGroup: async (groupName, username) => {
    const response = await axios.post(
      `${BASE_URL}/chat/groups/${groupName}/add-member`,
      { username },
      getAuthHeaders()
    );
    return response.data;
  },

  // Upload file attachment to Cloudinary + DB
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await axios.post(`${BASE_URL}/chat/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};