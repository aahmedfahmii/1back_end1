const express = require ('express');
const cors = require ('cors');
const bcrypt = require ('bcrypt');
const db_access = require ('./db.js')
const db = db_access.db
const server =express()
const port = 101
server.use(cors())
server.use(express.json())
