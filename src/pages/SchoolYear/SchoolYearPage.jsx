import { useState } from "react";
import SchoolYearHeader from "../../components/SchoolYearComponents/SchoolYearHeader";
import ActiveSchoolYearCard from "../../components/SchoolYearComponents/ActiveSchoolYearCard";
import ScheduledSchoolYearCard from "../../components/SchoolYearComponents/ScheduledSchoolYearCard";
import TransitionReadinessCard from "../../components/SchoolYearComponents/TransitionReadinessCard";
import PreviousSchoolYearsTable from "../../components/SchoolYearComponents/PreviousSchoolYearsTable";
import ScheduleSchoolYearDialog from "../../components/SchoolYearComponents/ScheduleSchoolYearDialog";

export default function SchoolYearPage({
  activeYear = null,
  scheduledYear = null,
  transitionReadiness = 0,
  previousYears = []
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 py-8">

        {/* Header */}
        <SchoolYearHeader onSchedule={() => setDialogOpen(true)} />

        {/* Top Two Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ActiveSchoolYearCard year={activeYear} />
          <ScheduledSchoolYearCard year={scheduledYear} />
        </div>

        {/* Transition Readiness */}
        <TransitionReadinessCard progress={transitionReadiness} />

        {/* Previous School Years */}
        <PreviousSchoolYearsTable years={previousYears} />

        {/* Modal */}
        <ScheduleSchoolYearDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </div>
  );
}
