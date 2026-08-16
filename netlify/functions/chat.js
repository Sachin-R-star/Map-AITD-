import { GoogleGenAI } from '@google/genai';

// 1. Embedded Campus Locations Database
const locations = [
  { "name" : "aith gate no 1", "displayName": "AITH Gate No. 1", "category": "gates", "description": "gate 1, main gate, entrance, entry, प्रवेश, द्वार" },
  { "name" : "white house", "displayName": "White House Landmark", "category": "facilities", "description": "landmark, white house, milestone" },
  { "name" : "awadhpuri GT road", "displayName": "Awadhpuri GT Road Entrance", "category": "gates", "description": "gt road, entrance, gate, road" },
  { "name" : "divyangjan hostel", "displayName": "Divyangjan Hostel", "category": "hostels", "description": "handicapped hostel, accessible hostel, disabled, divyang, छात्रावास" },
  { "name" : "basketball court", "displayName": "Basketball Court", "category": "sports", "description": "sports, play, ground, game, baasket" },
  { "name" : "stage", "displayName": "Open Air Stage", "category": "sports", "description": "stage, events, cultural, open air, मंच" },
  { "name" : "lift main building", "displayName": "Main Building Lift", "category": "facilities", "description": "elevator, lift, accessible, लिफ्ट, मुख्य भवन" },
  { "name" : "advanced biotech lab", "displayName": "Advanced Biotech Lab", "category": "academics", "description": "biotechnology, lab, academic, बायोटेक, प्रयोगशाला" },
  { "name" : "advanced ai lab gate", "displayName": "Advanced AI Lab Entrance", "category": "academics", "description": "artificial intelligence, computer science, lab, ai, एआई, कंप्यूटर" },
  { "name" : "F block cse /it", "displayName": "F-Block (CSE & IT)", "category": "academics", "description": "computer science, information technology, cse, it, department, विभाग" },
  { "name" : "academic hall", "displayName": "Academic Hall", "category": "academics", "description": "lecture hall, classes, hall, शैक्षणिक" },
  { "name" : "aith gate no 2", "displayName": "AITH Gate No. 2", "category": "gates", "description": "gate 2, entrance, exit, निकास, द्वार" },
  { "name" : "GT road near csjmu", "displayName": "GT Road (Near CSJMU)", "category": "gates", "description": "csjmu gate, entrance, gt road, road" },
  { "name" : "girls hostel", "displayName": "Girls Hostel", "category": "hostels", "description": "girls, hostel, residence, छात्रावास, महिला" },
  { "name" : "cricket playground", "displayName": "Cricket Playground", "category": "sports", "description": "cricket, sports, ground, pitch, खेल का मैदान" },
  { "name" : "main building", "displayName": "Main Academic Building", "category": "academics", "description": "main building, admin, offices, classes, मुख्य भवन" },
  { "name" : "first year computer lab", "displayName": "First Year Computer Lab", "category": "academics", "description": "first year, lab, computer, cse, it, प्रयोगशाला" },
  { "name" : "electronics department nba accredited", "displayName": "Electronics Dept (NBA Accredited)", "category": "academics", "description": "electronics, ece, department, nba, विभाग" },
  { "name" : "physics lab", "displayName": "Physics Lab", "category": "academics", "description": "physics, science, lab, भौतिकी, प्रयोगशाला" },
  { "name" : "divyangjan classroom", "displayName": "Divyangjan Classroom", "category": "academics", "description": "accessible classroom, divyang, disabled, क्लासरूम" },
  { "name" : "chemical and biotech department", "displayName": "Chemical & Biotech Dept", "category": "academics", "description": "chemical, biotech, department, विभाग" },
  { "name" : "chemical department exit gate", "displayName": "Chemical Dept Exit Gate", "category": "gates", "description": "chemical gate, exit, gate, द्वार" },
  { "name" : "mechanical lab", "displayName": "Mechanical Lab", "category": "academics", "description": "mechanical, me, lab, workshop, प्रयोगशाला" },
  { "name" : "aith incubation and startup centre", "displayName": "Incubation & Startup Centre", "category": "facilities", "description": "incubation, startup, centre, business, स्टार्टअप" },
  { "name" : "canteen", "displayName": "Campus Canteen", "category": "facilities", "description": "canteen, food, cafeteria, lunch, कैंटीन, खाना" },
  { "name" : "library", "displayName": "Central Library", "category": "facilities", "description": "library, books, study, silent, पुस्तकालय, किताबें" },
  { "name" : "sports complex", "displayName": "Sports Complex", "category": "sports", "description": "sports, gym, complex, indoor games, खेल" },
  { "name" : "boys hostel A", "displayName": "Boys Hostel Block A", "category": "hostels", "description": "boys, hostel, block a, residence, छात्रावास" },
  { "name" : "boys hostel B", "displayName": "Boys Hostel Block B", "category": "hostels", "description": "boys, hostel, block b, residence, छात्रावास" },
  { "name" : "food technology dept", "displayName": "Food Technology Dept", "category": "academics", "description": "food technology, department, academic, विभाग" },
  { "name" : "paint tech dept", "displayName": "Paint Technology Dept", "category": "academics", "description": "paint technology, department, paint, विभाग" },
  { "name" : "admin block", "displayName": "Administrative Block", "category": "facilities", "description": "admin, office, block, governance, प्रशासनिक" },
  { "name" : "staff parking", "displayName": "Staff Parking", "category": "facilities", "description": "parking, staff, cars, bikes, पार्किंग" },
  { "name" : "auditorium", "displayName": "Main Auditorium", "category": "facilities", "description": "auditorium, seminar, events, hall, सभागार" },
  { "name" : "civil dept", "displayName": "Civil Dept", "category": "academics", "description": "civil engineering, department, civil, विभाग" },
  { "name" : "workshop", "displayName": "Central Workshop", "category": "facilities", "description": "workshop, mechanical, lab, मशीन, कार्यशाला" },
  { "name" : "tennis court", "displayName": "Tennis Court", "category": "sports", "description": "tennis, sports, court, play, टेनिस" },
  { "name" : "ATM", "displayName": "ATM (Campus Branch)", "category": "facilities", "description": "atm, bank, money, cash, एटीएम" },
  { "name" : "guest house", "displayName": "Guest House", "category": "hostels", "description": "guest room, stay, visitors, guest, अतिथि गृह" },
  { "name" : "accountant section", "displayName": "Accountant Section", "category": "facilities", "description": "accountant, finance, fees, office, लेखा" },
  { "name" : "director room", "displayName": "Director's Office", "category": "facilities", "description": "director, head, office, room, निदेशक" }
];

