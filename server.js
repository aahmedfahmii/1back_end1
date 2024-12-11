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


server.get('/fields', (req, res) => {
  db.all(`SELECT * FROM FIELDS`, (err, fields) => {
    if (err) {
      return res.status(500).send('Error fetching fields.');
    }
    res.json(fields);
  });
});