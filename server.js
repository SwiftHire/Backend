require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dbConfig = require('./app/config/db.config');
const db = require('./app/models');
const authRouter = require('./app/routes/auth.routes');
const userRouter = require('./app/routes/user.routes');
const indexRouter = require('./app/routes/index.routes');
const rateLimiter = require('./app/middlewares/rateLimiter');

const app = express();
// disable response header that shows we're using Express
app.disable('x-powered-by');

db.mongoose
    .connect(dbConfig.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Successfully connect to MongoDB.');
        db.initialize();
    })
    .catch(err => {
        console.error('Connection error', err);
        process.exit();
    });

// const corsOptions = {
//     origin: [
//         'http://localhost:3000',
//         'https://www.majorgen.com',
//         'https://c666-2804-18-4077-87b5-9398-44c1-e0b3-5f9c.ngrok.io'
//     ],
//     optionsSuccessStatus: 200,
//     methods: 'GET, PUT, POST, DELETE, OPTIONS',
// };


app.use(cors());
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.use(function(req, res, next) {
    res.header(
        'Access-Control-Allow-Headers',
        'Authorization, Origin, Content-Type, Accept'
    );
    return next();
});

app.use('/users', authRouter);
app.use('/users', userRouter);
app.use('/api', indexRouter);

// simple route
app.get('/users', (req, res) => {
    res.json({ ping: 'pong' });
});

// catch 404 and forward to error handler
app.use(function(req, res) {
    res.status(404).send({ code: 404, message: 'Not found' });
});

// set port, listen for requests
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
