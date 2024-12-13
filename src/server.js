const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const { Client } = require("pg"); 
const app = express();
const fs = require("fs");
const uploadsPath = path.join(__dirname, "public/uploads");
const paypal = require("@paypal/checkout-server-sdk");

// Body parser to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serving static files from 'public' directory
app.use(express.static("public"));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/uploads/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const upload = multer({ storage: storage });

// PostgreSQL Database connection
const pgclient = new Client({
  host: "localhost", 
  user: "cynthia", 
  password: "", 
  database: "my_database", 
  port: 5432, 
});

pgclient.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to PostgreSQL database.");
});

// Serve pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.get("/create_events", (req, res) => {
  res.sendFile(path.join(__dirname, "views/create_events.html"));
});

// Serve specific event detail pages
app.get("/event-details/board-game-night", (req, res) => {
  res.sendFile(path.join(__dirname, "views/board-game-night.html"));
});

app.get("/event-details/hiking-adventure", (req, res) => {
  res.sendFile(path.join(__dirname, "views/hiking-adventure.html"));
});

app.get("/event-details/nu-innovators-meetup", (req, res) => {
  res.sendFile(path.join(__dirname, "views/innovators-meetup.html"));
});

app.get("/event-details/nu-code-hackathon", (req, res) => {
  res.sendFile(path.join(__dirname, "views/code-hackathon.html"));
});

app.get("/event-details/northeastern-annual-career-fair", (req, res) => {
  res.sendFile(path.join(__dirname, "views/annual-career-fair.html"));
});

app.get("/event-details/northeastern-cultural-festival", (req, res) => {
  res.sendFile(path.join(__dirname, "views/cultural-festival.html"));
});

// Serve the About page
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views/about.html"));
});

// Handle login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM "users" WHERE email = $1';
  pgclient.query(query, [email], (err, result) => {
    if (err) {
      console.error("Error checking user email:", err);
      res.status(500).send("Database error");
      return;
    }

    if (result.rows.length === 0) {
      res.redirect("/login?error=true"); 
    } else {
      const user = result.rows[0];

      if (user.password === password) {
        res.redirect("/index.html");
      } else {
        res.redirect("/login?error=true");
      }
    }
  });
});

// Handle signup (register a new user)
app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  const checkQuery = 'SELECT * FROM "users" WHERE email = $1';
  pgclient.query(checkQuery, [email], (err, result) => {
    if (err) {
      console.error("Error checking user email:", err);
      res.status(500).send("Database error");
      return;
    }

    if (result.rows.length > 0) {
      res.status(400).send("Email already exists");
    } else {
      const insertQuery =
        'INSERT INTO "users" (email, password) VALUES ($1, $2) RETURNING user_id';
      pgclient.query(insertQuery, [email, password], (err, result) => {
        if (err) {
          console.error("Error registering user:", err);
          res.status(500).send("Database error");
          return;
        }
        console.log("New user registered:", result.rows[0].user_id);
        res.redirect("/login"); 
      });
    }
  });
});

// Handle event creation (save event to database)
app.post("/create_events", upload.single("mainImage"), (req, res) => {
  const {
    eventTitle,
    eventType,
    location,
    startDate,
    startTime,
    endDate,
    endTime,
    description,
  } = req.body;
  const mainImage = req.file ? req.file.filename : "no-image.png";

  const eventData = {
    event_title: eventTitle, 
    event_type: eventType, 
    location: location,
    start_date: startDate,
    start_time: startTime,
    end_date: endDate,
    end_time: endTime,
    event_description: description, 
    main_image: mainImage,
  };

  // Insert event into PostgreSQL database
  const query =
    "INSERT INTO events (event_title, event_type, location, start_date, start_time, end_date, end_time, event_description, main_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING event_id";
  pgclient.query(query, Object.values(eventData), (err, result) => {
    if (err) {
      console.error("Error inserting event:", err);
      res.status(500).send("Database error");
      return;
    }

    const eventId = result.rows[0].event_id;
    console.log("Event Created:", eventId);
    res.redirect("/event_created_successfully");
  });
});

app.get("/event_created_successfully", function (req, res) {
  res.sendFile(
    path.join(__dirname, "views", "event_created_successfully.html")
  );
});

