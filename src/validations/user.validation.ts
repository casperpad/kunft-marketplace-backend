import Joi from 'joi'

export const addToken = {
  body: Joi.object().keys({
    contractHash: Joi.string().required(),
    tokenId: Joi.string().required(),
  }),
}
