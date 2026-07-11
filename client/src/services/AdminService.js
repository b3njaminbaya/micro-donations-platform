import api from "./api";

const AdminService = {
  getUsers: async ({ page = 1, perPage = 20, search } = {}) => {
    const response = await api.get("/admin/users", {
      params: { page, per_page: perPage, search: search || undefined },
    });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
};

export default AdminService;
