import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  conversationId: Joi.number().integer().positive().required(),
  content: Joi.string().trim().min(1).required(),
});