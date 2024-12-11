 /*Writing all basic setup code here*/
if(process.env.NODE_ENV != "production"){// We have written this if statement because, we don't use ".env" file in production 
                                         // phase
    require('dotenv').config();
}
// console.log(process.env.SECRET);

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');


const listingRouter = require('./routes/listing.js');// This file is requiring router that we have exported from listing.js file of routes folder which will be used by the middleware defined below.
const reviewRouter = require('./routes/review.js');// This file is requiring router that we have exported from review.js file of routes folder which will be used by the middleware defined below.
const userRouter = require('./routes/user.js');//  This file is requiring router that we have exported from user.js file of routes folder which will be used by the middleware defined below.


/*code for creating database*/
// const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

const dbUrl = process.env.ATLASDB_URL;

main()
.then(()=>{
    console.log('connection successful with DB.');
})
.catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
};


app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, '/public')));



//for store refer day55file2
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        //From here we are shifting the secret to ".env" file so that after pushing the files to github no one can see this code.
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("err", () => {
    console.log("ERROR IN MONGO SESSION STORE", err);
})


const sessionOptions = {
    store,
    //From here we are shifting the secret to ".env" file so that after pushing the files to github no one can see this code.
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60* 60 * 1000,
        httpOnly: true,
    }
};




// app.get('/', (req, res)=>{
//     res.send('Hi I a, main page.')
// });


app.use(session(sessionOptions));// middleware for express-session
app.use(flash());// middleware so that we can use flash messages. This flash middleware line must be above the routes 
                 // line in which we are using the flash messages.

// To implement the passport we have to use the session options because, for implementing local strategy the login 
// credential of our user for one session will be same. If user is opening the website from the another tab of same 
// browser in single session then, we must not request login again and again from the user in every request of i.e. in 
// single session that's why passport is using session.

// So that's why we write code related to the passport just after the middleware of session where session has aleady been implemented..

app.use(passport.initialize()); // By this the passport will get initialized once for each request as a middleware.
app.use(passport.session()); // By this middleware every request can know of which session it is a part of. That the 
                             // request has been sent by the same user for next page or from any other user.
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate())); // This middleware will identify that all the local strategies at 
                                                      // we have defined within the paspport. So, we are saying that all the 
                                                      // users and requests that are coming must be authenticate by the all
                                                      // the local strategy and to authentiacte these users autenticate() 
                                                      // method will be used. authenticate means- user must signin and login.
                                                      // authenticate is a static method bydefault added by passsport-local-mongoose.

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser()); // serializeUser() -> we store all information related to the user into the session.
passport.deserializeUser(User.deserializeUser()); // deserializeUser() -> we remove/ unstore all information related the user from the session.


//Here, we are definig a middleware in which we are defining a locals variable which can be directly used in ejs files.
app.use((req, res, next)=>{
    res.locals.success = req.flash("success"); // success and error are getting defined as local variables because, they are 
    res.locals.error = req.flash("error");     // getting directly used in the ejs files as flash messages.
    // console.log(res.locals.success);
    res.locals.currUser = req.user;// req.user is getting defined as locals variable so we can use it in navbar.ejs
                                   // file for adding (signup, login) / logout functionality.
    // console.log("req.user is", req.user);
    next();  
});

//Creating route for a fake user.
// app.get('/demouser', async(req, res)=>{
//     let fakeUser = new User({
//         email: 'rishabh@gmail.com',
//         username: 'rishabh'// In our userSchema we have not defined schema for username, but then too we are taking input 
                            // for username because, passport-local Mongoose automatically add username and password inside 
                            // the Schema.
//     });

     // register(user, password, cb) Convenience method to register a new user instance with a given password. 
     // Checks if username is unique. 
//     let registeredUser = await User.register(fakeUser, 'helloWorld');// We are using register for storing our user credentials into database.
//     res.send(registeredUser);
// });


/*This middleware we have ceated so that wherever "/listings" come, it automatically uses above required listingRouter file for file listing.js file i.e. in routes folder in which we have shifted all the routes of listings. */
/*This middleware will handle all routes related to listings. */
app.use("/listings", listingRouter);

/*This middleware we have ceated so that wherever "/listings/:id/reviews" come, it automatically uses above required reviewRouter file from review.js file i.e. in routes folder in which we have shifted all the routes of reviews. */
/*This middleware will handle all routes related to reviews. */
app.use("/listings/:id/reviews", reviewRouter);

/*This middleware we have ceated so that wherever "/signup" come, it automatically uses above required userRouter file from user.js file i.e. in routes folder in which we written routes of user Signup. */
/*This middleware will handle all routes related to user Signup. */
app.use('/', userRouter);



// This will pass the error to app.use middleware when the route requet will not match to any of the above routes. That's why "*" is used which indicates all.
// So. if we send the route request to "http://localhost:8080/random" which does'nt exists. So, error will come page not found!.
app.all("*", (req, res, next)=>{
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went wrong"} = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.render("error.ejs", {message});
    // res.status(statusCode).send(message);
});

const port = 8080;
app.listen(port, ()=>{
    console.log(`server is listening on port:${port}`);
});