-- MindMaster Academy: Master Seed File for Supabase
-- Includes MM-01 to MM-05, Lessons, Coupons, and 4 QA Persona Users:
-- 1. New Student (No purchases, Free trial tier)
-- 2. Purchased Active Student (Active unexpired courses MM-01 & MM-05)
-- 3. Expired Student (Past expiration date, shows "Buy Again")
-- 4. Coupon-Used Student (Purchased with PRASHANT50 coupon)

-- 1. COURSES (MM-01 to MM-05)
INSERT INTO courses (id, code, title, title_mr, description, header_tint, price_paise, original_price_paise, is_free, access_months, status)
VALUES
('11111111-1111-1111-1111-111111111101', 'MM-01', 'Memory Technique Seminar', 'मेमरी सायन्स व मेंदू कार्यक्षमता तंत्र', 'प्रशांत धुमाळ सरांचे २०+ वर्षांचे संशोधन! स्मरणशक्ती १० पटीने वाढवा, विस्मरण कायमचे दूर करा.', 'sky', 99900, 299900, FALSE, 3, 'live'),
('11111111-1111-1111-1111-111111111102', 'MM-02', 'Train the Trainer', 'ट्रेन द ट्रेनर सर्टिफिकेशन प्रोग्रॅम', 'स्वतः मेमरी ट्रेनर बनून स्वतःचे क्लासेस किंवा सेमिनार्स सुरू करण्याचे अधिकृत प्रशिक्षण व व्यवसाय मॉडेल.', 'pink', 499900, 999900, FALSE, 3, 'live'),
('11111111-1111-1111-1111-111111111103', 'MM-03', 'Police Bharti 100% Prep', 'पोलीस भरती १००% तयारी अंकगणित व बुद्धिमत्ता', 'महाराष्ट्र पोलीस भरती व स्पर्धा परीक्षेसाठी अंकगणित आणि बुद्धिमत्ता १००% हमखास गुण मिळवून देणाऱ्या ट्रिक्स.', 'peach', 129900, 399900, FALSE, 3, 'live'),
('11111111-1111-1111-1111-111111111104', 'MM-04', 'Superfast Calendar Technique', '५०० वर्षांचे कॅलेंडर केवळ २ सेकंदात सांगा', 'कॅलेंडर न बघता कोणत्याही वर्षाचा वार सेकंदात तोंडी सांगण्याचे आश्चर्यकारक मेंदू गणित शिका.', 'lavender', 49900, 149900, FALSE, 3, 'live'),
('11111111-1111-1111-1111-111111111105', 'MM-05', 'Vedic Maths', 'वैदिक गणित: कॅल्क्युलेटर पेक्षा वेगवान आकडेमोड', 'गुणाकार, भागाकार, वर्गमूळ सेकंदात सोडवण्याची सोपी प्राचीन १६ सूत्रे. कॅल्क्युलेटर विसरा!', 'mint', 79900, 249900, FALSE, 3, 'live')
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  title_mr = EXCLUDED.title_mr,
  price_paise = EXCLUDED.price_paise,
  access_months = EXCLUDED.access_months;