app.get("/create_tickets", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "create_tickets.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle ticket creation (save ticket to database)
app.post("/api/tickets/create", (req, res) => {
  console.log("Request body:", req.body); 

  const { quantity, price } = req.body;

  // Insert ticket into PostgreSQL database
  const query = `
      INSERT INTO tickets (quantity, price, purchased_at) 
      VALUES ($1, $2, NOW()) RETURNING ticket_id`;

  pgclient.query(query, [quantity, price], (err, result) => {
    if (err) {
      console.error("Error inserting ticket:", err);
      res.status(500).send("Database error");
      return;
    }

    const ticketId = result.rows[0].ticket_id;
    console.log("Ticket Created:", ticketId);
    res.status(200).json({
      success: true,
      message: "Ticket created successfully!",
    });
  });
});

// Serve Event Details Page
app.get("/event-details/:eventName", (req, res) => {
  const eventName = req.params.eventName;
  res.sendFile(path.join(__dirname, "views", `${eventName}.html`));
});

// Event management page
app.get("/manage-events", (req, res) => {
  res.sendFile(path.join(__dirname, "views/events_management.html"));
});

// API to fetch events
app.get("/api/events", (req, res) => {
  const events = [
    {
      id: 1,
      title: "Homemade Risotto Cooking Class",
      date: "Fri, Dec 04, 2020",
      status: "On Sale",
    },
    {
      id: 2,
      title: "Dave Chappelle Live in New York",
      date: "Wed, Dec 23, 2020",
      status: "Announced",
    },
  ];
  res.json(events);
});

// Handling PUT request for updating an event
app.put("/api/events/:id", (req, res) => {
  console.log(req.body); 
  res.status(200).send({ message: "Event updated successfully" });
});

// Handling DELETE request for deleting an event
app.delete("/api/events/:id", (req, res) => {
  res.status(200).send({ message: "Event deleted successfully" });
});

//Paypal
function environment() {
  let clientId =
    "AVeWCxaYOH490OxvqCBQGORu6-R_Df8cB7WW9DU3HKyRK-WI3C1Jc6OQMCEPwp-SViPffnhIPr16wrVU";
  let clientSecret =
    "EKfKtZorP0DzDXY3VwIJw8K82yhC3KxfPL3W_r1pOn1AHPyqKM2CFImxQSMmIr0eXmBZCcruPUR4f2Lf";

  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

let client = new paypal.core.PayPalHttpClient(environment());

app.post("/create-payment", async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "5.00",
        },
      },
    ],
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve the Contact Us page
app.get("/contact_us", (req, res) => {
  res.sendFile(path.join(__dirname, "views/contact_us.html"));
});

// Handle contact form submission
app.post("/submit-contact-form", (req, res) => {
  // Here you would typically handle the form data, e.g., save it to a database or send an email.
  console.log(req.body);
  res.send("Message received successfully!");
});

//update page
app.get("/update-board-game-night", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "update_board_game_night.html"));
});

app.get("/delete-board-game-night", (req, res) => {
  console.log("Event has been deleted");
  res.redirect("/manage-events");
});

app.get("/board-game-night.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "board-game-night.html"));
});

app.use(express.static(path.join(__dirname, "views")));

app.post("/update-board-game-night", (req, res) => {
  const { eventTitle, eventType, location, date, time, description } = req.body;
  console.log(
    "Updated Event:",
    eventTitle,
    eventType,
    location,
    date,
    time,
    description
  );
  res.send(
    `<script>alert('Event updated successfully!'); window.location.href='/manage-events';</script>`
  );
});

// Route to handle ticket price update
app.post("/api/tickets/update", (req, res) => {
  const { price } = req.body;
  updateTicketPrice("Board Game Night", price)
    .then(() => {
      console.log(`Ticket price updated to $${price}`);
      res.send(`Ticket price updated to $${price}`);
    })
    .catch((err) => {
      console.error("Failed to update ticket price:", err);
      res.status(500).send("Failed to update ticket price");
    });
});

// Example function to update ticket price in database
async function updateTicketPrice(eventName, newPrice) {
  const query = `UPDATE tickets SET price = $1 WHERE event_name = $2`;
  return pgclient.query(query, [newPrice, eventName]);
}

app.get("/update_tickets", (req, res) => {
  res.sendFile(path.join(__dirname, "views/update_tickets.html"));
});

app.post("/update-hiking-adventure", (req, res) => {
  const { eventTitle, eventType, location, date, time, description } = req.body;
  console.log(
    "Updated Event:",
    eventTitle,
    eventType,
    location,
    date,
    time,
    description
  );
  res.send(
    `<script>alert('Event updated successfully!'); window.location.href='/manage-events';</script>`
  );
});

app.get("/update-hiking-adventure", (req, res) => {
  res.sendFile(path.join(__dirname, "views/update_hiking_adventure.html"));
});

app.get('/search', function(req, res) {
  res.sendFile(path.join(__dirname, 'views/search.html'));
});

