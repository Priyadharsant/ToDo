import express from "express";
import bodyParser from "body-parser";
import pg, { Pool } from "pg";
import path from "path";
import bcrypt from "bcrypt";
import passport from "passport";
import flash from "connect-flash";
import session from "express-session";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
    session({
        secret: "Secrrrrete:",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "view"));
app.use(express.static("public"));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

const port = 3000;

const db = new Pool({
    connectionString:
        "postgresql://priyan:cMTz3PeLHmjuOTmNeuztzEIPIZ7L2yi3@dpg-d4m0k1re5dus7381l3ig-a.oregon-postgres.render.com:5432/todo_p6ma",
    ssl: { rejectUnauthorized: false },
});

db.connect();

app.get("/", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.render("login.ejs", { incorrect: false });
    }

    const todo = await db.query("SELECT * FROM todo WHERE userid = $1", [
        req.user.id,
    ]);

    res.render("main.ejs", {
        todoList: todo.rows,
        username: req.user.username,
        profile: req.user.profile_img,
    });
});

app.get("/login", (req, res) => {
    res.render("login.ejs", { incorrect: false });
});

app.get("/register", (req, res) => {
    res.render("signup.ejs", { duplicateUser: false });
});


app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const checkUser = await db.query(
        "SELECT username FROM users WHERE username = $1",
        [username]
    );

    if (checkUser.rows.length > 0) {
        return res.render("signup.ejs", { duplicateUser: true });
    }

    await db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        [username, hashed]
    );

    res.redirect("/login");
});

app.post("/login", (req, res, next) => {
    passport.authenticate(
        "local",
        {
            failureFlash: true,
        },
        (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                return res.render("login.ejs", {
                    incorrect: true,
                    msg: info.message,
                });
            }

            req.logIn(user, (err) => {
                if (err) return next(err);
                return res.redirect("/");
            });
        }
    )(req, res, next);
});


app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/login",
    })
);
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GaclientID,
            clientSecret: process.env.GaclientSecret,
            callbackURL: process.env.GacallbackURL,
            userProfileURL: process.env.GauserProfileURL,
        },
        async (accessToken, refreshToken, profile, cb) => {
            try {
                const result = await db.query(
                    "SELECT * FROM users WHERE gmail = $1",
                    [profile.email]
                );

                if (result.rows.length === 0) {
                    const newUser = await db.query(
                        "INSERT INTO users (username, gmail, password, profile_img) VALUES ($1, $2, $3, $4) RETURNING *",
                        [
                            profile.displayName,
                            profile.email,
                            "google",
                            profile.photos[0].value,
                        ]
                    );
                    return cb(null, newUser.rows[0]);
                }

                return cb(null, result.rows[0]);
            } catch (err) {
                return cb(err);
            }
        }
    )
);


passport.use(
    "local",
    new Strategy(async (username, password, cb) => {
        try {
            const result = await db.query(
                "SELECT * FROM users WHERE username = $1",
                [username]
            );

            if (result.rows.length === 0) {
                return cb(null, false, { message: "User not found" });
            }

            const user = result.rows[0];

            if (user.password === "google") {
                return cb(null, false, {
                    message: "Login with Google for this account",
                });
            }

            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                return cb(null, false, { message: "Password Incorrect" });
            }

            return cb(null, {
                id: user.id,
                username: user.username,
                profile_img: user.profile_img,
            });
        } catch (err) {
            cb(err);
        }
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
    const result = await db.query(
        "SELECT id, username, profile_img FROM users WHERE id = $1",
        [id]
    );
    cb(null, result.rows[0]);
});

app.post("/updateTask", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.render("login.ejs", { incorrect: false });
    }

    const { updatedTask, taskId } = req.body;

    await db.query("UPDATE todo SET task = $1 WHERE id = $2", [
        updatedTask,
        taskId,
    ]);

    res.redirect("/");
});

app.post("/deleteTask", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.render("login.ejs", { incorrect: false });
    }

    const { id, task } = req.body;

    const now = new Date();
    const shortDateTime =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        " " +
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");

    await db.query("DELETE FROM todo WHERE id = $1", [id]);

    await db.query(
        "INSERT INTO history (task, time, userid) VALUES ($1, $2, $3)",
        [task, shortDateTime, req.user.id]
    );

    res.redirect("/");
});

app.post("/addNewTask", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.render("login.ejs", { incorrect: false });
    }

    const { newTask } = req.body;

    await db.query("INSERT INTO todo (task, userid) VALUES ($1, $2)", [
        newTask,
        req.user.id,
    ]);

    res.redirect("/");
});


app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});

app.get("/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.render("login.ejs", { incorrect: false });
    }

    const history = await db.query(
        "SELECT * FROM history WHERE userid = $1",
        [req.user.id]
    );

    res.render("profile.ejs", {
        username: req.user.username,
        history: history.rows,
        profile: req.user.profile_img,
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
