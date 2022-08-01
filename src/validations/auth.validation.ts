import Joi from 'joi'

export const signUp = {
  body: Joi.object().keys({
    publicKey: Joi.string().required(),
    signature: Joi.string().required(),
  }),
}

export const signIn = {
  body: Joi.object().keys({
    publicKey: Joi.string().required(),
    signature: Joi.string().required(),
  }),
}
