// Adjust this import to wherever your Supabase client actually lives.
import { supabase } from "../lib/supabaseClient";

const REMINDER_LABELS = {
  "30d": "30 days before",
  "14d": "14 days before",
  "7d": "7 days before",
  "3d": "3 days before",
  "1d": "1 day before",
};

// ---------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------
function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "";
  const opts = { month: "short", year: "numeric" };
  const start = new Date(startDate).toLocaleDateString("en-US", opts);
  const end = new Date(endDate).toLocaleDateString("en-US", opts);
  return `${start} – ${end}`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function countdownParts(dateStr) {
  if (!dateStr) return { days: 0, hours: 0, minutes: 0 };
  const diffMs = Math.max(0, new Date(dateStr).getTime() - Date.now());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

// ---------------------------------------------------------------------
// Raw fetches
// ---------------------------------------------------------------------
async function fetchFileCount(label) {
  const { count, error } = await supabase
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq("school_year", label);
  if (error) throw error;
  return count ?? 0;
}

async function fetchRow(status) {
  const { data, error } = await supabase
    .from("school_years")
    .select("*")
    .eq("status", status)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchArchivedRows() {
  const { data, error } = await supabase
    .from("school_years")
    .select("*")
    .eq("status", "archived")
    .order("label", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------
// Public API — returns props already shaped for the existing components
// ---------------------------------------------------------------------

// -> props for <ActiveSchoolYearCard year={...} />
export async function getActiveYearProps() {
  const [activeRow, scheduledRow] = await Promise.all([
    fetchRow("active"),
    fetchRow("scheduled"),
  ]);
  if (!activeRow) return null;

  const totalFiles = await fetchFileCount(activeRow.label);

  return {
    id: activeRow.id,
    label: activeRow.label,
    dateRange: formatDateRange(activeRow.start_date, activeRow.end_date),
    totalFiles,
    // The active year archives exactly when the scheduled year activates
    archiveDays: scheduledRow ? daysUntil(scheduledRow.activation_date) : null,
    archiveDate: scheduledRow ? formatFullDate(scheduledRow.activation_date) : "Not scheduled",
  };
}

// -> props for <ScheduledSchoolYearCard year={...} />
export async function getScheduledYearProps() {
  const row = await fetchRow("scheduled");
  if (!row) return null;

  const [startYear, endYear] = row.label.split("-").map(Number);

  return {
    id: row.id,
    label: row.label,
    activationDate: formatFullDate(row.activation_date),
    countdown: countdownParts(row.activation_date),
    reminders: row.reminder_offsets.map((code) => REMINDER_LABELS[code] ?? code),
    // Raw values, kept separate from the display-formatted ones above so the
    // edit dialog can be pre-filled without having to re-parse formatted text.
    startYear,
    endYear,
    rawActivationDate: row.activation_date, // ISO string
    rawStartDate: row.start_date,
    rawEndDate: row.end_date,
  };
}

// -> props for <PreviousSchoolYearsTable years={...} />
export async function getPreviousYearsProps() {
  const rows = await fetchArchivedRows();

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      label: row.label,
      dateRange: formatDateRange(row.start_date, row.end_date),
      status: row.is_reopened ? "Reopened" : "Archived",
      totalFiles: await fetchFileCount(row.label),
    }))
  );
}

// -> options for the upload-modal school-year selector: active year first-class,
// plus any archived years that have been reopened. Newest label first, each
// tagged so the UI can render "Active" / "Reopened" badges.
export async function getUploadableSchoolYears() {
  const { data, error } = await supabase
    .from("school_years")
    .select("label, status, is_reopened")
    .order("label", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.status === "active" || (row.status === "archived" && row.is_reopened))
    .map((row) => ({
      label: row.label,
      tag: row.status === "active" ? "Active" : "Reopened",
    }));
}

// -> options for the school-year selector dropdown: every year on record
// (active, scheduled, and archived), newest label first, each flagged so
// the UI can show an "Archived" tag.
// -> options for the school-year selector dropdown: active + archived years
// only (scheduled years are excluded — they aren't selectable yet). Active
// year is always first so it's the default selection; archived years follow,
// newest label first.
export async function getAllSchoolYearsForSelector() {
  const { data, error } = await supabase
    .from("school_years")
    .select("label, status")
    .in("status", ["active", "archived"])
    .order("label", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).map((row) => ({
    year: row.label,
    archived: row.status === "archived",
    status: row.status,
  }));

  // Force active to the front regardless of label sort order.
  rows.sort((a, b) => {
    if (a.status === "active") return -1;
    if (b.status === "active") return 1;
    return 0; // preserve the label-desc order from the query for archived rows
  });

  return rows;
}

