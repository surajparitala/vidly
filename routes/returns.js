const express = require('express');
const router = express.Router();
const {Rental} =  require('../models/rental')
const {Movie} = require('../models/movie')
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi);

router.post('/', [auth, validate(validateReturn)] , async (req, res) => {
    const rental = await Rental.lookUp(req.body.customerId, req.body.movieId);
    if (!rental) return res.status(404).send('Not found');
    if (rental.dateReturned) return res.status(400).send('Return already processed');

    rental.return();
    await rental.save();

    await Movie.updateOne({_id: rental.movie._id}, {$inc: {numberInStock: 1}})
    return res.send(rental);
});

function validateReturn(req) {
    const schema = {
        customerId: Joi.objectId().required(),
        movieId: Joi.objectId().required(),
    };
    return Joi.validate(req, schema);
}

module.exports = router;