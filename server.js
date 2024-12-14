const express = require ('express')
const cors = require ('cors')
const bcrypt = require ('bcrypt')
const db_access = require ('./db.js')
const db = db_access.db
const server =express()
const port = 5001
server.use(express.json())
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');  

const secret_key = 'qwertyuiop1asdfghjkl2zxcvbnm';
  server.use(cors({
   origin: "http://localhost:3000",
   credentials: true
 }))

server.use(express.json());
server.use(cookieParser()); 
const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, secret_key, { expiresIn: '1h' });
}

const verifyToken = (req, res, next) => {
  const token = req.cookies.authToken; 
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  jwt.verify(token, secret_key, (err, userDetails) => {
    if (err) {
      return res.status(403).send('Invalid or expired token');
    }

    req.userDetails = userDetails; 
    next();
  });
};

//LOGIN 

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

      const userID = user.ID;
      const isAdmin = user.ISADMIN;
      const token = generateToken(userID, isAdmin); 

      res.cookie('authToken', token, {
        httpOnly: true, 
        sameSite: 'strict', 
        secure: false, 
        maxAge: 3600000, 
      });

      return res.status(200).json({
        id: userID,
        admin: isAdmin,
        token: token
      });
    });
  });
});

// REGISTER

  server.post('/user/register', (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const age = req.body.age
    const height = req.body.height;
    const speed = req.body.speed || 0
    const dribbling = req.body.dribbling || 0
    const passing = req.body.passing || 0
    const shooting = req.body.shooting || 0
    const picture = req.body.picture || null
    const isAdmin = req.body.isAdmin || 0;

    const adminStatus = isAdmin ? 1 : 0
     if (password.length < 8) {
       return res.status(400).send('Password must be at least 8 characters long.');
     }
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).send(`Error hashing password. ${err}`);
      }
      db.run(`INSERT INTO USERS (NAME, EMAIL, PASSWORD, AGE, HEIGHT, SPEED, DRIBBLING, PASSING, SHOOTING, PICTURE, ISADMIN) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
             [name, email, hashedPassword, age, height, speed, dribbling, passing, shooting, picture, adminStatus], err => {
        if (err) {
          return res.status(500).send('Error registering user.')
        }
        res.status(200).send('Registration successful')
      })
    })
  })

// PROFILE DETAILS

server.get('/user/profile', verifyToken, (req, res) => {
    const userId = req.userDetails.id
  
    db.get(`SELECT NAME, EMAIL, AGE, HEIGHT, SPEED, DRIBBLING, PASSING, SHOOTING, PICTURE 
            FROM USERS WHERE ID = ?`, [userId], (err, user) => {
      if (err) {
        return res.status(500).send('Error fetching user profile.')
      }
      if (!user) {
        return res.status(404).send('User not found.')
      }
      res.status(200).json(user)
    })
  })
  
// UPDATED PROFILE DETAILS

  server.put('/user/profile/update', verifyToken, (req, res) => {
    const userId = req.userDetails.id
    const name = req.body.name
    const email = req.body.email
    const age = req.body.age
    const height = req.body.height
    const speed = req.body.speed || 0
    const dribbling = req.body.dribbling || 0
    const passing = req.body.passing || 0
    const shooting = req.body.shooting || 0
    const picture = req.body.picture || null
  
    const query = `UPDATE USERS SET NAME = ?, EMAIL = ?, AGE = ?,
     HEIGHT = ?, SPEED = ?, DRIBBLING = ?, PASSING = ?, SHOOTING = ?,
      PICTURE = ? WHERE ID = ?`
  
    db.run(query, [name, email, age, height, speed, dribbling, passing, shooting, picture, userId], (err) => {
      if (err) {
      console.error(err)
      return res.status(500).send('Error updating profile.')
      }
      db.get(`SELECT NAME, EMAIL, AGE, HEIGHT FROM USERS WHERE ID = ?`, [userId], (err, user) => {
       if (err) {
        console.error(err)
        return res.status(500).send('Error validating updated profile.')
      }
        if (!user || !user.NAME || !user.EMAIL || !user.AGE || !user.HEIGHT) {
          return res.status(400).send('Updated profile contains empty required fields.')
        }
        return res.status(200).send('Profile updated successfully.')
    })
  })
  })
  

  // ADD NEW FIELD WITH TIMINGS

   server.post('/fields/add', verifyToken, (req, res) => {
     const isAdmin = req.userDetails.isAdmin
   if (isAdmin !== 1) {
    return res.status(403).send("you are not an admin")
   }

   const name = req.body.name
       const location = req.body.location
      const price = req.body.price
      const picture = req.body.picture || null

   db.run(`INSERT INTO FIELDS (NAME, LOCATION, PRICE, PICTURE) VALUES (?, ?, ?, ?)`, 
            [name, location, price, picture || null], function(err) {
       if (err) {
        return res.status(500).send('Error adding field.' + err.message)
      }

       const fieldId = this.lastID; 
      const timeSlots = ['02:00-4:00', '4:00-6:00', '6:00-8:00', '8:00-10:00', '10:00-12:00']
      let completed = 0

       timeSlots.forEach(slot => {
          db.run(`INSERT INTO TIMINGS (FIELD_ID, TIME_SLOT) VALUES (?, ?)`, [fieldId, slot], err => {
            completed++;
               if (err) {
                 console.error(`Failed to add timing ${slot} for field ID ${fieldId}: ${err.message}`)
                }
                if (completed === timeSlots.length) {
                     res.status(200).send(`Field and timings added successfully.`)
                   }
          })
           })
      })
     })
    

// DELETE EXISITING FIELD

  server.delete('/fields/:fieldId', verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
  if (isAdmin !== 1) {
    return res.status(403).send("you are not an admin");
  }
    const fieldId = req.params.fieldId
  
    db.get(`SELECT * FROM BOOKINGS WHERE FIELD_ID = ?`, [fieldId], (err, booking) => 
    {
      if (err) 
      {
        return res.status(500).send('Error checking field bookings')
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
        res.status(200).send('Field deleted successfully')
   })
  })
  })
  
// FETCH ALL EXISTING FIELDS

server.get('/fields', verifyToken, (req, res) => {
  db.all(`SELECT * FROM FIELDS`, (err, fields) => {
    if (err) {
      return res.status(500).send('Error fetching fields.')
    }
    res.json(fields);
  })
})

// UPDATE EXISITTNG FIELD]

server.put('/fields/update/:fieldId', verifyToken, (req, res) => {
const isAdmin = req.userDetails.isAdmin
  if (isAdmin !== 1) {
    return res.status(403).send("you are not an admin")
  }
  const name = req.body.name
const location = req.body.location
const price = req.body.price
const fieldId = req.params.fieldId

  const query = `UPDATE FIELDS SET NAME = ?, LOCATION = ?, PRICE = ? WHERE ID = ?`;

  db.run(query, [name, location, price, fieldId], (err) => {
      if (err) 
      {
      console.error(err);
          return res.status(500).send('Error updating field information')
      }
      res.status(200).send('Field information updated successfully')
 })
})

// MAKE A BOOKING  

server.post('/bookings/add', verifyToken, (req, res) => {
const userId = req.userDetails.id
const fieldId = req.body.fieldId
  const timingId = req.body.timingId
  const bookingDate = req.body.bookingDate
  const coachId = req.body.coachId

  db.get(`SELECT ID FROM TIMINGS WHERE ID = ?`, [timingId], (err, timing) => {
    if (err) {
      return res.status(500).send('Error checking timing availability.')
    }
    if (!timing) {
      return res.status(404).send('Timing slot not found or unavailable.')
    }

    db.get(`SELECT NAME, LOCATION, PRICE, PICTURE FROM FIELDS WHERE ID = ?`, [fieldId], (err, field) => {
      if (err) {
        return res.status(500).send('Error fetching field details.')
      }
      if (!field) {
        return res.status(404).send('Field not found.')
      }

      let totalPrice = field.PRICE;

      if (coachId) {
        db.get(`SELECT PRICE FROM COACHES WHERE ID = ?`, [coachId], (err, coach) => {
          if (err) {
            return res.status(500).send('Error fetching coach price.')
          }
          if (coach) {
            totalPrice += coach.PRICE
          }

          insertBooking(userId, fieldId, bookingDate, timingId, coachId, totalPrice, res)
        });
      } else {
        insertBooking(userId, fieldId, bookingDate, timingId, null, totalPrice, res)
      }
    })
  })
});

function insertBooking(userId, fieldId, bookingDate, timingId, coachId, totalPrice, res) {
  db.run(`INSERT INTO BOOKINGS (USER_ID, FIELD_ID, BOOKING_DATE, TIMING_ID, COACH_ID, PRICE) VALUES (?, ?, ?, ?, ?, ?)`, 
    [userId, fieldId, bookingDate, timingId, coachId, totalPrice], function(err) {
      if (err) {
        return res.status(500).send('Error creating booking.')
      }
      res.status(200).send({
        message: 'Booking added successfully',
        bookingDetails: {
          fieldId: fieldId,
          bookingDate: bookingDate,
          timingId: timingId,
          coachId: coachId,
          totalPrice: totalPrice
        }
      });
  });
}


//FETCHING ALL TIMMINGS TO DISPLAY WHILE BOOKING

server.get('/timings', verifyToken, (req, res) => {
  db.all(`SELECT * FROM TIMINGS`, (err, timings) => {
      if (err) {
          return res.status(500).send('Error fetching timings.')
      }
      res.status(200).json(timings);
  })
});


// HISTORY OF BOOKING FOR SPEICIFC USER

server.get('/user/bookings', verifyToken, (req, res) => {
  const userId = req.userDetails.id

  const query = `SELECT BOOKINGS.ID as BookingID, FIELDS.NAME as FieldName, COACHES.COACH_NAME as CoachName,
   TIMINGS.TIME_SLOT as Timing, BOOKINGS.BOOKING_DATE as BookingDate
     FROM BOOKINGS
      LEFT JOIN FIELDS ON BOOKINGS.FIELD_ID = FIELDS.ID
    LEFT JOIN COACHES ON BOOKINGS.COACH_ID = COACHES.ID
      LEFT JOIN TIMINGS ON BOOKINGS.TIMING_ID = TIMINGS.ID
  WHERE BOOKINGS.USER_ID = ?
  `

 db.all(query, [userId], (err, bookings) => {
     if (err) {
         console.error('Error fetching bookings: ', err)
      res.status(500).send("Error fetching booking history")
      return
      }
      if (bookings.length === 0) {
          res.status(404).send("No bookings found.")
          return;
      }
      res.status(200).json(bookings)
  })
})


//CANCELLING BOOKING

server.delete('/bookings/cancel/:bookingId', verifyToken, (req, res) => {
  const userId = req.userDetails.id
  const bookingId = req.params.bookingId

  db.get(`SELECT * FROM BOOKINGS WHERE ID = ? AND USER_ID = ?`, [bookingId, userId], (err, booking) => {
    if (err) {
      return res.status(500).send('Error accessing booking information.')
    }
    if (!booking) {
      return res.status(404).send('Booking not found or does not belong to the user.')
    }

    db.run(`DELETE FROM BOOKINGS WHERE ID = ?`, [bookingId], (err) => {
      if (err) {
        return res.status(500).send('Error canceling the booking.')
      }
      res.status(200).send({ message: 'Booking canceled successfully', bookingId: bookingId })
})
 })
})

// ADDING NEW COACH

server.post('/coaches', verifyToken, (req, res) => {
  const isAdmin = req.userDetails.isAdmin
  if (isAdmin !== 1) {
    return res.status(403).send("you are not an admin")
  }
  const coachName = req.body.coachName
    const specialty = req.body.specialty
  const price = req.body.price
    const duration = req.body.duration
  const query = `INSERT INTO COACHES (COACH_NAME, SPECIALTY, PRICE, DURATION) VALUES (?, ?, ?, ?)`;

  db.run(query, [coachName, specialty, price, duration], (err) => {
      if (err) 
      {
          console.error(err);
          return res.status(500).send('Error adding new coach');
      }
      res.status(201).send('New coach created successfully');
})
})

// DELETE EXISTING COACH

server.delete('/coaches/:coachId', verifyToken, (req, res) => {
const isAdmin = req.userDetails.isAdmin
if (isAdmin !== 1) {
  return res.status(403).send("you are not an admin")
  }
  const coachId = req.params.coachId;

  db.get(`SELECT * FROM BOOKINGS WHERE COACH_ID = ?`, [coachId], (err, booking) => {
    if (err) 
    {
      return res.status(500).send('Error checking coach bookings')
    }
    if (booking) 
    {
      return res.status(400).send('Cannot delete the coach because a booking exists');
    }

    db.run(`DELETE FROM COACHES WHERE ID = ?`, [coachId], (err) => {
      if (err) {
        return res.status(500).send('Error deleting coach')
      }
      res.status(200).send('Coach deleted successfully')
})
})
})

//FETCHING ALL COACHES

server.get('/coaches', verifyToken, (req, res) => {
  db.all(`SELECT * FROM COACHES`, (err, coaches) => {
    if (err) {
      return res.status(500).send('Error fetching coaches.');
    }
    res.status(200).json(coaches);
  })
})


// ADD A REVIEW 

server.post('/reviews/add', verifyToken, (req, res) => {
  const userId = req.userDetails.id;
    const content = req.body.content

  if (!content) {
    return res.status(400).send('Review content cannot be empty')
  }

  const query = `INSERT INTO REVIEWS (USER_ID, CONTENT) VALUES (?, ?)`

  db.run(query, [userId, content], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error adding review')
    }
    res.status(201).send('Review added successfully')
      })
})

// SEE ALL USER REVIEWS

server.get('/reviews', verifyToken, (req, res) => {
  const query = `SELECT CONTENT FROM REVIEWS`;

  db.all(query, (err, reviews) => {
      if (err)
       {
          console.error(err);
          return res.status(500).send('Error fetching reviews')
      }
      if (reviews.length === 0) 
      {
          return res.status(404).send('No reviews found')
      }
      res.status(200).json(reviews)
})
})

// DELETE EXISTING TIMING SLOT

server.delete('/timings/:timingId', verifyToken, (req, res) => {
  const isAdmin = req.userDetails.isAdmin
  if (isAdmin !== 1) {
    return res.status(403).send("you are not an admin")
    }

  const timingId = req.params.timingId;

  db.get(`SELECT * FROM BOOKINGS WHERE TIMING_ID = ?`, [timingId], (err, booking) => {
      if (err) {
          return res.status(500).send('Error while checking bookings for the timing slot');
      }
      if (booking) {
          return res.status(400).send('Cannot delete timing slot as bookings exist');
      }

      db.run(`DELETE FROM TIMINGS WHERE ID = ?`, [timingId], (err) => {
          if (err) {
              return res.status(500).send('Error deleting timing slot');
          }
          res.status(200).send(`Timing slot deleted successfully`);
      });
  });
});


server.listen(port, () => {
  console.log(`Server started on port ${port}`);
  db.serialize(() => {
    db.run(db_access.createUserTable);
    db.run(db_access.createFieldTable);
    db.run(db_access.createBookingTable);
    db.run(db_access.createCoachesTable);
    db.run(db_access.createPostTable);
    db.run(db_access.createTimingsTable);
    db.run(db_access.createReviewTable)
  });
});