const {Rental} = require("../../models/rental");
const {User} = require("../../models/user");
const mongoose = require("mongoose");
const request = require('supertest')
const moment = require('moment')
const {Movie} = require("../../models/movie");
let server;
let customerId;
let movieId;
let rental;
let token;
let movie;
describe('/api/returns', () => {
    const exec = () => {
        return request(server).post('/api/returns').set('x-auth-token', token).send({customerId, movieId})
    }
    beforeEach(async () => {
        token = new User().generateAuthToken();
        server = require('../../index');
        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();
        movie = new Movie({
            _id: movieId,
            title: '12345',
            dailyRentalRate: 2,
            genre: {name: '12345'},
            numberInStock: 10
        })
        await movie.save();
        rental = new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345',
            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2
            }
        })
        await rental.save();
    })
    afterEach(async () => {
        await server.close();
        await Rental.remove({})
        await Movie.remove({})
    })
    it('should return 401 if client is not logged in!', async function () {
        token = '';
        const res= await exec()
        expect(res.status).toBe(401);
    });
    it('should 400 if client sends invalid customer id', async function () {
        customerId = '';
        const res= await exec()
        expect(res.status).toBe(400);
    });
    it('should 400 if client sends invalid movie id', async function () {
        movieId = ''
        const res= await exec()
        expect(res.status).toBe(400);
    });
    it('should 404 if no rental found for customer/movie', async function () {
        await Rental.remove({});
        const res= await exec()
        expect(res.status).toBe(404);
    });
    it('should 400 if return is already processed', async function () {
        rental.dateReturned = new Date();
        await rental.save();
        const res= await exec()
        expect(res.status).toBe(400);
    });
    it('should 200 if return is valid request', async function () {
        const res= await exec()
        expect(res.status).toBe(200);
    });
    it('should set the returnDate if input is valid', async function () {
        const res= await exec()
        const rentalInDb = await Rental.findById(rental._id);
        const diff = new Date() - rentalInDb.dateReturned;
        expect(diff).toBeLessThan(10 * 1000);
    });
    it('should set the rentalFee if input is valid', async function () {
        rental.dateOut = moment().add(-7, 'days').toDate();
        await rental.save();
        const res= await exec()
        const rentalInDb = await Rental.findById(rental._id);
        expect(rentalInDb.rentalFee).toBe(14);
    });
    it('should increase the movie stock if input is valid', async function () {
        const res= await exec()
        const movieInDb = await Movie.findById(movieId);
        expect(movieInDb.numberInStock).toBe(movie.numberInStock+1);
    });
    it('should return the rental if input is valid', async function () {
        const res= await exec()
        expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['dateOut', 'dateReturned', 'rentalFee', 'customer', 'movie']));
    });
})