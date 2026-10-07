-- ==============================================================================
-- 002_SEED_DATA.SQL : SEED FIVE SPECIFIED MINDMASTER COURSES + LESSONS
-- ==============================================================================

-- 1. Insert 5 Courses with access_months = 3
INSERT INTO courses (id, code, title, title_mr, description, header_tint, price_paise, original_price_paise, is_free, access_months, status)
VALUES
(
  '11111111-1111-1111-1111-111111111101',
  'MM-01',
  'Memory Technique Seminar',
  'मेमरी सायन्स व मेंदू कार्यक्षमता तंत्र',
  'प्रशांत धुमाळ सरांचे २०+ वर्षांचे संशोधन! स्मरणशक्ती १० पटीने वाढवा, विस्मरण कायमचे दूर करा.',
  'sky',
  99900,
  299900,
  FALSE,
  3,
  'live'
),
(
  '11111111-1111-1111-1111-111111111102',
  'MM-02',
  'Train the Trainer',
  'ट्रेन द ट्रेनर सर्टिफिकेशन प्रोग्रॅम',
  'स्वतः मेमरी ट्रेनर बनून स्वतःचे क्लासेस किंवा सेमिनार्स सुरू करण्याचे अधिकृत प्रशिक्षण व व्यवसाय मॉडेल.',
  'pink',
  499900,
  999900,
  FALSE,
  3,
  'live'
),
(
  '11111111-1111-1111-1111-111111111103',
  'MM-03',
  'Police Bharti 100% Prep',
  'पोलीस भरती १००% तयारी अंकगणित व बुद्धिमत्ता',
  'महाराष्ट्र पोलीस भरती व स्पर्धा परीक्षेसाठी अंकगणित आणि बुद्धिमत्ता १००% हमखास गुण मिळवून देणाऱ्या ट्रिक्स.',
  'peach',
  129900,
  399900,
  FALSE,
  3,
  'live'
),
(
  '11111111-1111-1111-1111-111111111104',
  'MM-04',
  'Superfast Calendar Technique',
  '५०० वर्षांचे कॅलेंडर केवळ २ सेकंदात सांगा',
  'कॅलेंडर न बघता कोणत्याही वर्षाचा वार सेकंदात तोंडी सांगण्याचे आश्चर्यकारक मेंदू गणित शिका.',
  'lavender',
  49900,
  149900,
  FALSE,
  3,
  'live'
),
(
  '11111111-1111-1111-1111-111111111105',
  'MM-05',
  'Vedic Maths',
  'वैदिक गणित: कॅल्क्युलेटर पेक्षा वेगवान आकडेमोड',
  'गुणाकार, भागाकार, वर्गमूळ सेकंदात सोडवण्याची सोपी प्राचीन १६ सूत्रे. कॅल्क्युलेटर विसरा!',
  'mint',
  79900,
  249900,
  FALSE,
  3,
  'live'
)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  title_mr = EXCLUDED.title_mr,
  description = EXCLUDED.description,
  header_tint = EXCLUDED.header_tint,
  price_paise = EXCLUDED.price_paise,
  original_price_paise = EXCLUDED.original_price_paise,
  access_months = EXCLUDED.access_months,
  status = EXCLUDED.status;

