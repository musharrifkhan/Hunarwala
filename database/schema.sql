
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES service_categories(id),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2),
    price_unit VARCHAR(30) DEFAULT 'visit',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    city VARCHAR(100) DEFAULT 'Chhindwara',
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_services (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    price NUMERIC(10,2),
    UNIQUE(provider_id, service_id)
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id),
    service_id INTEGER REFERENCES services(id),
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    booking_date TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO service_categories (name, slug, icon, description)
VALUES
('Home Repairs', 'home-repairs', 'wrench', 'Plumbing, electrical and household repairs'),
('Cleaning', 'cleaning', 'sparkles', 'Professional home cleaning'),
('Tutoring', 'tutoring', 'graduation-cap', 'Academic and personal tutoring'),
('Healthcare', 'healthcare', 'heart-pulse', 'Healthcare and care assistance'),
('Drivers', 'drivers', 'car', 'Local drivers and transport'),
('Painting', 'painting', 'paintbrush', 'Home and commercial painting'),
('Carpentry', 'carpentry', 'hammer', 'Furniture and woodwork'),
('Beauty', 'beauty', 'scissors', 'Beauty and personal care'),
('Gardening', 'gardening', 'leaf', 'Garden maintenance'),
('Technology', 'technology', 'laptop', 'Computer and technical support')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (category_id, name, slug, description)
SELECT id, 'Plumber', 'plumber', 'Pipes, taps and water repairs'
FROM service_categories WHERE slug = 'home-repairs'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (category_id, name, slug, description)
SELECT id, 'Electrician', 'electrician', 'Electrical repairs and installations'
FROM service_categories WHERE slug = 'home-repairs'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (category_id, name, slug, description)
SELECT id, 'House Cleaning', 'house-cleaning', 'Professional home cleaning'
FROM service_categories WHERE slug = 'cleaning'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (category_id, name, slug, description)
SELECT id, 'Home Tutor', 'home-tutor', 'Personalized home tutoring'
FROM service_categories WHERE slug = 'tutoring'
ON CONFLICT (slug) DO NOTHING;

