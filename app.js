const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Book = require("./Models/Book");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const session = require("express-session");
// const User = require("./models/user");
const app = express();
//import file

const port = process.env.PORT || 3000; // You can change the port number if needed

// Set EJS as the view engine
//wich server side rendering extension we are goinng to use .and here we are using EJS
app.set("view engine", "ejs");
// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
//=======================DB connection Start==================>
mongoose
  .connect(
    "mongodb+srv://sekhsabiruddin:9732376133@cluster0.dcb5txe.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
//=======================DB connection End==================>
// app.post("/register", (req, res) => {
//   const { name, username, email, phone, password } = req.body;

//   // Hash the password using bcrypt
//   bcrypt.hash(password, 10, (err, hashedPassword) => {
//     if (err) {
//       console.error("Error hashing password:", err);
//       return res.status(500).send("Internal Server Error");
//     }

//     // Create a new User document
//     const newUser = new User({
//       name,
//       username,
//       email,
//       phone,
//       password: hashedPassword,
//     });

//     // Generate a JWT token with the user's email as the payload
//     const token = jwt.sign({ email }, "your_secret_key", {
//       expiresIn: "1h", // Set the token expiration time as needed
//     });

//     // Save the user to the database
//     newUser
//       .save()
//       .then(() => {
//         // Send the verification email to the user's email address
//         const verificationLink = `https://example.com/verify?token=${token}`;
//         const mailOptions = {
//           from: "your_email@example.com",
//           to: email,
//           subject: "Account Verification",
//           text: `Please click on the following link to verify your account: ${verificationLink}`,
//         };

//         // Send the email using your nodemailer transporter
//         transporter.sendMail(mailOptions, (err, info) => {
//           if (err) {
//             console.error("Error sending verification email:", err);
//             return res.status(500).send("Internal Server Error");
//           }

//           // After successful registration and email sending, set the user data in the session
//           req.session.user = {
//             id: newUser._id,
//             name: newUser.name,
//             username: newUser.username,
//             email: newUser.email,
//             phone: newUser.phone,
//           };

//           // Redirect to the login page
//           res.redirect("/login");
//         });
//       })
//       .catch((err) => {
//         console.error("Error saving user to database:", err);
//         return res.status(500).send("Internal Server Error");
//       });
//   });
// });

//==========================Roter Start Here=========>
//get for register
app.get("/", (req, res) => {
  return res.render("register");
});

// Register form submission
app.post("/register", (req, res) => {
  const { name, username, email, phone, password } = req.body;

  // Hash the password using bcrypt
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Create a new User document
    const newUser = new User({
      name,
      username,
      email,
      phone,
      password: hashedPassword,
    });

    // Save the user to the database
    newUser
      .save()
      .then(() => {
        // Redirect to the login page after successful registration
        res.redirect("/login");
      })
      .catch((err) => {
        console.error("Error saving user to database:", err);
        return res.status(500).send("Internal Server Error");
      });
  });
});
//GEt for log in render
app.get("/login", (req, res) => {
  return res.render("login");
});

//Post for log in
app.post("/login", (req, res) => {
  console.log("Login route is hitting successfully.");

  const { loginId, password } = req.body;
  // Find the user by username or email in the database
  console.log("username", loginId, "password", password);
  User.findOne({
    $or: [{ username: loginId }, { email: loginId }],
  })
    .then((user) => {
      if (!user) {
        // User not found
        return res
          .status(401)
          .render("login", { error: "Invalid username or email" });
      }

      // Compare the provided password with the hashed password stored in the database
      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          // Password doesn't match
          return res.status(401).render("login", { error: "Invalid password" });
        }

        // Redirect to the dashboard page after successful login
        res.redirect("/dashboard");
      });
    })
    .catch((err) => {
      console.error("Error finding user:", err);
      res.status(500).send("Internal Server Error");
    });
});

//dashboard
app.get("/dashboard", (req, res) => {
  // Find all books in the database
  Book.find()
    .then((books) => {
      // Render the dashboard view and pass the retrieved books as data
      res.render("dashboard", { books });
    })
    .catch((err) => {
      console.error("Error fetching books:", err);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/addBook", (req, res) => {
  const { title, author, price, category } = req.body;
  console.log(
    "title" + title,
    "author" + author,
    "price" + price,
    "cat" + category
  );
  // Create a new Book document
  const newBook = new Book({
    title,
    author,
    price,
    category,
  });

  // Save the book to the database
  newBook
    .save()
    .then(() => {
      // Redirect to the dashboard page after successful book creation
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.error("Error saving book to database:", err);
      return res.status(500).send("Internal Server Error");
    });
});
//delete functionlities
// Update book route
// app.get("/updateBook/:id", (req, res) => {
//   const bookId = req.params.id;
//   // Render the update book form or perform the update logic
//   // based on the bookId
//   res.render("updateBook", { bookId });
// });

// ------------------------------>Delete book route<==========================
app.post("/deleteBook/:id", (req, res) => {
  const bookId = req.params.id;
  // Perform the delete logic based on the bookId
  // and remove the book from the database
  Book.findByIdAndRemove(bookId)
    .then(() => {
      // Redirect to the dashboard page after successful deletion
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.error("Error deleting book:", err);
      res.status(500).send("Internal Server Error");
    });
});
//=============================>update
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  Book.findById(id)
    .then((user) => {
      if (!user) {
        return res.status(404).render("error", {
          title: "User Not Found",
          message: "User not found.",
        });
      }
      res.render("edit_users", {
        title: "Edit User",
        user: user,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).render("error", {
        title: "Internal Server Error",
        message: "An internal server error occurred.",
      });
    });
});
//for update
app.post("/update/:id", async (req, res) => {
  const id = req.params.id;
  const { title, author, price, category } = req.body;
  console.log(title, author, price, category);
  const updatedUser = await Book.findByIdAndUpdate(
    id,
    {
      title: title,
      author: author,
      price: price,
      category: category,
    },
    { new: true }
  );
  console.log("updated user", updatedUser);

  if (updatedUser) {
    // req.session.message = {
    //   type: "success",
    //   message: "User updated successfully",
    // };
    res.redirect("/dashboard");
  } else {
    res.json({ message: "User not found", type: "danger" });
  }
});
app.get("/forget", (res, req) => {
  req.render("forget");
});
//=======================Router End Here=========================>
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
