import api from "./api";

const DonationService = {
  makeDonation: async (donationData) => {
    const response = await api.post("/donations", donationData);
    return response.data;
  },

  getDonationsByCause: async (causeId) => {
    const response = await api.get(`/donations/cause/${causeId}`);
    return response.data;
  },

  getMyDonations: async () => {
    const response = await api.get("/donations/mine");
    return response.data;
  },

  downloadReceipt: async (donationId) => {
    const response = await api.get(`/donations/${donationId}/receipt`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${donationId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default DonationService;