// 2. Embedded RAG Dataset
const localKnowledgeContent = `
=== AITD CONTACT & ADDRESS ===
- Name: Dr. Ambedkar Institute of Technology for Handicapped (A.I.T.D.), Kanpur (also known as Dr. Ambedkar Institute of Technology for Divyangjan).
- Director: Prof. Rachna Asthana
- Address: Awadhpuri (Opposite Rama Dental College), Kanpur, Uttar Pradesh, 208024.
- Phone Number: 0512-2583221.
- Email: director@aith.ac.in, info@aith.ac.in.
- Website: aitd.ac.in (or aith.ac.in).

=== ACCESSIBILITY & ADMISSIONS FOR DIVYANGJAN ===
- Accessibility: "Entire facility is barrier-free" — The entire campus premises are fully accessible for physically challenged (Divyangjan) students.
- B.Tech Seats Reservation: 60% of B.Tech seats are reserved specifically for physically challenged (Divyangjan) candidates.
- Diploma Courses: There are special Diploma courses available that are designed specifically for disabled students.
- Amenities Note: Ramps, lifts, and accessible washrooms are built throughout the facility. Although the official website does not list specific building-by-building locations, the entire campus is barrier-free.

=== SCHOLARSHIPS & DOCUMENTS ===
- Scholarship Eligibility: State scholarship (UP State Scholarship) is available for students whose family annual income is less than or equal to ₹2,00,000 per year.
- Required Documents for Fee Reimbursement:
  1. Income Certificate (आय प्रमाण पत्र) - reflecting family income ≤ ₹2,00,000.
  2. Caste Certificate (जाति प्रमाण पत्र) if applicable.
  3. Domicile Certificate (निवास प्रमाण पत्र).
  4. Disability Certificate (दिव्यांगता प्रमाण पत्र).
  5. Fee Receipt & Admission Letter.
  6. Aadhar Card & Bank Account details linked with Aadhar.

=== AITD B.TECH FEE STRUCTURE ===
The annual fees structure for B.Tech students at Dr. Ambedkar Institute of Technology for Handicapped (AITD), Kanpur:
- Tuition Fees: ₹65,000 per year.
- Development Fees: ₹10,000 per year.
- Library & Lab Charges: ₹5,000 per year.
- Other Institutional Fees: ₹7,800 per year.
- Total Institutional Fees: ₹87,800 per year (excluding hostel and examination fees).
- Hostel Fees: ₹15,000 per year (includes lodging, electricity, and basic water).
- Mess Charges: Approximately ₹3,000 per month (charged separately based on actual cooperative mess expenditures).
- Examination Fees: ₹7,500 per year (charged by AKTU university).
- Scholarships: All eligible handicapped (Divyangjan) students and reserved category students are eligible to apply for the Uttar Pradesh State Scholarship (UP Scholarship) and National Scholarship Portal (NSP) for full reimbursement of institutional fees.

=== AITD B.TECH DEPARTMENTS ===
Dr. Ambedkar Institute of Technology for Handicapped (AITD) offers B.Tech programs in the following branches/departments:
1. Computer Science & Engineering (CSE) - Located in F-Block.
2. Information Technology (IT) - Located in F-Block.
3. Electronics Engineering - NBA Accredited department.
4. Chemical Engineering - Located in the Chemical and Biotech block.
5. Biotechnology - Located near the chemical department.
6. Paint Technology - Specialized branch.
7. Food Technology - Specialized branch.
8. Civil Engineering.
9. Mechanical Engineering.

=== DIVYANGJAN SCRIBE & WRITER RULES ===
Rules for availing a writer/scribe or reader during AKTU university examinations at AITD:
1. Eligibility: Physically challenged students with more than 40% disability in writing limbs, blind/visially impaired students, or students with temporary arm injuries are eligible.
2. Scribe qualification: The scribe/writer must be one academic grade lower than the candidate (e.g., a first-year student can write for a second-year student). Scribe cannot be from the same department/branch.
3. Extra Time: Candidates availing scribes are eligible for an extra 20 minutes per hour of exam duration (e.g., 60 minutes extra for a 3-hour exam).
4. Application Procedure: Submit an application to the Controller of Examinations (COE) along with a valid CMO Medical Disability Certificate and Scribe identity card proof at least 7 days before the start of the exams.

=== ACCESSIBILITY & AMENITIES ===
AITD Kanpur is a barrier-free campus designed for handicapped students:
- Ramps: Installed at the entrance of all academic blocks, hostels, and libraries.
- Lift: Installed in the Main Academic Building to access classrooms and labs on higher floors.
- Special Classrooms: Wheelchair accessible rooms equipped with low-height writing desks.
- Divyangjan Hostel: Custom-designed hostel rooms with wider doors, attached accessible washrooms with grab rails, and tactile flooring.

=== AITD PLACEMENT CELL ===
The Training & Placement (T&P) Cell at AITD Kanpur actively assists students in securing job placements and internships.
- **Dean, Training & Placement Cell (Degree Wing)**: Prof. P. K. Kamani (Email: pkk@aith.ac.in)
- **Associate Dean, Training & Placement Cell (Degree Wing)**: Dr. Rohit Sharma (Email: rohit@aith.ac.in)
- **Associate Dean, Training & Placement Cell (Diploma Wing)**: Mr. A. K. Agarwal (Email: akn@aith.ac.in)
- **General Contact**: T&P Cell Phone: +91-8005495164, Email: tpodeg@aith.ac.in
- **Recruiters**: Major recruiters include TCS, Wipro, Infosys, Tech Mahindra, HCL, and specialized paint/chemical industries (such as Berger Paints, Kansai Nerolac) for chemical/paint technology branches.
- **Location**: The placement coordination office is located in the Main Academic/Administrative Block.
- **Preparation**: The cell coordinates mock interviews, soft skill training, and industrial visits to prepare students for placements.

=== AITD ADMISSIONS ===
Admission guidelines for B.Tech and Diploma courses at AITD:
- B.Tech Admissions: Conducted based on JEE Main ranks through UPTAC (AKTU) counseling.
- Divyangjan Reservation: 60% of total seats in B.Tech courses are reserved specifically for physically challenged (handicapped/Divyangjan) candidates.
- Diploma Admissions: Admission to Diploma courses is through JEECUP counseling.
- Enquiries: Visit the Admission Cell in the Administrative Block.

=== HOSTELS AND CANTEEN ===
Details of student stay and dining facilities at AITD Kanpur:
- Divyangjan Hostel: Specially designed hostel for disabled students featuring wide doors, accessible washrooms, grab rails, and ramps.
- General Hostels: Separate secure hostel blocks for boys and girls.
- Canteen: The campus canteen offers hygienic food, snacks, and beverages at subsidized rates. Fully accessible via ramps.

=== LIBRARY AND COMPUTER FACILITIES ===
- Central Library: Features a vast collection of text/reference books, journals, and a digital library section with e-learning resources. Ground floor is completely barrier-free.
- Computer Center: High-speed internet enabled labs for academic programming and project work, located in the CSE & IT block (F-Block).

=== ANTI-RAGGING AND SAFETY ===
- Zero Tolerance: AITD Kanpur has a strict zero-tolerance policy against ragging.
- Anti-Ragging Committee: Headed by senior faculty members; complaints can be filed at the Director's Office or online.
- CCTV & Guards: 24/7 security personnel and CCTV surveillance across campus ensure safety.

=== AITD FACULTY & DEPARTMENT HEADS (HODs) ===
- Director of the Institute:
  * Name: Prof. Rachna Asthana
  * Designation: Director (serving since 2018)
  * Office Location: Director's Office, Main Academic Building
  * Email: director@aith.ac.in
- Computer Science & Engineering (CSE) & Information Technology (IT) Department:
  * HOD Name: Dr. Shrinath Dwivedi (डॉ. श्रीनाथ द्विवेदी).
  * Designation: Professor & Head of Department.
  * Office Location: F-Block, CSE & IT Department.
  * Description: Highly experienced, student-friendly professor who coordinates academic and accessibility support for disabled students in the computer departments.
- Electronics Engineering Department:
  * HOD Name: Prof. Rachna Asthana (also serves as the Director of the Institute).
  * Office Location: Electronics Department building.
- Chemical Engineering & Biotechnology Department:
  * HOD Name: Dr. Arun Kumar (or current head).
  * Office Location: Chemical & Biotech block.
- Paint Technology Department:
  * HOD Name: Dr. Pramod Kumar (or current head).
  * Office Location: Paint Tech Block.
- Food Technology Department:
  * HOD Name: Dr. IP Singh (or current head).
  * Office Location: Food Tech Block.
`;

