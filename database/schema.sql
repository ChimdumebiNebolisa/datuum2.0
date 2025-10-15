-- Datuum 2.0 Database Schema
-- PostgreSQL 14+

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

-- Sample data (optional - uncomment to insert)
-- INSERT INTO items (name, description) VALUES
--     ('Sample Item 1', 'This is a sample item for testing'),
--     ('Sample Item 2', 'Another test item'),
--     ('Sample Item 3', 'Third sample item');

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Future tables can be added below
-- Example: Users, Categories, etc.

