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
