import { useState } from "react";
import { Shield, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ModalPortal from "./ModalPortal";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: `OneData is a centralized data repository and analytics platform for the Department of Education, Schools Division of City of Baliwag. This notice explains how your personal data is collected, used, and protected within the system.`,
  },
  {
    title: "2. Data We Collect",
    body: null,
    items: [
      "Account Information — Full name, email address, ID number, role, and division/section assignment provided by your administrator during account creation.",
      "Authentication Data — Login timestamps, session duration, and password change history managed through secure authentication services.",
      "File Activity — Files you upload, view, download, or delete, including file names, sizes, and modification dates.",
      "Audit Logs — Actions performed within the system (uploads, downloads, verification, access requests) are logged with your name, role, and timestamp for compliance and accountability.",
      "Notifications — System notifications sent to you for file uploads, access grants, and verification updates.",
    ],
  },
  {
    title: "3. How We Use Your Data",
    body: null,
    items: [
      "To authenticate your identity and manage your access based on your assigned role.",
      "To organize and manage files within your division and section.",
      "To maintain an audit trail of system activities for security and compliance.",
      "To generate analytics dashboards using aggregated, non-personal data.",
      "To send you notifications related to your file management activities.",
    ],
  },
  {
    title: "4. Who Can Access Your Data",
    body: null,
    items: [
      "Administrators have access to all user accounts, file repositories, and audit logs across the entire system.",
      "Division Focal Persons can manage files and view activity within their assigned division.",
      "Section Officers and Personnel can access files within their assigned section, with view and download access to other sections in their division.",
      "Access is strictly controlled through role-based access controls. Users cannot access data outside their authorized scope without explicit approval.",
    ],
  },
  {
    title: "5. Data Retention and Deletion",
    body: null,
    items: [
      "Your account is maintained for as long as your administrator keeps it active.",
      "Soft-deleted files are retained for 14 days before permanent removal.",
      "Audit logs are retained for compliance purposes.",
      "You may request account deactivation or data removal by contacting your administrator.",
    ],
  },
  {
    title: "6. Security Measures",
    body: null,
    items: [
      "All data is stored in encrypted databases with encrypted connections (TLS).",
      "Authentication is managed through secure session tokens.",
      "Role-based access controls restrict data visibility to authorized users only.",
      "Sessions automatically expire after 30 minutes of inactivity.",
    ],
  },
  {
    title: "7. Your Rights",
    body: null,
    items: [
      "You may request access to the personal data stored about you.",
      "You may request correction of inaccurate data.",
      "You may request deletion of your account and associated data through your administrator.",
      "You may withdraw your consent by requesting account deactivation.",
    ],
  },
  {
    title: "8. Contact",
    body: `For questions about this privacy notice or your personal data, contact your system administrator or the Division Head of the Schools Division of City of Baliwag.`,
  },
];

export default function DataPrivacyModal({ isOpen, onSuccess }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleAccept() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: dbError } = await supabase
        .from("users")
        .update({ accepted_data_privacy: true })
        .eq("id", user.id);

      if (dbError) throw new Error(dbError.message);

      setLoading(false);
      onSuccess();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-lg max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.22)] border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3.5 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[1.05rem] font-black text-slate-800 tracking-[-0.02em]">
                Data Privacy Notice
              </h2>
              <p className="text-[0.73rem] text-slate-400 font-medium mt-0.5">
                Please read carefully before continuing
              </p>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-[13px] font-bold text-slate-800 mb-1.5">
                  {section.title}
                </h3>
                {section.body && (
                  <p className="text-[12px] text-slate-500 leading-[1.7]">
                    {section.body}
                  </p>
                )}
                {section.items && (
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-[12px] text-slate-500 leading-[1.7]"
                      >
                        <span className="text-slate-300 mt-px shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-slate-100 px-5 sm:px-6 py-4 sm:py-5">
            <label className="flex items-start gap-3 cursor-pointer select-none mb-4">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-[18px] h-[18px] rounded-md border-2 border-slate-300 bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                  {agreed && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-[12px] text-slate-600 leading-snug font-medium">
                I have read and agree to the Data Privacy Notice
              </span>
            </label>

            {error && (
              <p className="text-[12px] text-rose-500 bg-rose-50 px-3 py-2 rounded-lg mb-3">
                {error}
              </p>
            )}

            <button
              onClick={handleAccept}
              disabled={!agreed || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "I Agree & Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