// 3. Bilingual local fallback facts database
const localFacts = [
  {
    keywords: ['director', 'directors', 'director\'s name', 'director name', 'who is the director', 'head of institute', 'rachna', 'asthana', 'rachna asthana', 'prof rachna asthana'],
    english: `### Director of AITD Kanpur:\n- **Director**: Prof. Rachna Asthana\n- **Director's Office**: Located in the Main Academic Building (Director's Office room).\n- **Email**: director@aith.ac.in\n- **Phone**: 0512-2583221.`,
    hindi: `### AITD के निदेशक:\n- **निदेशक**: प्रो. रचना अस्थाना\n- **निदेशक कार्यालय**: Main Academic Building (निदेशक कार्यालय) में स्थित है।\n- **ईमेल**: director@aith.ac.in\n- **फोन नंबर**: 0512-2583221।`
  },
  {
    keywords: ['hod', 'hods', 'head of department', 'faculty', 'professor', 'professors', 'teacher', 'teachers', 'shrinath', 'dwivedi', 'shrinath dwivedi'],
    english: `### AITD Department Heads (HODs) & Faculty:\n- **CSE & IT Department**: Dr. Shrinath Dwivedi (Office in F-Block)\n- **Electronics Engineering**: Prof. Rachna Asthana (Electronics Dept; also Director of the Institute)\n- **Chemical Engineering & Biotech**: Dr. Arun Kumar (Chemical & Biotech block)\n- **Paint Technology**: Dr. Pramod Kumar (Paint Tech Block)\n- **Food Technology**: Dr. IP Singh (Food Tech Block)`,
    hindi: `### AITD विभागाध्यक्ष (HODs) और संकाय:\n- **कंप्यूटर साइंस (CSE) और आईटी (IT)**: डॉ. श्रीनाथ द्विवेदी (कार्यालय: F-Block)\n- **इलेक्ट्रॉनिक्स इंजीनियरिंग**: प्रो. रचना अस्थाना (इलेक्ट्रॉनिक्स विभाग; संस्थान के निदेशक भी)\n- **केमिकल और बायोटेक**: डॉ. अरुण कुमार (केमिकल और बायोटेक ब्लॉक)\n- **पेंट टेक्नोलॉजी**: डॉ. प्रमोद कुमार (पेंट टेक ब्लॉक)\n- **खाद्य प्रौद्योगिकी (Food Tech)**: डॉ. IP सिंह (खाद्य प्रौद्योगिकी ब्लॉक)`
  },
  {
    keywords: ['fee', 'fees', 'hostel fee', 'mess fee', 'tuition', 'scholarship', 'scholarships', 'reimbursement', 'up scholarship', 'nsp'],
    english: `### AITD B.Tech Fee Structure:\n- **Tuition Fees**: ₹65,000 per year.\n- **Development Fees**: ₹10,000 per year.\n- **Library & Lab Charges**: ₹5,000 per year.\n- **Other Institutional Fees**: ₹7,800 per year.\n- **Total Institutional Fees**: ₹87,800 per year (excluding hostel and examination fees).\n- **Hostel Fees**: ₹15,000 per year (lodging, electricity, basic water).\n- **Mess Charges**: Approx. ₹3,000 per month (cooperative mess expenses).\n- **Examination Fees**: ₹7,500 per year.\n- **Scholarships**: Reserved category and Divyangjan students can apply for the UP State Scholarship and National Scholarship Portal (NSP) for full reimbursement of fees (family income ≤ ₹2,00,000 per year).\n- **Enquiries**: For fee payments and receipts, visit the Accountant Section in the Main Academic Building.`,
    hindi: `### AITD बी.टेक फीस संरचना:\n- **ट्यूशन फीस**: ₹65,000 प्रति वर्ष।\n- **विकास शुल्क**: ₹10,000 प्रति वर्ष।\n- **लाइब्रेरी और लैब शुल्क**: ₹5,000 प्रति वर्ष।\n- **अन्य संस्थागत शुल्क**: ₹7,800 प्रति वर्ष।\n- **कुल संस्थागत फीस**: ₹87,800 प्रति वर्ष (हॉस्टल और परीक्षा शुल्क को छोड़कर)।\n- **हॉस्टल फीस**: ₹15,000 प्रति वर्ष (आवास, बिजली, बुनियादी पानी)।\n- **मेस शुल्क**: लगभग ₹3,000 प्रति माह।\n- **परीक्षा शुल्क**: ₹7,500 प्रति वर्ष।\n- **छात्रवृत्ति (Scholarships)**: यूपी राज्य छात्रवृत्ति (UP Scholarship) और राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) के तहत सभी पात्र दिव्यांग छात्रों को संस्थागत फीस की पूर्ण प्रतिपूर्ति (रिफंड) मिल सकती है (पारिवारिक वार्षिक आय ≤ ₹2,00,000 होनी चाहिए)।\n- **पूछताछ**: फीस जमा करने या रसीद प्राप्त करने के लिए आप Main Academic Building में Accountant Section (लेखा विभाग) जा सकते हैं।`
  },
  {
    keywords: ['department', 'departments', 'branch', 'branches', 'cse', 'it', 'computer science', 'electronics', 'chemical', 'biotech', 'biotechnology', 'paint technology', 'food technology', 'civil engineering', 'mechanical engineering'],
    english: `### AITD B.Tech Departments & Admissions:\n1. **Computer Science & Engineering (CSE)** - HOD office located in F-Block (CSE & IT).\n2. **Information Technology (IT)** - HOD office located in F-Block (CSE & IT).\n3. **Electronics Engineering** - Located in the Electronics Dept (NBA Accredited).\n4. **Chemical Engineering** - Located in the Chemical & Biotech Dept block.\n5. **Biotechnology** - Located in the Chemical & Biotech Dept block.\n6. **Paint Technology** - Located in the Paint Technology Dept block.\n7. **Food Technology** - Located in the Food Technology Dept block.\n8. **Civil Engineering** - Located in the Civil Dept block.\n9. **Mechanical Engineering** - Workshops located in the Mechanical Lab and Central Workshop.\n\n*Note*: 60% of B.Tech seats are reserved specifically for physically challenged (Divyangjan) candidates in the Administrative Block admission cell. There are also specialized Diploma courses designed for disabled students.`,
    hindi: `### AITD बी.टेक विभाग (Departments) और प्रवेश:\n1. **कंप्यूटर साइंस एंड इंजीनियरिंग (CSE)** - HOD कार्यालय F-Block (CSE & IT) में स्थित है।\n2. **इन्फॉर्मेशन टेक्नोलॉजी (IT)** - HOD कार्यालय F-Block (CSE & IT) में स्थित है।\n3. **इलेक्ट्रॉनिक्स इंजीनियरिंग** - Electronics Dept (NBA Accredited) in structure.\n4. **केमिकल इंजीनियरिंग** - Chemical & Biotech Dept ब्लॉक में स्थित है।\n5. **बायोटेक्नोलॉजी** - Chemical & Biotech Dept ब्लॉक में स्थित है।\n6. **पेंट टेक्नोलॉजी** - Paint Technology Dept ब्लॉक में स्थित है।\n7. **खाद्य प्रौद्योगिकी (Food Tech)** - Food Technology Dept ब्लॉक में स्थित है।\n8. **सिविल इंजीनियरिंग** - Civil Dept ब्लॉक में स्थित है।\n9. **मैकेनिक इंजीनियरिंग** - कार्यशालाएं Mechanical Lab और Central Workshop में हैं।\n\n*विशेष टिप्पणी*: Administrative Block प्रवेश सेल में बी.टेक की 60% सीटें विशेष रूप से दिव्यांग (physically challenged) उम्मीदवारों के लिए आरक्षित हैं। दिव्यांगों के लिए विशेष डिप्लोमा पाठ्यक्रम भी उपलब्ध हैं।`
  },
  {
    keywords: ['scribe', 'writer', 'reader', 'aktu exam', 'aktu exams', 'exam writer', 'exam scribe', 'extra time', 'disability certificate', 'medical certificate', 'cmo certificate'],
    english: `### AITD Scribe/Writer Rules for Exams:\n1. **Eligibility**: Students with >40% writing limb disability, visual impairment, or temporary arm injuries are eligible to avail a scribe/reader during AKTU exams.\n2. **Qualification**: Scribe must be one academic grade lower than the candidate and from a different department/branch (e.g., a 1st year CSE student cannot write for a 2nd year CSE student, but can write for a 2nd year IT student).\n3. **Extra Time**: Candidates using a scribe get an **extra 20 minutes per hour** (e.g., 60 minutes extra for a 3-hour exam).\n4. **Procedure**: Submit an application to the Controller of Examinations (COE) at the Administrative Block along with a valid CMO Medical Disability Certificate and Scribe ID proof at least 7 days before exams start.`,
    hindi: `### परीक्षाओं के लिए लेखक/स्क्राइब (Scribe) नियम:\n1. **पात्रता**: लिखने वाले अंगों में 40% से अधिक दिव्यांगता वाले छात्र, दृष्टिबाधित छात्र, या हाथ की अस्थायी चोट वाले छात्र परीक्षा में लेखक/स्क्राइब का लाभ ले सकते हैं।\n2. **योग्यता**: स्क्राइब उम्मीदवार से एक शैक्षणिक वर्ष नीचे होना चाहिए और एक ही विभाग/शाखा से नहीं होना चाहिए (जैसे, प्रथम वर्ष का छात्र द्वितीय वर्ष के छात्र के लिए लिख सकता है)।\n3. **अतिरिक्त समय**: स्क्राइब का उपयोग करने वाले उम्मीदवारों को परीक्षा अवधि के प्रति घंटे **20 मिनट का अतिरिक्त समय** मिलता है (जैसे, 3 घंटे की परीक्षा के लिए 60 मिनट अतिरिक्त)।\n4. **प्रक्रिया**: परीक्षा शुरू होने से कम से कम 7 दिन पहले मुख्य चिकित्सा अधिकारी (CMO) के दिव्यांगता प्रमाण पत्र और स्क्राइब के पहचान पत्र के साथ Administrative Block में परीक्षा नियंत्रक (COE) को आवेदन जमा करें।`
  },
  {
    keywords: ['accessibility', 'amenity', 'amenities', 'ramp', 'ramps', 'lift', 'lifts', 'elevator', 'wheelchair', 'accessible', 'barrier-free', 'toilet', 'washroom', 'grab rails', 'tactile flooring'],
    english: `### Accessibility & Amenities for Divyangjan:\n- **Ramps**: Installed at the entrance of all academic blocks, hostels (including Divyangjan Hostel), and libraries to ensure barrier-free movement.\n- **Lifts/Elevators**: Installed in the Main Academic Building to access upper floor classrooms (accessible via Main Building Lift).\n- **Accessible Classrooms**: Wheelchair-friendly rooms with low-height writing desks like the Divyangjan Classroom.\n- **Divyangjan Hostel**: Specially designed rooms featuring wider doors, grab rails, and accessible washrooms.`,
    hindi: `### दिव्यांगजन सुविधाएं और सुलभता (Accessibility):\n- **रैंप**: सभी शैक्षणिक ब्लॉकों, पुस्तकालयों और Divyangjan Hostel के प्रवेश द्वार पर रैंप स्थापित किए गए हैं ताकि व्हीलचेयर का आवागमन आसान हो सके।\n- **लिफ्ट**: ऊपरी मंजिलों पर कक्षाओं और लैब तक पहुंचने के लिए Main Academic Building में Main Building Lift लगाई गई है।\n- **अनुकूलित कक्षाएं**: व्हीलचेयर सुलभ कमरे जो कम ऊंचाई वाले लेखन डेस्क से सुसज्जित हैं जैसे कि Divyangjan Classroom।\n- **दिव्यांगजन हॉस्टल (Divyangjan Hostel)**: चौड़े दरवाजे, ग्रैब रेल्स (grab rails) और सुलभ शौचालय वाले विशेष अनुकूलित कमरे।`
  },
  {
    keywords: ['contact', 'phone number', 'mobile number', 'email id', 'email address', 'office address', 'aith', 'aitd', 'website'],
    english: `### Contact & Office Details:\n- **Address**: Awadhpuri (Opposite Rama Dental College), Kanpur, Uttar Pradesh, 208024.\n- **Phone Number**: 0512-2583221.\n- **Email**: director@aith.ac.in, info@aith.ac.in.\n- **Website**: aitd.ac.in (or aith.ac.in).\n- **Director's Office**: Located in the Main Academic Building (Director's Office room).\n- **Administrative Block HODs**: Administrative Block HOD and director offices are located here.\n- **CSE/IT Department HOD**: Dr. Shrinath Dwivedi (Office located in F-Block (CSE & IT)).`,
    hindi: `### संपर्क और कार्यालय विवरण:\n- **पता**: पता: अवधपुरी (रामा डेंटल कॉलेज के सामने), कानपुर, उत्तर प्रदेश, 208024।\n- **फोन नंबर**: 0512-2583221।\n- **ईमेल**: director@aith.ac.in, info@aith.ac.in।\n- **वेबसाइट**: aitd.ac.in या aith.ac.in।\n- **निदेशक कार्यालय**: Main Academic Building में Director's Office (निदेशक कार्यालय) के रूप में स्थित है।\n- **प्रशासनिक कार्यालय**: Administrative Block में विभिन्न प्रशासनिक विभाग और डायरेक्टर ऑफिस हैं।\n- **CSE/IT विभाग HOD**: डॉ. श्रीनाथ द्विवेदी (कार्यालय F-Block (CSE & IT) में स्थित है)।`
  },
  {
    keywords: ['placement', 'placements', 'placement cell', 'job', 'jobs', 'recruit', 'recruitment', 'recruiting', 'recruiters', 'package', 'salary', 'tpo', 'training', 'internship', 'internships', 'placement head', 'placement cell head', 'tpo name', 'tpo officer', 'kamani', 'rohit sharma', 'rohit kumar', 'p k kamani'],
    english: `### AITD Placement Cell & TPO:\n- **Dean, Training & Placement Cell (Degree)**: Prof. P. K. Kamani (Email: pkk@aith.ac.in)\n- **Associate Dean, T&P (Degree)**: Dr. Rohit Sharma (Email: rohit@aith.ac.in)\n- **Associate Dean, T&P (Diploma)**: Mr. A. K. Agarwal (Email: akn@aith.ac.in)\n- **T&P Cell Phone**: +91-8005495164, Email: tpodeg@aith.ac.in\n- **Key Recruiters**: TCS, Wipro, Infosys, Tech Mahindra, HCL, Berger Paints, Kansai Nerolac.\n- **Location**: Located in the Main Academic/Administrative Block.\n- **Preparation**: Mock interviews, soft skill training, and industrial visits.`,
    hindi: `### AITD प्लेसमेंट सेल और TPO:\n- **डीन, ट्रेनिंग एंड प्लेसमेंट सेल (डिग्री)**: प्रो. पी. के. कमानी (ईमेल: pkk@aith.ac.in)\n- **एसोसिएट डीन, T&P (डिग्री)**: डॉ. रोहित शर्मा (ईमेल: rohit@aith.ac.in)\n- **एसोसिएट डीन, T&P (डिप्लोमा)**: श्री ए. के. अग्रवाल (ईमेल: akn@aith.ac.in)\n- **T&P सेल फोन**: +91-8005495164, ईमेल: tpodeg@aith.ac.in\n- **प्रमुख नियोक्ता**: TCS, Wipro, Infosys, Tech Mahindra, HCL, Berger Paints, Kansai Nerolac.\n- **स्थान**: Main Academic/Administrative Block में स्थित है।\n- **तैयारी**: प्लेसमेंट की तैयारी के लिए मॉक इंटरव्यू, सॉफ्ट स्किल ट्रेनिंग और औद्योगिक यात्राएं।`
  },
  {
    keywords: ['admission', 'admissions', 'apply', 'counseling', 'jee', 'jee main', 'upcet', 'uptu', 'seat', 'seats', 'intake', 'eligibility'],
    english: `### AITD Admissions & Seats:\n- **B.Tech Admissions**: Conducted based on JEE Main ranks through UPTAC (AKTU) counseling.\n- **Divyangjan Reservation**: 60% of total seats in B.Tech courses are reserved specifically for physically challenged (Divyangjan) candidates.\n- **Diploma Admissions**: Admission to Diploma courses is through JEECUP counseling.\n- **Enquiries**: Visit the Admission Cell in the Administrative Block.`,
    hindi: `### AITD प्रवेश (Admissions) और सीटें:\n- **बी.टेक प्रवेश**: UPTAC (AKTU) काउंसलिंग के माध्यम से JEE Main रैंक के आधार पर किया जाता है।\n- **दिव्यांगजन आरक्षण**: बी.टेक पाठ्यक्रमों में कुल सीटों का 60% विशेष रूप से शारीरिक रूप से अक्षम (दिव्यांगजन) उम्मीदवारों के लिए आरक्षित है।\n- **डिप्लोमा प्रवेश**: डिप्लोमा पाठ्यक्रमों में प्रवेश JEECUP काउंसलिंग के माध्यम से होता है।\n- **पूछताछ**: Administrative Block में Admission Cell (प्रवेश कक्ष) पर जाएं।`
  },
  {
    keywords: ['hostel', 'hostels', 'mess', 'canteen', 'food', 'stay', 'accommodation', 'room rent', 'laundry'],
    english: `### Hostels & Canteen at AITD:\n- **Divyangjan Hostel**: Specially equipped hostel for disabled students with ramps, accessible toilets, and lower-height amenities.\n- **General Hostels**: Separate secure hostel blocks for boys and girls.\n- **Canteen**: The campus canteen offers hygienic food, snacks, and beverages at subsidized rates. Accessible via ramps.`,
    hindi: `### AITD हॉस्टल और कैंटीन:\n- **दिव्यांगजन हॉस्टल**: रैंप, सुलभ शौचालय और कम ऊंचाई वाली सुविधाओं से लैस दिव्यांग छात्रों के लिए विशेष छात्रावास।\n- **सामान्य हॉस्टल**: लड़कों और लड़कियों के लिए अलग-अलग सुरक्षित छात्रावास ब्लॉक।\n- **कैंटीन**: कैंपस कैंटीन रियायती दरों पर स्वच्छ भोजन, स्नैक्स और पेय प्रदान करती है। यह रैंप के माध्यम से सुलभ है।`
  },
  {
    keywords: ['library', 'book', 'books', 'journal', 'computer lab', 'computer center', 'internet', 'wifi'],
    english: `### Library & Computer Facilities:\n- **Central Library**: Features a vast collection of text/reference books, journals, and a digital library section with e-learning resources. Ground floor is completely barrier-free.\n- **Computer Center**: High-speed internet enabled labs for academic programming and project work, located in the CSE & IT block.`,
    hindi: `### लाइब्रेरी और कंप्यूटर सुविधाएं:\n- **केंद्रीय पुस्तकालय (Library)**: इसमें पाठ्यपुस्तकों/संदर्भ पुस्तकों, पत्रिकाओं और ई-लर्निंग संसाधनों वाले डिजिटल लाइब्रेरी अनुभाग का विशाल संग्रह है। भूतल पूरी तरह से बाधा मुक्त (barrier-free) है।\n- **कंप्यूटर केंद्र**: शैक्षणिक प्रोग्रामिंग और प्रोजेक्ट कार्य के लिए हाई-स्पीड इंटरनेट सक्षम लैब, जो CSE और IT ब्लॉक में स्थित हैं।`
  },
  {
    keywords: ['ragging', 'anti-ragging', 'security', 'safe', 'safety', 'harassment', 'complaint', 'helpline'],
    english: `### Anti-Ragging & Campus Safety:\n- **Zero Tolerance**: AITD Kanpur has a strict zero-tolerance policy against ragging.\n- **Anti-Ragging Committee**: Headed by senior faculty members; complaints can be filed at the Director's Office or online.\n- **CCTV & Guards**: 24/7 security personnel and CCTV surveillance across campus ensure safety.`,
    hindi: `### एंटी-रैगिंग और सुरक्षा:\n- **सख्त नीति**: AITD कानपुर में रैगिंग के खिलाफ सख्त विरोधी नीति है।\n- **एंटी-रैगिंग समिति**: वरिष्ठ संकाय सदस्यों के नेतृत्व में गठित; शिकायतें निदेशक कार्यालय या ऑनलाइन दर्ज की जा सकती हैं।\n- **सीसीटीवी और सुरक्षा**: सुरक्षा सुनिश्चित करने के लिए 24/7 सुरक्षा कर्मी और पूरे परिसर में सीसीटीवी निगरानी उपलब्ध है।`
  }
];

