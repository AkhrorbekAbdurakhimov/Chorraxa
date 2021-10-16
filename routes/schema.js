const Joi = require('joi');

const computers = Joi.object({
    crossroad_id: Joi.string().required(),
});

const cameras = Joi.object({
    computer_id: Joi.string().required(),
});

const autoSearchSchema = Joi.object({
    from_date: Joi.string().required(),
    to_date: Joi.string().required(),
    car_number: Joi.array().items(Joi.string()),
    object_id: Joi.array().items(Joi.number()),
    qoida_buzarlik: Joi.boolean().default(false),
});

const search = Joi.object({
    from_date: Joi.string().required(),
    to_date: Joi.string().required(),
  
    car_number: Joi.array().items(Joi.string()),
    camera_id: Joi.array().items(Joi.string()),
    computer_id: Joi.array().items(Joi.string()),
    crossroad_id: Joi.array().items(Joi.string()),
    rules: Joi.array().items(Joi.string()),
    models: Joi.array().items(Joi.string()),
    countries: Joi.array().items(Joi.string()),
    colors: Joi.array().items(Joi.string()),
  
    lines: Joi.array().items(Joi.string()),
    qoida_buzarlik: Joi.boolean().default(false),
    is_passive: Joi.boolean().default(false),
    is_active: Joi.boolean().default(false),
  
    limit: Joi.number().default(10),
    offset: Joi.number().default(0),
    filter: Joi.string(),
});

const getPhoto = Joi.object({
    camera_id: Joi.number().required(),
    the_date: Joi.string().required(),
});
  
module.exports = { computers, cameras, autoSearchSchema, search, getPhoto }