// Fetch everything the page needs in one go
export async function getSchoolYearPageData() {
  const [activeYear, scheduledYear, previousYears] = await Promise.all([
    getActiveYearProps(),
    getScheduledYearProps(),
    getPreviousYearsProps(),
  ]);
  return { activeYear, scheduledYear, previousYears };
}

// -> valid options for the upload flow: active year + any reopened archived years
export async function getUploadableSchoolYearLabels() {
  const { data, error } = await supabase
    .from("uploadable_school_years")
    .select("label");
  if (error) throw error;
  return (data ?? []).map((r) => r.label);
}

// ---------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------

// Called from ScheduleSchoolYearDialog's "Confirm Schedule" — always creates
// a brand new scheduled row. Do NOT use this for edits: it will collide with
// the unique constraint on `label` if a row with that label already exists
// (which it will, since you're "editing" a year that's already scheduled).
export async function scheduleSchoolYear({ label, startDate, endDate, activationDate }) {
  const { error } = await supabase.from("school_years").insert({
    label,
    start_date: startDate,
    end_date: endDate,
    activation_date: activationDate, // ISO string, e.g. combined date+time
    status: "scheduled",
  });
  if (error) throw error;
}

// Called from EditScheduledYearDialog's "Save Changes" — updates the
// existing scheduled row in place instead of inserting a new one, so
// changing the date/time (or leaving the year the same) doesn't collide
// with the unique constraint on `label`.
//
// NOTE: this only touches `label` and `activation_date`. It intentionally
// does NOT recompute `start_date`/`end_date` from startYear/endYear, since
// this file doesn't otherwise define that mapping (scheduleSchoolYear takes
// startDate/endDate directly and the dialog doesn't currently send them
// either — that looks like a pre-existing gap, not something to guess at
// here). If start_date/end_date should also change when the year changes,
// tell me how they're derived (e.g. "Aug 1 of startYear to Jun 30 of
// endYear") and I'll fold that into this function.
export async function updateScheduledSchoolYear({ id, label, activationDate }) {
  const { error } = await supabase
    .from("school_years")
    .update({
      label,
      activation_date: activationDate,
    })
    .eq("id", id)
    .eq("status", "scheduled");
  if (error) throw error;
}

// -> options for the "Upcoming School Year" dropdown in ScheduleSchoolYearDialog.
// Generates candidate labels (e.g. "2026-2027") going forward from the current
// year and filters out any label already present in school_years, so you never
// get offered a year that's already active/scheduled/archived.
export async function getUpcomingYearOptions(count = 5) {
  const { data, error } = await supabase.from("school_years").select("label");
  if (error) throw error;

  const existingLabels = new Set((data ?? []).map((r) => r.label));
  const startYear = new Date().getFullYear();

  const options = [];
  let y = startYear;
  while (options.length < count && y < startYear + count + 10) {
    const candidate = `${y}-${y + 1}`;
    if (!existingLabels.has(candidate)) {
      options.push({ value: candidate, label: candidate });
    }
    y += 1;
  }
  return options;
}

// Called from ScheduledSchoolYearCard's "Cancel Transition"
export async function cancelScheduledTransition(id) {
  const { error } = await supabase
    .from("school_years")
    .delete()
    .eq("id", id)
    .eq("status", "scheduled");
  if (error) throw error;
}

// Called from ActiveSchoolYearCard's "Force Transition"
export async function forceSchoolYearTransition() {
  const { error } = await supabase.rpc("force_school_year_transition");
  if (error) throw error;
}

// Called from PreviousSchoolYearsTable row's "Reopen" link
export async function reopenSchoolYear(id) {
  const { error } = await supabase.rpc("reopen_school_year", { p_id: id });
  if (error) throw error;
}

// Optional: close a reopened year again without waiting for a future archive
export async function closeReopenedSchoolYear(id) {
  const { error } = await supabase.rpc("close_reopened_school_year", { p_id: id });
  if (error) throw error;
}