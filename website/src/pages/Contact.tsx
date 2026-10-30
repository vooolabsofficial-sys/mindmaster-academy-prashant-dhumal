import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchLiveWebsiteCms,
  submitWebsiteLead,
  WebsiteCmsData,
  DEFAULT_WEBSITE_CMS,
} from '../config/appConfig';

export const Contact: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCourse = searchParams.get('course') || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [courseSelect, setCourseSelect] = useState(initialCourse);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cms, setCms] = useState<WebsiteCmsData>(DEFAULT_WEBSITE_CMS);

  useEffect(() => {
    let isMounted = true;
    fetchLiveWebsiteCms().then((data) => {
      if (isMounted) setCms(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const courseParam = searchParams.get('course');
    if (courseParam) {
      setCourseSelect(courseParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    await submitWebsiteLead({
      name: `${firstName} ${lastName}`.trim(),
      phone: phone,
      email: email,
      courseInterest: courseSelect || 'General Inquiry',
      message: message,
      source: 'Contact Page Form',
    });
  };

  return (
    <main className="w-full pt-24 sm:pt-28 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        <section className="w-full bg-surface-container-low/60 py-space-3xl px-gutter-desktop border-b border-surface-variant/40">
          <div className="max-w-container-max mx-auto flex flex-col items-center">
            <div className="text-center max-w-2xl mx-auto mb-space-2xl">
              <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-secondary-fixed/50 text-secondary font-label-caps text-label-caps tracking-wider shadow-xs mb-space-md font-bold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> GET IN TOUCH
              </div>
              <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-5xl text-primary-container tracking-tight mb-space-xs font-extrabold">
                Get in{' '}
                <span className="relative inline-block text-secondary">
                  Touch
                  <svg className="absolute left-0 -bottom-2 w-full h-3 text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 140 12">
                    <path d="M3 9C40 2 95 1 137 8" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                  </svg>
                </span>
              </h1>
              <p className="font-body-lg text-sm sm:text-base text-on-surface-variant mt-space-sm">
                We're here to guide you or your child on this cognitive journey. Reach out with any academic inquiry or campus visit request.
              </p>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left Column: Contact Information Cards */}
              <div className="lg:col-span-5 flex flex-col gap-space-xl">
                <div className="bg-surface-container-lowest rounded-[24px] p-space-xl shadow-xs border border-surface-variant/60">
                  <div className="mb-space-lg">
                    <h3 className="font-headline-sm text-xl text-primary-container font-bold">Contact Information</h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-1">Our counsellor desk is available 7 days a week.</p>
                  </div>

                  <div className="space-y-space-lg">
                    <div className="flex items-start gap-space-md">
                      <div className="w-11 h-11 rounded-full bg-secondary-fixed/60 flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[22px]">location_on</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-label-caps text-on-surface-variant block uppercase text-[11px] font-bold">Flagship Headquarters</span>
                        <p className="font-title-md text-sm sm:text-base text-on-surface font-bold">MindMaster Academy HQ, Satara</p>
                        <p className="font-body-sm text-xs text-on-surface-variant">Near Powai Naka, Sadar Bazar, Satara, Maharashtra 415001</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-space-md">
                      <div className="w-11 h-11 rounded-full bg-secondary-fixed/60 flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[22px]">call</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="font-label-caps text-on-surface-variant block uppercase text-[11px] font-bold">Direct Line / WhatsApp</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-label-caps px-2 py-0.5 rounded-full font-bold">Instant Response</span>
                        </div>
                        <a className="font-title-md text-base sm:text-lg text-secondary hover:underline block font-bold" href="tel:+918459344077">
                          +91 84593 44077
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-space-md">
                      <div className="w-11 h-11 rounded-full bg-secondary-fixed/60 flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[22px]">schedule</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-label-caps text-on-surface-variant uppercase text-[11px] font-bold">Operating Hours</span>
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-label-caps text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Open Now
                          </span>
                        </div>
                        <p className="font-title-md text-xs sm:text-sm text-on-surface">Mon – Sun, 9:00 AM – 8:00 PM IST</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campus Hubs Card */}
                <div className="bg-surface-container-lowest rounded-[24px] p-space-lg shadow-xs flex flex-col gap-space-md border border-surface-variant/60">
                  <h4 className="font-title-md text-base text-primary-container font-bold">Campuses Across Maharashtra</h4>
                  <div className="space-y-2 text-xs text-on-surface-variant">
                    {cms.centres.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl bg-surface-container-low border ${
                          c.isHeadquarter ? 'border-secondary/30' : 'border-surface-variant/50'
                        }`}
                      >
                        <p className="font-bold text-primary-container flex items-center justify-between">
                          <span>{c.name}</span>
                          <span
                            className={`text-[10px] font-label-caps px-2 py-0.5 rounded-full font-bold ${
                              c.isHeadquarter
                                ? 'bg-secondary text-white'
                                : 'bg-blue-100 text-[#0052FF]'
                            }`}
                          >
                            {c.tag || (c.isHeadquarter ? 'HQ' : 'Branch')}
                          </span>
                        </p>
                        <p className="text-[11px] mt-0.5">
                          {c.address} • {c.nextBatchDate}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Controlled Message Form */}
              <div className="lg:col-span-7">
                <div className="bg-surface-container-lowest rounded-[24px] p-space-xl sm:p-space-2xl shadow-sm border border-surface-variant/60">
                  <div className="mb-space-lg">
                    <h3 className="font-headline-sm text-xl sm:text-2xl text-primary-container font-bold">
                      Send us an Academic Message
                    </h3>
                    <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
                      Fill out the form below and our senior faculty counsellor will reach out within 2 working hours.
                    </p>
                  </div>

                  {isSubmitted ? (
                    <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center animate-fadeIn space-y-4">
                      <span className="material-symbols-outlined text-emerald-600 text-6xl">check_circle</span>
                      <div>
                        <h4 className="font-bold text-xl text-emerald-900">Thank You, {firstName}!</h4>
                        <p className="text-sm text-emerald-800 mt-1 max-w-md mx-auto">
                          Your message has been dispatched to Founder Prashant Dhumal & Senior Deans. We will call you on <strong>{phone}</strong> shortly.
                        </p>
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                          href={`https://wa.me/918459344077?text=Hi%20Prashant%20Sir%2C%20I%20am%20${firstName}%20and%20I%20submitted%20an%20inquiry.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          Connect on WhatsApp Now
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSubmitted(false);
                            setFirstName('');
                            setLastName('');
                            setEmail('');
                            setPhone('');
                            setMessage('');
                          }}
                          className="px-6 py-2.5 rounded-full bg-white text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors border border-gray-300"
                        >
                          Send Another Message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-space-md" id="contactForm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-title-md text-xs sm:text-body-sm text-on-surface font-semibold" htmlFor="firstName">
                            First Name <span className="text-error">*</span>
                          </label>
                          <input
                            className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body-md text-sm placeholder:text-on-surface-variant/50"
                            id="firstName"
                            placeholder="e.g. Rahul"
                            required
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-title-md text-xs sm:text-body-sm text-on-surface font-semibold" htmlFor="lastName">
                            Last Name <span className="text-error">*</span>
                          </label>
                          <input
                            className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body-md text-sm placeholder:text-on-surface-variant/50"
                            id="lastName"
                            placeholder="e.g. Patil"
                            required
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs sm:text-body-sm text-on-surface font-semibold" htmlFor="email">
                          Email Address
                        </label>
                        <input
                          className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface border border-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body-md text-sm placeholder:text-on-surface-variant/50"
                          id="email"
                          placeholder="e.g. rahul.patil@example.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs sm:text-body-sm text-on-surface font-semibold" htmlFor="phone">
                          Phone / WhatsApp Number <span className="text-error">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 font-body-md text-on-surface-variant select-none text-xs font-bold">+91</span>
                          <input
                            className="w-full h-12 pl-14 pr-4 rounded-xl bg-surface-container-lowest text-on-surface border border-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body-md text-sm placeholder:text-on-surface-variant/50"
                            id="phone"
                            pattern="[0-9]{10}"
                            placeholder="98765 43210"
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs sm:text-body-sm text-on-surface font-semibold" htmlFor="courseSelect">
                          Course of Interest
                        </label>
                        <div className="relative">
                          <select
                            className="w-full h-12 px-4 pr-10 rounded-xl bg-surface-container-lowest text-on-surface border border-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body-md text-sm appearance-none cursor-pointer"
                            id="courseSelect"
                            value={courseSelect}
                            onChange={(e) => setCourseSelect(e.target.value)}
                          >
                            <option value="">Select an area of interest (or choose Guidance)</option>
                            <option value="memory-science">Memory Science & Speed Study (Grade 4–10)</option>
                            <option value="vedic-maths">Vedic Maths & Speed Arithmetic</option>
                            <option value="calendar-technique">500-Year Calendar Technique</option>
                            <option value="teacher-training">Train the Trainer & Teacher Certification</option>
                            <option value="school-workshop">School / Institutional Workshop</option>
                            <option value="advisory">Need Academic Evaluation & Guidance</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
                            expand_more
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs sm:text-body-sm text-on-surface font-semibold" htmlFor="message">
                          Message or Learning Challenges
                        </label>
                        <textarea
                          className="w-full p-4 rounded-xl bg-surface-container-lowest text-on-surface border border-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body-md text-sm placeholder:text-on-surface-variant/50 resize-none"
                          id="message"
                          placeholder="Tell us about your grade, exam goals (e.g. 10th SSC, Scholarship, MPSC) or memory difficulties..."
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        ></textarea>
                      </div>

                      <div className="pt-space-xs">
                        <button
                          className="w-full h-12 rounded-full bg-secondary text-on-secondary font-title-md text-sm sm:text-base hover:bg-secondary-container transition-all shadow-md flex items-center justify-center gap-space-xs cursor-pointer font-bold active:scale-[0.99]"
                          type="submit"
                        >
                          <span>Send Academic Message</span>
                          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                      </div>

                      <div className="text-center pt-space-2xs">
                        <p className="font-body-sm text-[12px] text-on-surface-variant flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-emerald-600">lock</span>
                          Your contact details are kept strictly confidential. No spam ever.
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