// Helper to check if a section contains a query word on word boundaries
function containsWord(text, word) {
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp('(?:^|[^a-zA-Z0-9\\u0900-\\u097F])' + escapedWord + '(?:$|[^a-zA-Z0-9\\u0900-\\u097F])', 'i');
  return regex.test(text);
}

// Local RAG Retrieval from embedded database
function searchLocalKnowledge(query) {
  try {
    const sections = localKnowledgeContent.split(/===|(?:\r?\n){2,}/);
    const matchingSections = [];
    const stopWords = ['hai', 'hain', 'he', 'ho', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein', 'bhai', 'batao', 'suno', 'naam', 'pata', 'bata', 'kar', 'kr', 'kra', 'kiya', 'tha', 'thi', 'the', 'kya', 'kise', 'kisne', 'kon', 'kaun', 'ab', 'gaya', 'gaye', 'gayi', 'aur', 'ya', 'toh', 'to', 'hi'];
    const words = query.toLowerCase()
      .split(/[\s,.\?\!]+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));

    for (const section of sections) {
      const cleanSection = section.trim();
      if (!cleanSection) continue;

      const lowerSection = cleanSection.toLowerCase();
      let score = 0;

      for (const word of words) {
        if (containsWord(lowerSection, word)) {
          score += 1;
          const firstLine = lowerSection.split('\n')[0];
          if (containsWord(firstLine, word)) {
            score += 2;
          }
        }
      }

      if (score > 0) {
        matchingSections.push({ section: cleanSection, score });
      }
    }

    matchingSections.sort((a, b) => b.score - a.score);
    const topMatches = matchingSections.slice(0, 3).map(m => m.section);
    return topMatches.join("\n\n---\n\n");
  } catch (error) {
    console.error("Local RAG search failed:", error);
    return "";
  }
}

