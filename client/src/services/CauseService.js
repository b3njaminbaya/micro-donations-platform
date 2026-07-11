import api from "./api";

const CauseService = {
  getAllCauses: async ({ page = 1, perPage = 12, category, country, search } = {}) => {
    const response = await api.get("/causes", {
      params: { page, per_page: perPage, category, country, search: search || undefined },
    });
    return response.data;
  },

  getCountries: async () => {
    const response = await api.get("/causes/countries");
    return response.data;
  },

  getFeaturedCauses: async () => {
    const response = await api.get("/causes/featured");
    return response.data;
  },

  getMyCauses: async () => {
    const response = await api.get("/causes/mine");
    return response.data;
  },

  getCauseById: async (id) => {
    const response = await api.get(`/causes/${id}`);
    return response.data;
  },

  createCause: async (causeData) => {
    const response = await api.post("/causes", causeData);
    return response.data;
  },

  updateCause: async (id, causeData) => {
    const response = await api.patch(`/causes/${id}`, causeData);
    return response.data;
  },

  deleteCause: async (id) => {
    await api.delete(`/causes/${id}`);
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default CauseService;