-- 2. LESSONS (2 Free + 1 Locked for each course)
INSERT INTO lessons (id, course_id, title, duration_sec, is_free, video_type, video_url, position)
VALUES
('33333333-3333-3333-3333-333333330101', '11111111-1111-1111-1111-111111111101', '१. मेमरी सायन्सची ओळख आणि मूलभूत नियम', 1260, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('33333333-3333-3333-3333-333333330102', '11111111-1111-1111-1111-111111111101', '२. असोसिएशन पद्धत व कल्पनाशक्ती तंत्र', 1480, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('33333333-3333-3333-3333-333333330103', '11111111-1111-1111-1111-111111111101', '३. चेनिंग मेथड व लांबलचक याद्या तोंडपाठ करणे', 1650, FALSE, 'youtube', '9bZkp7q19f0', 3),

('33333333-3333-3333-3333-333333330201', '11111111-1111-1111-1111-111111111102', '१. ट्रेनर बनण्याचे मूलभूत कौशल्य व स्टेज डेरिंग', 1500, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('33333333-3333-3333-3333-333333330202', '11111111-1111-1111-1111-111111111102', '२. विद्यार्थ्यांना मेमरी शिकवण्याची कार्यपद्धती', 1800, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('33333333-3333-3333-3333-333333330203', '11111111-1111-1111-1111-111111111102', '३. व्यावसायिक सेमिनार्सचे आयोजन व मॉडेल्स', 2100, FALSE, 'youtube', '9bZkp7q19f0', 3),

('33333333-3333-3333-3333-333333330301', '11111111-1111-1111-1111-111111111103', '१. पोलीस भरती पेपर पॅटर्न व अंकगणित वेटेज', 1320, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('33333333-3333-3333-3333-333333330302', '11111111-1111-1111-1111-111111111103', '२. संख्यांचे प्रकार आणि सेकंदात गुणाकार', 1600, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('33333333-3333-3333-3333-333333330303', '11111111-1111-1111-1111-111111111103', '३. वय, गुणोत्तर व प्रमाण हमखास मार्क ट्रिक्स', 1750, FALSE, 'youtube', '9bZkp7q19f0', 3),

('33333333-3333-3333-3333-333333330401', '11111111-1111-1111-1111-111111111104', '१. शतकांचे कोड्स तोंडपाठ करण्याची गंमत', 980, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('33333333-3333-3333-3333-333333330402', '11111111-1111-1111-1111-111111111104', '२. १२ महिन्यांचे कोड्स व सोपे सूत्र', 1120, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('33333333-3333-3333-3333-333333330403', '11111111-1111-1111-1111-111111111104', '३. कोणत्याही तारखेचा वार सेकंदात काढणे', 1400, FALSE, 'youtube', '9bZkp7q19f0', 3),

('33333333-3333-3333-3333-333333330501', '11111111-1111-1111-1111-111111111105', '१. एकाधिकेन पूर्वेन सूत्राची जादू (Square tricks)', 1150, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('33333333-3333-3333-3333-333333330502', '11111111-1111-1111-1111-111111111105', '२. निखिलं नवतश्चरमं दशतः - बेस पद्धत गुणाकार', 1380, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('33333333-3333-3333-3333-333333330503', '11111111-1111-1111-1111-111111111105', '३. उर्ध्व तिर्यग्भ्याम - २ व ३ अंकी गुणाकार', 1540, FALSE, 'youtube', '9bZkp7q19f0', 3)
ON CONFLICT (id) DO NOTHING;

-- 3. COUPONS
INSERT INTO coupons (id, code, discount_type, value, usage_limit, used_count, is_active)
VALUES
('44444444-4444-4444-4444-444444444401', 'PRASHANT50', 'flat', 20000, 500, 42, TRUE),
('44444444-4444-4444-4444-444444444402', 'FIRST100', 'flat', 10000, 1000, 128, TRUE),
('44444444-4444-4444-4444-444444444403', 'MIND25', 'percent', 25, 200, 15, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. QA SEED PERSONAS (profiles table)
-- Persona 1: New Student (Free trial tier)
INSERT INTO profiles (id, phone, full_name, village, taluka, district, school, is_verified, role)
VALUES
('22222222-2222-2222-2222-222222222201', '9823456789', 'अदिती कुलकर्णी', 'धायरी', 'हवेली', 'पुणे', 'न्यू इंग्लिश स्कूल, पुणे', TRUE, 'student')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Persona 2: Purchased Active Student (Unexpired MM-01)
INSERT INTO profiles (id, phone, full_name, village, taluka, district, school, is_verified, role)
VALUES
('22222222-2222-2222-2222-222222222202', '9811111111', 'रोहन पाटील', 'मलकापूर', 'कराड', 'सातारा', 'शिवाजी हायस्कूल, कराड', TRUE, 'student')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Persona 3: Expired Student (Past expiration date)
INSERT INTO profiles (id, phone, full_name, village, taluka, district, school, is_verified, role)
VALUES
('22222222-2222-2222-2222-222222222203', '9822222222', 'स्नेहा देशमुख', 'पिंपळगाव', 'निफाड', 'नाशिक', 'के.टी.एच.एम. कॉलेज, नाशिक', TRUE, 'student')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Persona 4: Coupon-Used Student (Purchased with PRASHANT50)
INSERT INTO profiles (id, phone, full_name, village, taluka, district, school, is_verified, role)
VALUES
('22222222-2222-2222-2222-222222222204', '9833333333', 'विकास शिंदे', 'कन्नड', 'कन्नड', 'छत्रपती संभाजीनगर', 'डॉ. बाबासाहेब आंबेडकर मराठवाडा विद्यापीठ', TRUE, 'student')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 5. PURCHASES FOR QA PERSONAS
-- Persona 2: Active unexpired purchase for MM-01 (Expires in 74 days)
INSERT INTO purchases (user_id, course_id, amount_paise, razorpay_order_id, razorpay_payment_id, status, purchased_at, expires_at)
VALUES
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 99900, 'order_mock_active_01', 'pay_mock_active_01', 'success', NOW() - INTERVAL '16 days', NOW() + INTERVAL '74 days')
ON CONFLICT (user_id, course_id) DO UPDATE SET expires_at = EXCLUDED.expires_at, status = EXCLUDED.status;

-- Persona 3: Expired purchase for MM-04 (Expired 12 days ago -> triggers Buy Again)
INSERT INTO purchases (user_id, course_id, amount_paise, razorpay_order_id, razorpay_payment_id, status, purchased_at, expires_at)
VALUES
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111104', 49900, 'order_mock_exp_01', 'pay_mock_exp_01', 'success', NOW() - INTERVAL '102 days', NOW() - INTERVAL '12 days')
ON CONFLICT (user_id, course_id) DO UPDATE SET expires_at = EXCLUDED.expires_at, status = EXCLUDED.status;

-- Persona 4: Coupon-Used Purchase for MM-05 (Used PRASHANT50, 79900 - 20000 = 59900 paise, expires in 85 days)
INSERT INTO purchases (user_id, course_id, amount_paise, coupon_id, razorpay_order_id, razorpay_payment_id, status, purchased_at, expires_at)
VALUES
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111105', 59900, '44444444-4444-4444-4444-444444444401', 'order_mock_cp_01', 'pay_mock_cp_01', 'success', NOW() - INTERVAL '5 days', NOW() + INTERVAL '85 days')
ON CONFLICT (user_id, course_id) DO UPDATE SET expires_at = EXCLUDED.expires_at, status = EXCLUDED.status;

-- 6. PROGRESS TRACKING SEED
INSERT INTO progress (user_id, lesson_id, position_sec, completed)
VALUES
('22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333330101', 1260, TRUE),
('22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333330102', 640, FALSE)
ON CONFLICT (user_id, lesson_id) DO UPDATE SET position_sec = EXCLUDED.position_sec;

-- 7. COURSE BOOKS SEED
INSERT INTO books (id, course_id, title, file_path, pages)
VALUES
('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111101', 'माइंडमास्टर संपूर्ण मेमरी हँडबुक व प्रॅक्टिस नोट्स (PDF)', '/assets/docs/memory_handbook_marathi.pdf', 128),
('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111104', '५०० वर्षांचे कॅलेंडर फॉर्म्युला बुकलेट व चार्ट्स (PDF)', '/assets/docs/calendar_formula_booklet.pdf', 42),
('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111105', 'वैदिक मॅथ्स १६ सूत्रे व २००+ सोडवलेली उदाहरणे (PDF)', '/assets/docs/vedic_maths_workbook.pdf', 184)
ON CONFLICT (id) DO NOTHING;
