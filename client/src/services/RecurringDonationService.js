import api from "./api";

const RecurringDonationService = {
  create: async ({ causeId, amount, phoneNumber, frequency }) => {
    const response = await api.post("/recurring-donations", {
      cause_id: causeId,
      amount,
      phone_number: phoneNumber,
      frequency,
    });
    return response.data;
  },

  getMine: async () => {
    const response = await api.get("/recurring-donations/mine");
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/recurring-donations/${id}`);
    return response.data;
  },
};

export default RecurringDonationService;
