import api from "./api";

const CommentService = {
  getComments: async (causeId) => {
    const response = await api.get(`/causes/${causeId}/comments`);
    return response.data;
  },

  postComment: async (causeId, content) => {
    const response = await api.post(`/causes/${causeId}/comments`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    await api.delete(`/comments/${commentId}`);
  },
};

export default CommentService;
