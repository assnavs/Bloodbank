CREATE DATABASE IF NOT EXISTS bloodbank;
USE bloodbank;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('admin','donor','hospital') DEFAULT 'donor',
  blood_group VARCHAR(5),
  location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS donors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  blood_group VARCHAR(5),
  location VARCHAR(100),
  last_donation_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  blood_group VARCHAR(5) PRIMARY KEY,
  units INT
);

CREATE TABLE IF NOT EXISTS requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT,
  blood_group VARCHAR(5),
  quantity INT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
