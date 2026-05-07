import Joi from 'joi';

export const createPrivateConversationSchema = Joi.object({
  targetUserId: Joi.number().integer().positive().required(),
});

export const createGroupConversationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  memberIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required(),
});