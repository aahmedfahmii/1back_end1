const sqlite = require ('sqlite3')
const db = new sqlite.Database ('thutmose.db')

const createUserTable = `CREATE TABLE IF NOT EXISTS USERS (ID INTEGER PRIMARY KEY AUTOINCREMENT,
NAME TEXT NOT NULL,
EMAIL TEXT UNIQUE NOT NULL,
PASSWORD TEXT NOT NULL,
  PICTURE TEXT,
AGE INT NOT NULL,
HEIGHT INT NOT NULL,
  SPEED INT DEFAULT 0,
DRIBBLING INT DEFAULT 0,
PASSING INT DEFAULT 0,
SHOOTING INT DEFAULT 0,
ISADMIN INT DEFAULT 0)`;

const createFieldTable = `CREATE TABLE IF NOT EXISTS FIELDS (ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    LOCATION TEXT NOT NULL,
    PRICE INT NOT NULL,
    PICTURE TEXT)`;

const createTimingsTable = `CREATE TABLE IF NOT EXISTS TIMINGS (ID INTEGER PRIMARY KEY AUTOINCREMENT,
    TIME_SLOT TEXT NOT NULL)`;
    

const createCoachesTable = `CREATE TABLE IF NOT EXISTS COACHES (ID INTEGER PRIMARY KEY AUTOINCREMENT,
    COACH_NAME TEXT NOT NULL,
    SPECIALTY TEXT NOT NULL,
    PRICE INT NOT NULL,
    DURATION INT NOT NULL)`;

const createBookingTable = `CREATE TABLE IF NOT EXISTS BOOKINGS (ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INT NOT NULL,
    FIELD_ID INT NOT NULL,
    BOOKING_DATE TEXT NOT NULL,
    COACH_ID INT,
    PRICE INT,
    TIMING_ID INTEGER,
    FOREIGN KEY (TIMING_ID) REFERENCES TIMINGS (ID),
    FOREIGN KEY (USER_ID) REFERENCES USERS (ID),
    FOREIGN KEY (FIELD_ID) REFERENCES FIELDS (ID),
    FOREIGN KEY (COACH_ID) REFERENCES COACHES (ID))`;

const createPostTable = `CREATE TABLE IF NOT EXISTS POSTS (ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INT NOT NULL,
    MEDIA_URL TEXT NOT NULL,
    DESCRIPTION TEXT,
    FOREIGN KEY (USER_ID) REFERENCES USERS (ID))`;

const createReviewTable = `CREATE TABLE IF NOT EXISTS REVIEWS (ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INT NOT NULL,
    CONTENT TEXT NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USERS (ID))`;

module.exports = {db,createUserTable,createFieldTable,createTimingsTable,createCoachesTable,createBookingTable,createPostTable,createReviewTable};