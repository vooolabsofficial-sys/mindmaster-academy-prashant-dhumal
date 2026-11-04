import React, { useState } from 'react';
import { submitWebsiteLead } from '../config/appConfig';

export interface DemoSeminarModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

export const DemoSeminarModal: React.FC<DemoSeminarModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Grade 8-12 & Boards',
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gradeCategory, setGradeCategory] = useState(defaultCategory);
  const [city, setCity] = useState('सातारा (Satara)');
  const [preferredSlot, setPreferredSlot] = useState('रविवार सकाळी १०:०० वा.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const getWhatsAppUrl = () => {
    const text = `नमस्कार प्रशांत धुमाळ सर,\nमी माइंड मास्टर अकॅडमीच्या मोफत सेमिनार / डेमो क्लाससाठी नोंदणी केली आहे.\n\n👤 नाव: ${fullName.trim()}\n📱 मोबाईल: ${phone.trim()}\n🎓 वर्ग / गट: ${gradeCategory}\n📍 शहर/जिल्हा: ${city}\n⏰ बॅच वेळ: ${preferredSlot}\n\nकृपया मला क्लासची लिंक व डिटेल्स पाठवा. धन्यवाद!`;
    return `https://wa.me/918459344077?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('कृपया किमान १० अंकी वैध मोबाईल नंबर प्रविष्ट करा.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('कृपया आपले पूर्ण नाव प्रविष्ट करा.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save to Admin CRM Database
      await submitWebsiteLead({
        name: fullName.trim(),
        phone: cleanPhone,
        courseInterest: `मोफत सेमिनार (${gradeCategory})`,
        message: `शहर/जिल्हा: ${city}. पसंतीची वेळ: ${preferredSlot}`,
        source: 'Website Free Seminar Modal',
      });

      // 2. Open WhatsApp pre-filled chat
      const waUrl = getWhatsAppUrl();
      const newWindow = window.open(waUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Pop-up was blocked, will be accessible via on-screen button
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg('तांत्रिक त्रुटी. कृपया खालील व्हॉट्सॲप बटण वापरून थेट संपर्क साधा.');
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
            <span>100% Free Live Seminar</span>
          </div>
          <h3 className="font-heading-bold text-xl sm:text-2xl font-black tracking-tight text-white">
            मोफत सेमिनार नाव-नोंदणी
          </h3>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            प्रशांत धुमाळ सर — सुपरफास्ट पाढे, फोटोग्राफिक मेमरी आणि कॅलेंडर तंत्रज्ञान
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
                  अभिनंदन! नाव-नोंदणी यशस्वी झाली!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  आपली माहिती ॲडमिन डेस्ककडे नोंदवली गेली आहे. सेमिनारची झूम व क्लासरूम लिंक मिळवण्यासाठी खालील व्हॉट्सॲप बटणावर क्लिक करा.
                </p>
              </div>

              {/* Student Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">विद्यार्थी / पालक:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">मोबाईल नंबर:</span>
                  <span className="font-bold text-slate-900">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">वर्ग / गट:</span>
                  <span className="font-bold text-slate-900">{gradeCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">पसंतीचा स्लॉट:</span>
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
                  <span>व्हॉट्सॲपवर क्लास लिंक मिळवा</span>
                </a>
                <a
                  href="tel:+918459344077"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-blue-600">call</span>
                  <span>हेल्पलाइन: +91 84593 44077</span>
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
                  विद्यार्थी / पालकांचे पूर्ण नाव <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="उदा. राहुल सचिन पाटील"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  व्हॉट्सॲप / मोबाईल नंबर <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                    smartphone
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={13}
                    placeholder="उदा. 9822012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  या नंबरवर मोफत सेमिनारची झूम व क्लासरूम लिंक पाठवली जाईल.
                </span>
              </div>

              {/* Grade / Target Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  वर्ग / तयारीचा टप्पा <span className="text-red-500">*</span>
                </label>
                <select
                  value={gradeCategory}
                  onChange={(e) => setGradeCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent bg-white transition-all cursor-pointer"
                >
                  <option value="इयत्ता ४थी ते ७वी (फाउंडेशन व पाढे)">इयत्ता ४थी ते ७वी (फाउंडेशन व १-१०० पाढे)</option>
                  <option value="इयत्ता ८वी ते १२वी व बोर्ड परीक्षा">इयत्ता ८वी ते १२वी व बोर्ड परीक्षा (मेमरी ट्रिक्स)</option>
                  <option value="MPSC / पोलीस भरती / स्पर्धा परीक्षा">MPSC / पोलीस भरती / स्पर्धा परीक्षा</option>
                  <option value="शिक्षक व पालक प्रशिक्षण (Trainer Program)">शिक्षक व पालक प्रशिक्षण (Trainer Program)</option>
                </select>
              </div>

              {/* City / District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शहर / जिल्हा
                  </label>
                  <input
                    type="text"
                    placeholder="सातारा / पुणे / इतर"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पसंतीची वेळ (Slot)
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-transparent bg-white transition-all cursor-pointer"
                  >
                    <option value="रविवार सकाळी १०:०० वा.">रविवार सकाळी १०:०० वा.</option>
                    <option value="रविवार संध्याकाळी ०५:०० वा.">रविवार संध्याकाळी ०५:०० वा.</option>
                    <option value="शनिवार संध्याकाळी ०५:०० वा.">शनिवार संध्याकाळी ०५:०० वा.</option>
                  </select>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900">
                <span className="material-symbols-outlined text-base text-[#0052FF] shrink-0">verified_user</span>
                <span>नोंदणी पूर्णपणे मोफत असून कोणतीही फी आकारली जाणार नाही.</span>
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
                    <span>नोंदणी होत आहे...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">app_registration</span>
                    <span>मोफत जागा बुक करा व व्हॉट्सॲप जोडा</span>
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
