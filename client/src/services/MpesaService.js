import api from "./api";

const MpesaService = {
  initiateStkPush: async ({ phoneNumber, amount, causeId }) => {
    const response = await api.post("/mpesa/stk-push", { phoneNumber, amount, causeId });
    return response.data;
  },
};

export default MpesaService;
