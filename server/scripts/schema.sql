-- FusionHub Marketplace — MySQL schema
CREATE DATABASE IF NOT EXISTS fusionhub;
USE fusionhub;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NULL,
  preferred_interest VARCHAR(32) NOT NULL DEFAULT 'all',
  account_type VARCHAR(32) NOT NULL DEFAULT 'customer',
  avatar_url VARCHAR(512) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  tagline VARCHAR(255) NULL,
  description TEXT NOT NULL,
  banner_url VARCHAR(512) NOT NULL,
  external_url VARCHAR(512) NOT NULL,
  avg_rating DECIMAL(3,2) DEFAULT 4.70,
  review_count INT DEFAULT 128
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(200) NOT NULL,
  excerpt VARCHAR(380) NOT NULL,
  description TEXT NOT NULL,
  hero_image VARCHAR(512) NOT NULL,
  category VARCHAR(80) NULL,
  visit_count INT DEFAULT 0,
  popularity_score DECIMAL(12,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_company_slug (company_id, slug),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  product_id INT NOT NULL,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_user_time (user_id, visited_at),
  INDEX idx_product (product_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  recommend BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT TRUE,
  status ENUM('published','pending','hidden') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_status (product_id, status),
  UNIQUE KEY uniq_user_product (user_id, product_id)
);