// Detect if query is in Hindi or Hinglish
function isHindi(text) {
  const containsDevanagari = /[\u0900-\u097F]/.test(text);
  if (containsDevanagari) return true;

  const hindiKeywords = ['kaha', 'kahan', 'hai', 'he', 'kaise', 'kab', 'kis', 'kitna', 'kitni', 'kyun', 'kyon', 'ko', 'se', 'me', 'mein', 'bhai', 'batao', 'suno', 'naam', 'kamra', 'pata', 'bata', 'shi', 'kar', 'jldi', 'kra', 'kr'];
  const words = text.toLowerCase().split(/\s+/);
  return words.some(w => hindiKeywords.includes(w));
}

// Rule-based local fallback response
function getLocalFallbackResponse(query) {
  const lowerQuery = query.toLowerCase().trim();
  const useHindi = isHindi(query);

  const greetings = ['hi', 'hello', 'hey', 'namaste', 'helo', 'hlo', 'नमस्ते', 'helo', 'hii', 'hiii', 'listen', 'bhai', 'listen bhai'];
  if (greetings.includes(lowerQuery) || lowerQuery === 'hi sarathi' || lowerQuery === 'hello sarathi' || lowerQuery.startsWith('hi ') || lowerQuery.startsWith('hello ')) {
    if (useHindi) {
      return `नमस्ते! मैं **सारथी (Sarathi)** हूँ, AITD कैंपस का AI सहायक। ♿ 🧭\n\nमैं आपको AITD कैंपस के रास्तों, हॉस्टल, लैब, दिव्यांग सुविधाओं (accessibility), फीस संरचना और स्कॉलरशिप के बारे में जानकारी दे सकता हूँ।\n\nआप मुझसे कुछ भी पूछ सकते हैं, जैसे:\n- "Fees kitni hai?"\n- "Divyangjan hostel kaha hai?"\n- "CSE Department ka HOD kaun hai?"\n- "Scribe rules kya hai?"`;
    } else {
      return `Hello! I am **Sarathi**, the AI Assistant of AITD Campus. ♿ 🧭\n\nI can assist you with campus routes, hostels, labs, accessibility facilities, fee structure, and scholarships.\n\nFeel free to ask me anything, such as:\n- "What is the fee structure?"\n- "Where is the Divyangjan hostel?"\n- "Who is the HOD of CSE?"\n- "What are the scribe rules?"`;
    }
  }

  const isFacultyQuery = (containsWord(lowerQuery, 'dean') ||
                          containsWord(lowerQuery, 'coordinator') ||
                          containsWord(lowerQuery, 'faculty') ||
                          containsWord(lowerQuery, 'teacher') ||
                          containsWord(lowerQuery, 'professor')) &&
                         !containsWord(lowerQuery, 'director') &&
                         !containsWord(lowerQuery, 'hod');

  if (!isFacultyQuery) {
    for (const fact of localFacts) {
      const matched = fact.keywords.some(kw => containsWord(lowerQuery, kw));
      if (matched) {
        if (useHindi) {
          return `AITD लोकल डेटाबेस के अनुसार:\n\n${fact.hindi}\n\nयदि आप ऊपर दी गई जानकारी से संबंधित किसी स्थान पर जाना चाहते हैं, तो नीचे दिए गए 'Find Route' बटन का उपयोग कर सकते हैं। 👇`;
        } else {
          return `According to AITD local database:\n\n${fact.english}\n\nIf you want to view the route to any location mentioned above, please use the 'Find Route' button below. 👇`;
        }
      }
    }
  }

  const retrievedKnowledge = searchLocalKnowledge(query);
  if (retrievedKnowledge) {
    let response = useHindi ? `AITD डेटाबेस के अनुसार:\n\n` : `According to the AITD database:\n\n`;
    const parts = retrievedKnowledge.split("\n\n---\n\n");
    parts.forEach(part => {
      const formattedPart = part.replace(/===\s*(.*?)\s*===/g, '### $1');
      response += formattedPart + "\n\n";
    });
    response += useHindi 
      ? `यदि आप ऊपर दी गई जानकारी से संबंधित किसी स्थान पर जाना चाहते हैं, तो नीचे दिए गए 'Find Route' बटन का उपयोग कर सकते हैं। 👇`
      : `If you want to view the route to any location mentioned above, please use the 'Find Route' button below. 👇`;
    return response;
  }

  const matchedLocs = [];
  const genericBlocklist = ['lab', 'room', 'gate', 'road', 'path', 'dept', 'department', 'block', 'hostel', 'campus', 'building', 'office', 'entrance', 'exit', 'sports', 'game', 'play', 'ground', 'court', 'auditorium', 'centre', 'stage', 'main', 'landmark', 'milestone'];

  for (const loc of locations) {
    const name = loc.name.toLowerCase();
    const disp = (loc.displayName || "").toLowerCase();
    let isMatch = containsWord(lowerQuery, name) || (disp && containsWord(lowerQuery, disp));

    if (!isMatch && loc.description) {
      const tags = loc.description.split(',').map(t => t.trim().toLowerCase());
      for (const tag of tags) {
        if (tag.length > 3 && !genericBlocklist.includes(tag) && containsWord(lowerQuery, tag)) {
          isMatch = true;
          break;
        }
      }
    }

    if (isMatch) {
      matchedLocs.push(loc);
    }
  }

  if (matchedLocs.length > 0) {
    const loc = matchedLocs[0];
    if (useHindi) {
      let response = `AITD कैंपस में **${loc.displayName}** उपलब्ध है। `;
      if (loc.category) {
        response += `यह **${loc.category}** श्रेणी में आता है। `;
      }
      response += `\n\nमैंने आपके नेविगेशन के लिए नीचे बटन जोड़ दिया है। आप उस पर क्लिक करके सीधा मार्ग देख सकते हैं!`;
      return response;
    } else {
      let response = `**${loc.displayName}** is available on the AITD campus. `;
      if (loc.category) {
        response += `It belongs to the **${loc.category}** category. `;
      }
      response += `\n\nI have added a button below for your navigation. Click it to view the route!`;
      return response;
    }
  }

  if (useHindi) {
    return `नमस्ते! मैं AITD कैंपस से जुड़ी जानकारी और दिव्यांग सहायता के लिए उपलब्ध हूँ। आपके प्रश्न के बारे में मुझे विशिष्ट विवरण नहीं मिला, लेकिन आप इनसे संबंधित कुछ भी पूछ सकते हैं:\n\n1. **AITD B.Tech Fees**: फीस संरचना, हॉस्टल फ़ीस।\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech आदि।\n3. **Divyangjan Features**: Ramps, Lifts, Scribe Rules, Divyangjan Hostel.\n4. **Contacts**: फ़ोन नंबर, ईमेल और पता।\n\nआप नीचे दिए गए मैप पर भी किसी भी स्थान का मार्ग देख सकते हैं!`;
  } else {
    return `Hello! I am here to help with AITD campus details and accessibility support. I couldn't find specific information for your question, but feel free to ask about:\n\n1. **AITD B.Tech Fees**: fee structure, hostel fees.\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech, etc.\n3. **Divyangjan Features**: ramps, lifts, scribe rules, Divyangjan hostel.\n4. **Contacts**: phone numbers, email, and address.\n\nYou can also find the route to any place using the map below!`;
  }
}

