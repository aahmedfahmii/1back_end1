const sqlite = require ('sqlite3')
const db = new sqlite.Database ('thutmose.db')

const createUserTable = `
CREATE TABLE IF NOT EXISTS USERS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    EMAIL TEXT UNIQUE NOT NULL,
    PASSWORD TEXT NOT NULL,
    PICTURE TEXT,
    AGE INT NOT NULL,
    HEIGHT INT NOT NULL,
    SPEED INT DEFAULT 0,
    DRIBBLING INT DEFAULT 0,
    PASSING INT DEFAULT 0,
    SHOOTING INT DEFAULT 0
)`;

const createFieldTable = `
CREATE TABLE IF NOT EXISTS FIELDS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    LOCATION TEXT NOT NULL,
    PRICE INT NOT NULL,
    PICTURE TEXT
)`;

const createCoachingTable = `
CREATE TABLE IF NOT EXISTS COACHING_SESSIONS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    COACH_NAME TEXT NOT NULL,
    SPECIALTY TEXT NOT NULL,
    PRICE INT NOT NULL,
    DURATION INT NOT NULL
)`;
