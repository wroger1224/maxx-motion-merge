-- Clear existing badges and insert new ones aligned with activity minutes tracking
DELETE FROM badges;

-- Insert new badges aligned with activity minutes tracking
INSERT INTO badges (name, icon, description, total, category, emoji, image_url) VALUES 
-- Daily Activity Minutes (days with activity, not minutes)
('Daily Starter', 'clock', '3 days with activity', 3, 'Daily Minutes', '⏰', 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Daily Achiever', 'stopwatch', '7 days with activity', 7, 'Daily Minutes', '⏱️', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Daily Champion', 'trophy', '14 days with activity', 14, 'Daily Minutes', '🏆', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),

-- Total Activity Minutes (updated thresholds)
('Activity Beginner', 'play', '500 total minutes', 500, 'Total Minutes', '🎯', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Expert', 'medal', '1,000 total minutes', 1000, 'Total Minutes', '🥇', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Master', 'crown', '2,000 total minutes', 2000, 'Total Minutes', '👑', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),

-- Activity Variety
('Activity Explorer', 'compass', '5 different activities', 5, 'Variety', '🧭', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Adventurer', 'map', '10 different activities', 10, 'Variety', '🗺️', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Pioneer', 'flag', '15 different activities', 15, 'Variety', '🚩', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60');