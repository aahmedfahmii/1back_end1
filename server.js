const express = require ('express');
const cors = require ('cors');
const bcrypt = require ('bcrypt');
const db_access = require ('./db.js')
const db = db_access.db
const server =express()
const port = 101
server.use(cors())
server.use(express.json())

server.post('/user/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    db.get(`SELECT * FROM USERS WHERE EMAIL = ?`, [email], (err, user) => {
      if (err) {
        return res.status(500).send('Error on user lookup.');
      }
      if (!user) {
        return res.status(401).send('User not found.');
      }
      bcrypt.compare(password, user.PASSWORD, (err, isMatch) => {
        if (err) {
          return res.status(500).send('Error comparing password.');
        }
        if (!isMatch) {
          return res.status(401).send('Invalid credentials');
        }
        res.cookie('username', user.NAME, { httpOnly: true, maxAge: 3600000 });
        return res.status(200).send('Login successful');
      });
    });
  });


  server.post('/user/register', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const age = req.body.age;
    const height = req.body.height;
    const speed = req.body.speed || 0; 
    const dribbling = req.body.dribbling || 0; 
    const passing = req.body.passing || 0; 
    const shooting = req.body.shooting || 0; 
    const picture = req.body.picture || null; 
  
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).send('Error hashing password.');
      }
      db.run(`INSERT INTO USERS (NAME, EMAIL, PASSWORD, AGE, HEIGHT, SPEED, DRIBBLING, PASSING, SHOOTING, PICTURE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
             [name, email, hashedPassword, age, height, speed, dribbling, passing, shooting, picture], err => {
        if (err) {
          return res.status(500).send('Error registering user.');
        }
        res.status(200).send('Registration successful');
      });
    });
  });


  server.post('/fields/add', (req, res) => {
    const name = req.body.name;
    const location = req.body.location;
    const price = req.body.price;
    const picture = req.body.picture || null;
  
    db.run(`INSERT INTO FIELDS (NAME, LOCATION, PRICE, PICTURE) VALUES (?, ?, ?, ?)`, 
           [name, location, price, picture], err => {
      if (err) {
        return res.status(500).send('Error adding field.');
      }
      res.send('Field added successfully');
    });
  });


  server.delete('/admin/fields/:fieldId', (req, res) => {
    const fieldId = req.params.fieldId;
  
    db.get(`SELECT * FROM BOOKINGS WHERE FIELD_ID = ?`, [fieldId], (err, booking) => 
    {
      if (err) 
      {
        return res.status(500).send('Error checking field bookings');
      }
      if (booking) 
      {
        return res.status(400).send('Cannot delete the field because some bookings exists');
      }
  
      db.run(`DELETE FROM FIELDS WHERE ID = ?`, [fieldId], (err) => {
        if (err) 
        {
          return res.status(500).send('Error deleting field');
        }
        res.status(200).send('Field deleted successfully');
   });
  });
  });
  

server.get('/fields', (req, res) => {
  db.all(`SELECT * FROM FIELDS`, (err, fields) => {
    if (err) {
      return res.status(500).send('Error fetching fields.');
    }
    res.json(fields);
  });
});

server.put('/admin/fields/update/:fieldId', (req, res) => {
  const { name, location, price } = req.body;
  const fieldId = req.params.fieldId;

  const query = `UPDATE FIELDS SET NAME = ?, LOCATION = ?, PRICE = ? WHERE ID = ?`;

  db.run(query, [name, location, price, fieldId], (err) => {
      if (err) 
      {
      console.error(err);
          return res.status(500).send('Error updating field information');
      }
      res.status(200).send('Field information updated successfully');
 });
});

server.post('/bookings/add', (req, res) => {
  const userId = req.body.userId;
  const fieldId = req.body.fieldId;
  const bookingDate = req.body.bookingDate;

  db.run(`INSERT INTO BOOKINGS (USER_ID, FIELD_ID, BOOKING_DATE) VALUES (?, ?, ?)`, [userId, fieldId, bookingDate], err => {
    if (err) {
      return res.status(500).send('Error creating booking.');
    } else {
      db.get(`SELECT NAME, LOCATION, PRICE, PICTURE FROM FIELDS WHERE ID = ?`, [fieldId], (err, field) => {
        if (err) {
          return res.status(500).send('Error fetching field details.');
        }
        if (!field) {
          return res.status(404).send('Field not found.');
        }
        const fieldDetails = {
          name: field.NAME,
          location: field.LOCATION,
          price: field.PRICE,
          picture: field.PICTURE || "No picture available" 
        };
        res.status(200).send({
          message: 'Booking added successfully',
          fieldDetails: fieldDetails
        });
      });
    }
  });
});

server.get('/user/bookings/:USER_ID', (req, res) => {
  const userId = req.params.userId;
  const query = `SELECT * FROM BOOKINGS WHERE USER_ID = ?`;

  db.all(query, [userId], (err, bookings) => {
    if (err) 
    {
      console.error(err);
      return res.status(500).send("Error fetching booking history");
    }
    if (!bookings[0]) 
    { 
      return res.status(404).send("No bookings made by this user.");
    }
    res.status(200).json(bookings);
  });
});



server.post('/admin/coaches', (req, res) => {
  const { coachName, specialty, price, duration } = req.body;
  const query = `INSERT INTO COACHES (COACH_NAME, SPECIALTY, PRICE, DURATION) VALUES (?, ?, ?, ?)`;

  db.run(query, [coachName, specialty, price, duration], (err) => {
      if (err) 
      {
          console.error(err);
          return res.status(500).send('Error adding new coach');
      }
      res.status(201).send('New coach created successfully');
});
});


server.delete('/admin/coaches/:coachId', (req, res) => {
  const coachId = req.params.coachId;

  db.get(`SELECT * FROM BOOKINGS WHERE COACH_ID = ?`, [coachId], (err, booking) => {
    if (err) 
    {
      return res.status(500).send('Error checking coach bookings');
    }
    if (booking) 
    {
      return res.status(400).send('Cannot delete the coach because a booking exists');
    }

    db.run(`DELETE FROM COACHES WHERE ID = ?`, [coachId], (err) => {
      if (err) {
        return res.status(500).send('Error deleting coach');
      }
      res.status(200).send('Coach deleted successfully');
});
});
});


server.post('/reviews/add', (req, res) => {
  const { userId, content } = req.body;

  if (!content) {
    return res.status(400).send('Review content cannot be empty');
  }

  const query = `INSERT INTO REVIEWS (USER_ID, CONTENT) VALUES (?, ?)`;

  db.run(query, [userId, content], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error adding review');
    }
    res.status(201).send('Review added successfully');
      });
});


server.get('/reviews', (req, res) => {
  const query = `SELECT CONTENT FROM REVIEWS`;

  db.all(query, (err, reviews) => {
      if (err)
       {
          console.error(err);
          return res.status(500).send('Error fetching reviews');
      }
      if (!reviews.length) 
      {
          return res.status(404).send('No reviews found');
      }
      res.status(200).json(reviews);
});
});


server.listen(port, () => {
  console.log(`Server started on port ${port}`);
  db.serialize(() => {
    db.run(db_access.createUserTable);
    db.run(db_access.createFieldTable);
    db.run(db_access.createBookingTable);
  });
});