-- 2. Insert Lessons (2 FREE lessons for EACH course)
INSERT INTO lessons (course_id, title, duration_sec, is_free, video_type, video_url, position)
VALUES
-- MM-01 Lessons (2 Free + 1 Locked)
('11111111-1111-1111-1111-111111111101', '१. मेमरी सायन्सची ओळख आणि मूलभूत नियम', 1260, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('11111111-1111-1111-1111-111111111101', '२. असोसिएशन पद्धत व कल्पनाशक्ती तंत्र', 1480, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('11111111-1111-1111-1111-111111111101', '३. चेनिंग मेथड व लांबलचक याद्या तोंडपाठ करणे', 1650, FALSE, 'youtube', '9bZkp7q19f0', 3),

-- MM-02 Lessons (2 Free + 1 Locked)
('11111111-1111-1111-1111-111111111102', '१. ट्रेनर बनण्याचे मूलभूत कौशल्य व स्टेज डेरिंग', 1500, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('11111111-1111-1111-1111-111111111102', '२. विद्यार्थ्यांना मेमरी शिकवण्याची कार्यपद्धती', 1800, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('11111111-1111-1111-1111-111111111102', '३. व्यावसायिक सेमिनार्सचे आयोजन व मॉडेल्स', 2100, FALSE, 'youtube', '9bZkp7q19f0', 3),

-- MM-03 Lessons (2 Free + 1 Locked)
('11111111-1111-1111-1111-111111111103', '१. पोलीस भरती पेपर पॅटर्न व अंकगणित वेटेज', 1320, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('11111111-1111-1111-1111-111111111103', '२. संख्यांचे प्रकार आणि सेकंदात गुणाकार', 1600, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('11111111-1111-1111-1111-111111111103', '३. वय, गुणोत्तर व प्रमाण हमखास मार्क ट्रिक्स', 1750, FALSE, 'youtube', '9bZkp7q19f0', 3),

-- MM-04 Lessons (2 Free + 1 Locked)
('11111111-1111-1111-1111-111111111104', '१. शतकांचे कोड्स तोंडपाठ करण्याची गंमत', 980, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('11111111-1111-1111-1111-111111111104', '२. १२ महिन्यांचे कोड्स व सोपे सूत्र', 1120, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('11111111-1111-1111-1111-111111111104', '३. कोणत्याही तारखेचा वार सेकंदात काढणे', 1400, FALSE, 'youtube', '9bZkp7q19f0', 3),

-- MM-05 Lessons (2 Free + 1 Locked)
('11111111-1111-1111-1111-111111111105', '१. एकाधिकेन पूर्वेन सूत्राची जादू (Square tricks)', 1150, TRUE, 'youtube', 'M7lc1UVf-VE', 1),
('11111111-1111-1111-1111-111111111105', '२. निखिलं नवतश्चरमं दशतः - बेस पद्धत गुणाकार', 1380, TRUE, 'youtube', 'kJQP7kiw5Fk', 2),
('11111111-1111-1111-1111-111111111105', '३. उर्ध्व तिर्यग्भ्याम - २ व ३ अंकी गुणाकार', 1540, FALSE, 'youtube', '9bZkp7q19f0', 3);

-- 3. Seed Promotional Coupons
INSERT INTO coupons (code, discount_type, value, usage_limit, is_active)
VALUES
('PRASHANT50', 'flat', 20000, 500, TRUE),   -- ₹200 off
('FIRST100', 'flat', 10000, 1000, TRUE)     -- ₹100 off
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Course Books (PDFs)
INSERT INTO books (course_id, title, file_path, pages)
VALUES
('11111111-1111-1111-1111-111111111101', 'माइंडमास्टर संपूर्ण मेमरी हँडबुक व प्रॅक्टिस नोट्स (PDF)', '/assets/docs/memory_handbook_marathi.pdf', 128),
('11111111-1111-1111-1111-111111111102', 'ट्रेन द ट्रेनर संपूर्ण कार्यशाळा मॉड्यूल व मॉडेल (PDF)', '/assets/docs/train_the_trainer_guide.pdf', 84),
('11111111-1111-1111-1111-111111111103', 'पोलीस भरती मागील १० वर्षांचे पेपर संच व ट्रिक्स (PDF)', '/assets/docs/police_bharti_question_bank.pdf', 256),
('11111111-1111-1111-1111-111111111104', '५०० वर्षांचे कॅलेंडर फॉर्म्युला बुकलेट व चार्ट्स (PDF)', '/assets/docs/calendar_formula_booklet.pdf', 42),
('11111111-1111-1111-1111-111111111105', 'वैदिक मॅथ्स १६ सूत्रे व २००+ सोडवलेली उदाहरणे (PDF)', '/assets/docs/vedic_maths_workbook.pdf', 184);