// 4. Netlify Serverless Function Handler
export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : '';
    const hasGroq = !!groqApiKey;

    const geminiApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : '';
    let genAI = null;
    if (geminiApiKey) {
      genAI = new GoogleGenAI({ apiKey: geminiApiKey });
    }

    // Helper for local streaming fallback
    const getFallbackStream = () => {
      return new ReadableStream({
        async start(controller) {
          const sendChunk = (text) => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
          };
          const fallbackText = getLocalFallbackResponse(message);
          const chunkSize = 4;
          for (let i = 0; i < fallbackText.length; i += chunkSize) {
            sendChunk(fallbackText.substring(i, i + chunkSize));
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          controller.enqueue(new TextEncoder().encode(`event: end\ndata: [DONE]\n\n`));
          controller.close();
        }
      });
    };

    if (!genAI && !hasGroq) {
      console.log("[Chat Function] Neither Gemini nor Groq configured. Using streaming local fallback.");
      return new Response(getFallbackStream(), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        }
      });
    }

    // Prepare System Instruction
    const retrievedKnowledge = searchLocalKnowledge(message);
    let ragContextInstruction = "";
    if (retrievedKnowledge) {
      ragContextInstruction = `
Use the following retrieved institutional guidelines and details to answer the user's questions accurately (especially about fees, rules, departments, or guidelines):
---
${retrievedKnowledge}
---
Always rely on the retrieved info above first before generating answers. If the information is not present in the text above, answer standardly.
`;
    }

    const systemInstruction = `
You are "सारथी (Sarathi)", a sensitive, helpful, and resourceful AI assistant for Dr. Ambedkar Institute of Technology for Divyangjan (AITD), Kanpur.
You are specifically designed to address and solve issues for physically challenged (Divyangjan) students and visitors.

#Behavior Rule & Guardrails
You MUST ONLY answer questions that are related to:
- Assistance and support for disabled students (Divyangjan assistance)
- College life, facilities, administration, and departments of AITD/AITH Kanpur
- Student welfare and scholarship schemes
- Personnel, staff, teachers, or faculty associated with AITD Kanpur (e.g., Technical Assistants, HODs, Directors, Ministers of technical education in UP). Any query containing "AITD", "Kanpur", "AITH", or reference to its people is considered completely IN-SCOPE.

If the user asks any question that is completely outside of these topics (for example: general politics, entertainment, coding/programming, history, general math, science, or general QA not related to AITD/Divyangjan), you MUST politely refuse and reply EXACTLY:
“क्षमा करें 🙏, मैं केवल AITD Kanpur और दिव्यांग सहायता से जुड़ी जानकारी प्रदान करने के लिए प्रशिक्षित हूँ।”

Do not add any other explanations or words when declining.

#Tone
Always remain extremely polite, respectful, cooperative, and supportive. Ensure students feel reassured and guided correctly. Use appropriate emojis to make responses clean and accessible.

#Goal
Support AITD Kanpur's disabled students with guidance about education, accessibility amenities, navigation routes, and government support schemes.

#Knowledge & Context
- AITD Campus Locations: ${JSON.stringify(locations)}
${ragContextInstruction}

#Language Preference
You MUST detect the language of the user's query. If the user asks in Hindi or Hinglish, respond in Hindi (Devanagari script) or Hinglish as appropriate. If the user asks in English, respond in English. Always match the user's preferred language.

#Execution Priority:
1. If the query is completely outside the AITD/Divyangjan scope, trigger the Guardrail Decline phrase immediately.
2. If the query is within scope, check the retrieved RAG context. If the answer is in the context, rely on it first.
3. If the query is within scope but not in the local RAG context, use your pre-trained LLM knowledge to answer the question as accurately as possible. If Google Search grounding is available (via the googleSearch tool), you can use it, but if not (e.g. running on Groq), you MUST answer standardly using your training data. Do NOT decline or state that you know nothing about it.

Keep responses direct and get straight to the point. Do not write long greeting headers in every reply.
`;

    // Try Groq first if available
    if (hasGroq) {
      console.log("[Chat Function] Attempting Groq Streaming...");
      try {
        const groqHistory = [];
        for (const msg of (history || [])) {
          groqHistory.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        }
        groqHistory.push({ role: 'user', content: message });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemInstruction },
              ...groqHistory
            ],
            max_tokens: 2000,
            stream: true
          })
        });

        if (response.ok) {
          const stream = new ReadableStream({
            async start(controller) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder("utf-8");
              let buffer = "";

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop();

                  for (const line of lines) {
                    const cleanLine = line.trim();
                    if (!cleanLine) continue;
                    if (cleanLine === 'data: [DONE]') continue;

                    if (cleanLine.startsWith('data: ')) {
                      try {
                        const parsed = JSON.parse(cleanLine.substring(6));
                        const chunkText = parsed.choices?.[0]?.delta?.content || "";
                        if (chunkText) {
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
                        }
                      } catch (e) {
                        // ignore parse errors
                      }
                    }
                  }
                }
                controller.enqueue(new TextEncoder().encode(`event: end\ndata: [DONE]\n\n`));
                controller.close();
              } catch (streamErr) {
                controller.error(streamErr);
              }
            }
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
            }
          });
        } else {
          throw new Error(`Groq API returned status ${response.status}`);
        }
      } catch (groqErr) {
        console.error("Groq call failed, falling back to Gemini:", groqErr);
      }
    }

    // Try Gemini as fallback
    if (genAI) {
      console.log("[Chat Function] Attempting Gemini Streaming...");
      try {
        const formattedContents = [];
        for (const msg of (history || [])) {
          formattedContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
        formattedContents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const resultStream = await genAI.models.generateContentStream({
          model: 'gemini-2.0-flash-lite',
          contents: formattedContents,
          config: {
            maxOutputTokens: 2000,
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }]
          }
        });

        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of resultStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
                }
              }
              controller.enqueue(new TextEncoder().encode(`event: end\ndata: [DONE]\n\n`));
              controller.close();
            } catch (geminiStreamErr) {
              controller.error(geminiStreamErr);
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
          }
        });
      } catch (geminiErr) {
        console.error("Gemini call failed, falling back to local static:", geminiErr);
      }
    }

    // Final fallback to static rules
    console.log("[Chat Function] Using final static local fallback.");
    return new Response(getFallbackStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error("Netlify Serverless Function Handler Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/chat"
};
