import React, { useState } from 'react';
import { submitWebsiteLead } from '../config/appConfig';
import { useLanguage } from '../context/LanguageContext';

export interface DemoSeminarModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const TEXTS = {
  en: {
    ribbon: '100% Free Live Seminar',
    title: 'Free Demo Seminar Registration',
    subtitle: 'Prashant Dhumal Sir — Superfast Tables, Photographic Memory & 500-Year Calendar',
    successTitle: 'Registration Successful!',
    successDesc: 'Your details have been saved to the Admin desk. Click the WhatsApp button below to receive your classroom pass and Zoom invite directly.',
    studentLabel: 'Student / Parent:',
    phoneLabel: 'Mobile / WhatsApp:',
    categoryLabel: 'Target Grade / Category:',
    slotLabel: 'Preferred Slot:',
    waButton: 'Receive Class Pass on WhatsApp',
    helpButton: 'Helpline: +91 84593 44077',
    fullNameLabel: 'Full Name (Student or Parent)',
    fullNamePlaceholder: 'e.g. Rahul Patil',
    phoneInputLabel: 'WhatsApp / Mobile Number',
    phoneInputPlaceholder: 'e.g. 9822012345',
    phoneHelper: 'Your interactive seminar invite & link will be sent to this number.',
    categorySelectLabel: 'Grade / Target Category',
    categories: [
      { value: 'Grade 4-7 Foundation (1-100 Tables)', label: 'Grades 4 to 7 (Foundation & 1-100 Tables)' },
      { value: 'Grade 8-12 & Board Exam Mastery', label: 'Grades 8 to 12 & Board Exams (Memory Hacks)' },
      { value: 'MPSC / Police Bharti / Competitive Exams', label: 'MPSC / Police Bharti / Competitive Exams' },
      { value: 'Teacher & Parent Certification Program', label: 'Teacher & Coach Certification Program' },
    ],
    cityLabel: 'City / District',
    cityPlaceholder: 'Satara / Pune / Mumbai / Other',
    defaultCity: 'Satara',
    slotSelectLabel: 'Preferred Session Slot',
    slots: [
      'Sunday 10:00 AM IST',
      'Sunday 05:00 PM IST',
      'Saturday 05:00 PM IST',
    ],
    trustBadge: '100% Free Live Demo • Zero spam or fees',
    submitButton: 'Reserve Free Seat & Connect on WhatsApp',
    submitting: 'Reserving your seat...',
    errorPhone: 'Please enter a valid 10-digit mobile number.',
    errorName: 'Please enter your full name.',
    errorGeneral: 'Network issue. Please connect directly via WhatsApp.',
  },
  mr: {
    ribbon: '१००% मोफत थेट सेमिनार',
    title: 'मोफत सेमिनार नाव-नोंदणी',
    subtitle: 'प्रशांत धुमाळ सर — सुपरफास्ट पाढे, फोटोग्राफिक मेमरी आणि कॅलेंडर तंत्रज्ञान',
    successTitle: 'अभिनंदन! नाव-नोंदणी यशस्वी झाली!',
    successDesc: 'आपली माहिती ॲडमिन डेस्ककडे नोंदवली गेली आहे. सेमिनारची झूम व क्लासरूम लिंक मिळवण्यासाठी खालील व्हॉट्सॲप बटणावर क्लिक करा.',
    studentLabel: 'विद्यार्थी / पालक:',
    phoneLabel: 'मोबाईल नंबर:',
    categoryLabel: 'वर्ग / गट:',
    slotLabel: 'पसंतीचा स्लॉट:',
    waButton: 'व्हॉट्सॲपवर क्लास लिंक मिळवा',
    helpButton: 'हेल्पलाइन: +91 84593 44077',
    fullNameLabel: 'विद्यार्थी / पालकांचे पूर्ण नाव',
    fullNamePlaceholder: 'उदा. राहुल सचिन पाटील',
    phoneInputLabel: 'व्हॉट्सॲप / मोबाईल नंबर',
    phoneInputPlaceholder: 'उदा. 9822012345',
    phoneHelper: 'या नंबरवर मोफत सेमिनारची झूम व क्लासरूम लिंक पाठवली जाईल.',
    categorySelectLabel: 'वर्ग / तयारीचा टप्पा',
    categories: [
      { value: 'इयत्ता ४थी ते ७वी (फाउंडेशन व पाढे)', label: 'इयत्ता ४थी ते ७वी (फाउंडेशन व १-१०० पाढे)' },
      { value: 'इयत्ता ८वी ते १२वी व बोर्ड परीक्षा', label: 'इयत्ता ८वी ते १२वी व बोर्ड परीक्षा (मेमरी ट्रिक्स)' },
      { value: 'MPSC / पोलीस भरती / स्पर्धा परीक्षा', label: 'MPSC / पोलीस भरती / स्पर्धा परीक्षा' },
      { value: 'शिक्षक व पालक प्रशिक्षण (Trainer Program)', label: 'शिक्षक व पालक प्रशिक्षण (Trainer Program)' },
    ],
    cityLabel: 'शहर / जिल्हा',
    cityPlaceholder: 'सातारा / पुणे / इतर',
    defaultCity: 'सातारा (Satara)',
    slotSelectLabel: 'पसंतीची वेळ (Slot)',
    slots: [
      'रविवार सकाळी १०:०० वा.',
      'रविवार संध्याकाळी ०५:०० वा.',
      'शनिवार संध्याकाळी ०५:०० वा.',
    ],
    trustBadge: 'नोंदणी पूर्णपणे मोफत असून कोणतीही फी आकारली जाणार नाही.',
    submitButton: 'मोफत जागा बुक करा व व्हॉट्सॲप जोडा',
    submitting: 'नोंदणी होत आहे...',
    errorPhone: 'कृपया किमान १० अंकी वैध मोबाईल नंबर प्रविष्ट करा.',
    errorName: 'कृपया आपले पूर्ण नाव प्रविष्ट करा.',
    errorGeneral: 'तांत्रिक त्रुटी. कृपया खालील व्हॉट्सॲप बटण वापरून थेट संपर्क साधा.',
  },
  hi: {
    ribbon: '100% नि:शुल्क लाइव वेबिनार',
    title: 'फ्री सेमिनार रजिस्ट्रेशन',
    subtitle: 'प्रशांत धुमाल सर — सुपरफास्ट टेबल्स, फोटोग्राफिक मेमोरी और 500 साल का कैलेंडर',
    successTitle: 'बधाई! रजिस्ट्रेशन सफल रहा!',
    successDesc: 'आपकी जानकारी एडमिन डेस्क पर दर्ज हो गई है। क्लास लिंक प्राप्त करने के लिए नीचे दिए गए व्हाट्सएप बटन पर क्लिक करें।',
    studentLabel: 'विद्यार्थी / अभिभावक:',
    phoneLabel: 'मोबाइल नंबर:',
    categoryLabel: 'वर्ग / श्रेणी:',
    slotLabel: 'पसंदीदा समय:',
    waButton: 'व्हाट्सएप पर क्लास लिंक प्राप्त करें',
    helpButton: 'हेल्पलाइन: +91 84593 44077',
    fullNameLabel: 'पूरा नाम (विद्यार्थी या अभिभावक)',
    fullNamePlaceholder: 'उदा. राहुल सचिन पाटिल',
    phoneInputLabel: 'व्हाट्सएप / मोबाइल नंबर',
    phoneInputPlaceholder: 'उदा. 9822012345',
    phoneHelper: 'इस नंबर पर फ्री सेमिनार का ज़ूम लिंक भेजा जाएगा।',
    categorySelectLabel: 'कक्षा / तैयारी का स्तर',
    categories: [
      { value: 'कक्षा 4 से 7 (फाउंडेशन व पहाड़े)', label: 'कक्षा 4 से 7 (फाउंडेशन व 1-100 पहाड़े)' },
      { value: 'कक्षा 8 से 12 व बोर्ड परीक्षा', label: 'कक्षा 8 से 12 व बोर्ड परीक्षा (मेमोरी ट्रिक्स)' },
      { value: 'प्रतियोगी परीक्षा (MPSC / UPSC / Banking)', label: 'प्रतियोगी परीक्षा (MPSC / UPSC / Banking)' },
      { value: 'शिक्षक व अभिभावक प्रशिक्षण', label: 'शिक्षक व अभिभावक प्रशिक्षण' },
    ],
    cityLabel: 'शहर / जिला',
    cityPlaceholder: 'सातारा / पुणे / अन्य',
    defaultCity: 'सातारा (Satara)',
    slotSelectLabel: 'पसंदीदा स्लॉट',
    slots: [
      'रविवार सुबह 10:00 बजे',
      'रविवार शाम 05:00 बजे',
      'शनिवार शाम 05:00 बजे',
    ],
    trustBadge: 'रजिस्ट्रेशन पूर्णतः नि:शुल्क है, कोई शुल्क नहीं।',
    submitButton: 'फ्री सीट बुक करें और व्हाट्सएप से जुड़ें',
    submitting: 'रजिस्ट्रेशन हो रहा है...',
    errorPhone: 'कृपया कम से कम 10 अंकों का वैध मोबाइल नंबर दर्ज करें।',
    errorName: 'कृपया अपना पूरा नाम दर्ज करें।',
    errorGeneral: 'तकनीकी समस्या। कृपया व्हाट्सएप पर संपर्क करें।',
  }
};

