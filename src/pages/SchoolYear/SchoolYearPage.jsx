import { useState, useEffect, useCallback } from "react";
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
    await scheduleSchoolYear(formValues);
    closeCreateDialog();
    await loadData();
  };

  const handleEditSubmit = async (formValues) => {
    // Updates the existing scheduled row in place (by id) instead of
    // inserting a new one — using scheduleSchoolYear here caused a duplicate
    // key error on `label` since the row being edited already has it.
    await updateScheduledSchoolYear(formValues);
    closeEditDialog();
    await loadData();
  };

  const handleCancelTransition = async () => {
    if (!scheduledYear) return;
    await cancelScheduledTransition(scheduledYear.id);
    await loadData();
  };

  const handleForceTransition = async () => {
    await forceSchoolYearTransition();
    await loadData();
  };

  const handleReopen = async (yearId) => {
    await reopenSchoolYear(yearId);
    await loadData();
  };

  const handleClose = async (yearId) => {
    await closeReopenedSchoolYear(yearId);
    await loadData();
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
      </div>
    </div>
  );
}