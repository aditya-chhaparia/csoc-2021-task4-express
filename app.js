if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
var mongoose = require("mongoose");
var passport = require("passport");
var auth = require("./controllers/auth");
var store = require("./controllers/store");
var User = require("./models/user");
var localStrategy = require("passport-local");
var session = require("express-session");
var flash = require("connect-flash");
//importing the middleware object to use its functions
var middleware = require("./middleware"); //no need of writing index.js as directory always calls index.js by default
var port = process.env.PORT || 3000;

app.use(express.static("public"));

/*  CONFIGURE WITH PASSPORT */
const secret = process.env.SECRET || "thisshouldbeabettersecret!";
const sessionConfig = {
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize()); //middleware that initialises Passport.
app.use(passport.session());
passport.use(new localStrategy(User.authenticate())); //used to authenticate User model with passport
passport.serializeUser(User.serializeUser()); //used to serialize the user for the session
passport.deserializeUser(User.deserializeUser()); // used to deserialize the user

app.use(express.urlencoded({ extended: true })); //parses incoming url encoded data from forms to json objects
app.set("view engine", "ejs");

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/library";
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

app.get("/", (req, res) => {
  res.render("index", { title: "Library" });
});

app.get("/books", store.getAllBooks);
app.get("/book/:id", store.getBook);
app.get("/books/loaned", middleware.isLoggedIn, store.getLoanedBooks);
app.post("/books/issue", middleware.isLoggedIn, store.issueBook);
app.post("/books/return", middleware.isLoggedIn, store.returnBook);
app.post("/books/search-book", store.searchBooks);

app.get("/login", auth.getLogin);
app.post("/login", auth.postLogin);
app.get("/register", auth.getRegister);
app.post("/register", auth.postRegister);
app.get("/logout", auth.logout);

app.use("*", (req, res) => {
  req.flash("error", "Page not Found");
  res.render("index", { title: "Library" });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