export const DemoSeminarModal: React.FC<DemoSeminarModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
}) => {
  const { language } = useLanguage();
  const t = TEXTS[language] || TEXTS.en;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gradeCategory, setGradeCategory] = useState(defaultCategory || t.categories[1].value);
  const [city, setCity] = useState(t.defaultCity);
  const [preferredSlot, setPreferredSlot] = useState(t.slots[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const getWhatsAppUrl = () => {
    let text = '';
    if (language === 'mr') {
      text = `नमस्कार प्रशांत धुमाळ सर,\nमी माइंड मास्टर अकॅडमीच्या मोफत सेमिनार / डेमो क्लाससाठी नोंदणी केली आहे.\n\n👤 नाव: ${fullName.trim()}\n📱 मोबाईल: ${phone.trim()}\n🎓 वर्ग / गट: ${gradeCategory}\n📍 शहर/जिल्हा: ${city}\n⏰ बॅच वेळ: ${preferredSlot}\n\nकृपया मला क्लासची लिंक व डिटेल्स पाठवा. धन्यवाद!`;
    } else if (language === 'hi') {
      text = `नमस्ते प्रशांत धुमाल सर,\nमैंने माइंड मास्टर एकेडमी के फ्री सेमिनार / डेमो क्लास के लिए रजिस्ट्रेशन किया है।\n\n👤 नाम: ${fullName.trim()}\n📱 मोबाइल: ${phone.trim()}\n🎓 वर्ग: ${gradeCategory}\n📍 शहर/जिला: ${city}\n⏰ समय: ${preferredSlot}\n\nकृपया मुझे क्लास का ज़ूम लिंक भेजें। धन्यवाद!`;
    } else {
      text = `Hello Prashant Dhumal Sir,\nI have registered for MindMaster Academy's Free Demo Seminar.\n\n👤 Name: ${fullName.trim()}\n📱 Phone: ${phone.trim()}\n🎓 Grade / Category: ${gradeCategory}\n📍 City/District: ${city}\n⏰ Preferred Slot: ${preferredSlot}\n\nPlease share the Zoom link and classroom pass with me. Thank you!`;
    }
    return `https://wa.me/918459344077?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg(t.errorPhone);
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg(t.errorName);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save to Admin CRM Database
      await submitWebsiteLead({
        name: fullName.trim(),
        phone: cleanPhone,
        courseInterest: `Free Seminar (${gradeCategory})`,
        message: `City: ${city}. Preferred Slot: ${preferredSlot}. Language: ${language.toUpperCase()}`,
        source: 'Website Free Seminar Modal',
      });

      // 2. Open WhatsApp pre-filled chat
      const waUrl = getWhatsAppUrl();
      const newWindow = window.open(waUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Pop-up was blocked, will be accessible via on-screen button
      }

      setIsSuccess(true);
    } catch {
      setErrorMsg(t.errorGeneral);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setFullName('');
    setPhone('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={handleReset}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0052FF] via-[#0E1B3D] to-[#0052FF] px-6 py-5 text-white relative">
          <button
            onClick={handleReset}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{t.ribbon}</span>
          </div>
          <h3 className="font-heading-bold text-xl sm:text-2xl font-black tracking-tight text-white">
            {t.title}
          </h3>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 font-heading">
                  {t.successTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  {t.successDesc}
                </p>
              </div>

              {/* Student Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.studentLabel}</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.phoneLabel}</span>
                  <span className="font-bold text-slate-900">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.categoryLabel}</span>
                  <span className="font-bold text-slate-900">{gradeCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.slotLabel}</span>
                  <span className="font-bold text-emerald-700">{preferredSlot}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                  <span>{t.waButton}</span>
                </a>
                <a
                  href="tel:+918459344077"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-blue-600">call</span>
                  <span>{t.helpButton}</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.fullNameLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={t.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.phoneInputLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                    smartphone
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={13}
                    placeholder={t.phoneInputPlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {t.phoneHelper}
                </span>
              </div>

              {/* Grade / Target Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.categorySelectLabel} <span className="text-red-500">*</span>
                </label>
                <select
                  value={gradeCategory}
                  onChange={(e) => setGradeCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent bg-white transition-all cursor-pointer"
                >
                  {t.categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* City / District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.cityLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.cityPlaceholder}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.slotSelectLabel}
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent bg-white transition-all cursor-pointer"
                  >
                    {t.slots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900">
                <span className="material-symbols-outlined text-base text-[#0052FF] shrink-0">verified_user</span>
                <span>{t.trustBadge}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#0052FF] to-[#0E1B3D] hover:opacity-95 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">app_registration</span>
                    <span>{t.submitButton}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
