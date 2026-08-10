import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import { CheckCircle, X as XIcon } from "lucide-react";
import SchoolYearHeader from "../../components/SchoolYearComponents/SchoolYearHeader";
import ActiveSchoolYearCard from "../../components/SchoolYearComponents/ActiveSchoolYearCard";
import ScheduledSchoolYearCard from "../../components/SchoolYearComponents/ScheduledSchoolYearCard";
import TransitionReadinessCard from "../../components/SchoolYearComponents/TransitionReadinessCard";
import PreviousSchoolYearsTable from "../../components/SchoolYearComponents/PreviousSchoolYearsTable";
import ScheduleSchoolYearDialog from "../../components/SchoolYearComponents/ScheduleSchoolYearDialog";
import EditScheduledYearDialog from "../../components/SchoolYearComponents/EditScheduledYearDialog";
import {
  getSchoolYearPageData,
  getUpcomingYearOptions,
  scheduleSchoolYear,
  updateScheduledSchoolYear,
  cancelScheduledTransition,
  forceSchoolYearTransition,
  reopenSchoolYear,
  closeReopenedSchoolYear,
} from "../../utils/schoolYearsApi";

export default function SchoolYearPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeYear, setActiveYear] = useState(null);
  const [scheduledYear, setScheduledYear] = useState(null);
  const [previousYears, setPreviousYears] = useState([]);
  const [upcomingYearOptions, setUpcomingYearOptions] = useState([]);
  const { userProfile } = useUser();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const roleDisplayMap = {
    administrator: "Administrator",
    division_focal: "Division Officer",
    section_focal: "Section Focal Officer",
    section_personnel: "Section Personnel",
  };

  function showSuccessToast(message) {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }

  async function logAuditEvent({ action, fileName, details, role, status = "Success" }) {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      file_name: fileName,
      details,
      performed_by: userProfile?.full_name ?? "System",
      role: roleDisplayMap[userProfile?.role] ?? userProfile?.role ?? "Unknown",
      status,
    });
    if (error) console.error("Audit log insert failed:", error.message);
  }

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [data, options] = await Promise.all([
        getSchoolYearPageData(),
        getUpcomingYearOptions(),
      ]);
      setActiveYear(data.activeYear);
      setScheduledYear(data.scheduledYear);
      setPreviousYears(data.previousYears);
      setUpcomingYearOptions(options);
    } catch (err) {
      setError(err.message ?? "Failed to load school year data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const openEditDialog = (year) => {
    setEditingYear(year);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingYear(null);
  };

  const handleCreate = async (formValues) => {
    try {
      await scheduleSchoolYear(formValues);
      closeCreateDialog();
      await loadData();
      showSuccessToast(`School year "${formValues.label}" scheduled successfully.`);
      await logAuditEvent({
        action: "Other",
        fileName: formValues.label,
        details: `Scheduled new school year "${formValues.label}" (activates ${formValues.activationDate})`,
        role: userProfile?.role,
        status: "Success",
      });
    } catch (err) {
      await logAuditEvent({
        action: "Other",
        fileName: formValues.label,
        details: `Failed to schedule school year "${formValues.label}": ${err.message}`,
        role: userProfile?.role,
        status: "Failed",
      });
      throw err;
    }
  };

  const handleEditSubmit = async (formValues) => {
    try {
      await updateScheduledSchoolYear(formValues);
      closeEditDialog();
      await loadData();
      showSuccessToast(`School year "${formValues.label}" updated successfully.`);
      await logAuditEvent({
        action: "Other",
        fileName: formValues.label,
        details: `Edited scheduled school year "${formValues.label}" (activates ${formValues.activationDate})`,
        role: userProfile?.role,
        status: "Success",
      });
    } catch (err) {
      await logAuditEvent({
        action: "Other",
        fileName: formValues.label,
        details: `Failed to edit scheduled school year "${formValues.label}": ${err.message}`,
        role: userProfile?.role,
        status: "Failed",
      });
      throw err;
    }
  };

  const handleCancelTransition = async () => {
    if (!scheduledYear) return;
    try {
      await cancelScheduledTransition(scheduledYear.id);
      await loadData();
      showSuccessToast(`Scheduled transition for "${scheduledYear.label}" cancelled.`);
      await logAuditEvent({
        action: "Other",
        fileName: scheduledYear.label,
        details: `Cancelled scheduled transition for "${scheduledYear.label}"`,
        role: userProfile?.role,
        status: "Success",
      });
    } catch (err) {
      await logAuditEvent({
        action: "Other",
        fileName: scheduledYear.label,
        details: `Failed to cancel scheduled transition for "${scheduledYear.label}": ${err.message}`,
        role: userProfile?.role,
        status: "Failed",
      });
      throw err;
    }
  };

  const handleForceTransition = async () => {
    try {
      await forceSchoolYearTransition();
      await loadData();
      showSuccessToast("School year transition forced successfully.");
      await logAuditEvent({
        action: "Other",
        fileName: activeYear?.label ?? "School Year",
        details: `Forced school year transition${activeYear?.label ? ` from "${activeYear.label}"` : ""}`,
        role: userProfile?.role,
        status: "Success",
      });
    } catch (err) {
      await logAuditEvent({
        action: "Other",
        fileName: activeYear?.label ?? "School Year",
        details: `Failed to force school year transition: ${err.message}`,
        role: userProfile?.role,
        status: "Failed",
      });
      throw err;
    }
  };

  const handleReopen = async (yearId) => {
    const year = previousYears.find((y) => y.id === yearId);
    try {
      await reopenSchoolYear(yearId);
      await loadData();
      showSuccessToast(`School year "${year?.label ?? yearId}" reopened successfully.`);
      await logAuditEvent({
        action: "Other",
        fileName: year?.label ?? String(yearId),
        details: `Reopened archived school year "${year?.label ?? yearId}"`,
        role: userProfile?.role,
        status: "Success",
      });
    } catch (err) {
      await logAuditEvent({
        action: "Other",
        fileName: year?.label ?? String(yearId),
        details: `Failed to reopen school year "${year?.label ?? yearId}": ${err.message}`,
        role: userProfile?.role,
        status: "Failed",
      });
      throw err;
    }
  };

  const handleClose = async (yearId) => {
    const year = previousYears.find((y) => y.id === yearId);
    try {
      await closeReopenedSchoolYear(yearId);
      await loadData();
      showSuccessToast(`School year "${year?.label ?? yearId}" closed successfully.`);
      await logAuditEvent({
        action: "Other",
        fileName: year?.label ?? String(yearId),
        details: `Closed reopened school year "${year?.label ?? yearId}"`,
        role: userProfile?.role,
        status: "Success",
      });
    } catch (err) {
      await logAuditEvent({
        action: "Other",
        fileName: year?.label ?? String(yearId),
        details: `Failed to close reopened school year "${year?.label ?? yearId}": ${err.message}`,
        role: userProfile?.role,
        status: "Failed",
      });
      throw err;
    }
  };

  // Readiness is a placeholder until you define what "ready" means
  // (e.g. required inventories uploaded, seat counts finalized, etc).
  const transitionReadiness = scheduledYear ? 60 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <p className="text-sm font-medium text-slate-400">Loading school year data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 py-8">
        <SchoolYearHeader onSchedule={openCreateDialog} />

        {error && (
          <div className="mb-5 rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-[0.82rem] text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ActiveSchoolYearCard year={activeYear} onForceTransition={handleForceTransition} />
          <ScheduledSchoolYearCard
            year={scheduledYear}
            onCancel={handleCancelTransition}
            onEdit={openEditDialog}
          />
        </div>



        <PreviousSchoolYearsTable
          years={previousYears}
          onReopen={handleReopen}
          onClose={handleClose}
        />

        <ScheduleSchoolYearDialog
          open={createDialogOpen}
          onClose={closeCreateDialog}
          onSubmit={handleCreate}
          upcomingYearOptions={upcomingYearOptions}
        />

        <EditScheduledYearDialog
          open={editDialogOpen}
          onClose={closeEditDialog}
          onSubmit={handleEditSubmit}
          year={editingYear}
        />

        {/* Success Toast */}
        <div
          className={`fixed bottom-8 right-8 z-50 flex flex-col bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${showToast
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "translate-x-[120%] opacity-0 pointer-events-none"
            }`}
          style={{
            width: "380px",
            minHeight: "76px",
            borderRadius: "16px",
            boxShadow: showToast
              ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
              : "0 12px 30px rgba(0,0,0,0)",
            fontFamily: "Poppins, sans-serif",
            border: "1px solid rgba(241, 245, 249, 1)",
          }}
        >
          <div className="absolute top-0 left-0 bottom-0 w-32 pointer-events-none bg-gradient-to-r from-emerald-100/60 to-transparent" />
          <div
            className="flex items-center relative z-10 py-4 flex-1"
            style={{ padding: "0 20px", gap: "16px", minHeight: "76px" }}
          >
            <div
              className="flex items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.03)]"
              style={{ width: "42px", height: "42px" }}
            >
              <CheckCircle size={22} className="text-emerald-500" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center flex-1">
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2, margin: 0 }}>
                Success
              </p>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#64748B", marginTop: "3px", margin: 0 }}>
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
              aria-label="Close notification"
            >
              <XIcon size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}