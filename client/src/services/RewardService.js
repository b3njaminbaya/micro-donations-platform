import api from "./api";

const RewardService = {
  getCatalog: async () => {
    const response = await api.get("/rewards");
    return response.data;
  },

  getMine: async () => {
    const response = await api.get("/rewards/mine");
    return response.data;
  },

  redeem: async (rewardId) => {
    const response = await api.post(`/rewards/${rewardId}/redeem`);
    return response.data;
  },

  createReward: async (rewardData) => {
    const response = await api.post("/rewards", rewardData);
    return response.data;
  },

  deleteReward: async (rewardId) => {
    await api.delete(`/rewards/${rewardId}`);
  },
};

export default RewardService;
