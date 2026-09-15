import api from "./api";

const PayoutService = {
  request: async (causeId, { amount, phoneNumber }) => {
    const response = await api.post(`/causes/${causeId}/payouts`, { amount, phone_number: phoneNumber });
    return response.data;
  },

  getForCause: async (causeId) => {
    const response = await api.get(`/causes/${causeId}/payouts`);
    return response.data;
  },

  getAll: async ({ page = 1, perPage = 20, status } = {}) => {
    const response = await api.get("/admin/payouts", {
      params: { page, per_page: perPage, status: status || undefined },
    });
    return response.data;
  },
};

export default PayoutService;
