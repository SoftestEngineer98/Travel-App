module.exports = function(app, passport, db, fetch) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    // this is what happens when /profile requested -> get to /profile
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
            if (err) return console.log(err)
          // If they completed the preferences they'll go straight to the Profile Page, but if they didn't complete the preferences they'll get sent to settings.
          // if statements require true, but in this case we used false to keep from going to the profile.
            if (false) {
            // routes to PP
            //  what render does it creates html from ejs and then it sends that html to the browser and then the browser knows what to do
            res.render('profile.ejs', {
                user : req.user,
                messages: result
            })
            } else {
            // routes to setting
            // redirect is sending the browser to a different location and because we are sending it to a different page we don't need users and messages. User and messages are not needed because  they're the data that gets used during the rendering process to transform ejs to html. 
            res.redirect('/setting')
            }          

        })
    });

    // SETTING SECTION =========================
    app.get('/setting', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
            if (err) return console.log(err)
            res.render('setting.ejs', {
                user : req.user,
                messages: result
            })
        })
    });

    // From the setting.ejs I'm going to choose a form; In the request there a mediaType and language and will take that data and will filter it. In order to filter it will need to fetch that data and make it readable by translating it to json also by saying that it's data. This data has all the trending movies and by going through the language and mediaType will make it less complicated orr the consumer. Once that information is place will go b ack to the settings page and gice it to the profile and let it know this is the movie that will show 
    app.post('/setting', (req, res) => {
        console.log(req.body.mediaType, req.body.language)
        fetch(`https://api.themoviedb.org/3/trending/${req.body.mediaType}/week?api_key=40dee5a2a04714337a549eedcaa21958&language=end-US`)
        // .then() is a method 
        // anything inside the () is a parameter
        // .then always expects a callback as a parameter
        //  a callback is a function passed as a parameter meaning it has to be inside the ()
        .then(response => response.json())
        .then(data => data.results)
        .then(results => {
            console.log(results)
            console.log(results.filter(result => result.original_language === req.body.language))
            debugger// res.send({
            //     data: results.filter(result => result.original_language === req.body.language)
            // })
            // res.redirect('profile.ejs')
            res.render('profile.ejs', {data: results.filter(result => result.original_language === req.body.language)})
        })
        

        // .then(responce => console.log(responce))

        // data.results.forEach(result => console.log(original_language))

        // { }, (err, result) => {
        //     if (err) return console.log(err)
        //     console.log('saved to database')
        })
    

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
        db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
        })
    })

    // app.put('/upVote', (req, res) => {
    //   db.collection('messages')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp + 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })

    // app.put('/downVote', (req, res) => {
    //   db.collection('messages')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbDown - 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })

    app.delete('/messages', (req, res) => {
        db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
        })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        // post and /signup are the routes
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/setting', // redirect to the secure setting section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

//  Movie API key (v3 auth)
//  40dee5a2a04714337a549eedcaa21958

//  Example API Request
//  https://api.themoviedb.org/3/movie/550?api_key=40dee5a2a04714337a549eedcaa21958

//  API Read Access Token (v4 auth)
//  eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MGRlZTVhMmEwNDcxNDMzN2E1NDllZWRjYWEyMTk1OCIsInN1YiI6IjYxOGIzNjRkZGRkNTJkMDAyNmMyYzFjZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dALb4Ocx5LvchhMXfJjJRg3z7-h6aBQ2udUqxQox2OY

//  search for movies in api and then search for key words and then put them on my mongodb (user search preferences). Save stuff to the database. Once that starts working... if have any trouble slack Mark!