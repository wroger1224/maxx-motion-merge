-- Clear existing badges and insert new ones aligned with activity minutes tracking
DELETE FROM badges;

-- Insert new badges aligned with activity minutes tracking
INSERT INTO badges (name, icon, description, total, category, emoji, image_url) VALUES 
-- Daily Activity Minutes
('Daily Starter', 'clock', '30 minutes in one day', 30, 'Daily Minutes', '⏰', 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Daily Achiever', 'stopwatch', '60 minutes in one day', 60, 'Daily Minutes', '⏱️', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Daily Champion', 'trophy', '120 minutes in one day', 120, 'Daily Minutes', '🏆', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),

-- Total Activity Minutes
('Activity Beginner', 'play', '500 total minutes', 500, 'Total Minutes', '🎯', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Expert', 'medal', '2,500 total minutes', 2500, 'Total Minutes', '🥇', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Master', 'crown', '10,000 total minutes', 10000, 'Total Minutes', '👑', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),

-- Activity Variety
('Activity Explorer', 'route', '5 different activity types', 5, 'Variety', '🗺️', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Adventurer', 'mountain', '10 different activity types', 10, 'Variety', '🏔️', 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Activity Pioneer', 'compass', '15 different activity types', 15, 'Variety', '🧭', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),

-- Consistency
('Consistency Starter', 'calendar-check', '7 days in a row', 7, 'Consistency', '📅', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Consistency Master', 'calendar-alt', '30 days in a row', 30, 'Consistency', '📆', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Consistency Legend', 'infinity', '100 days in a row', 100, 'Consistency', '♾️', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60');