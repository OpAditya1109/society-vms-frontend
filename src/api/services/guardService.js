// src/api/services/guardService.js
import api from '../interceptors';

export const guardService = {
  /** Get all guards + duty status for the society */
  getActiveGuards: () =>
    api.get('/guards/active').then((r) => r.data),

  /** Guard: toggle own duty status */
  updateStatus: (payload) =>
    api.patch('/guards/status', payload).then((r) => r.data),

  /** Resident: send message to a guard */
  sendMessage: (guardId, message) =>
    api.post(`/guards/${guardId}/message`, { message }).then((r) => r.data),

  /** Guard: get messages received */
  getMessages: () =>
    api.get('/guards/messages').then((r) => r.data),

  /** Guard: mark a message read */
  markRead: (messageId) =>
    api.patch(`/guards/messages/${messageId}/read`).then((r) => r.data),

  /** Guard: reply to a resident message */
  replyToMessage: (messageId, reply) =>
    api.patch(`/guards/messages/${messageId}/reply`, { reply }).then((r) => r.data),
};