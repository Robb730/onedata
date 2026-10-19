import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import {
  AuditLogsHeader,
  AuditLogsStats,
  AuditLogsFilters,
  AuditLogsTable,
  AuditLogsFooter,
} from "../../components/AuditLogsComponents";
import { supabase } from "../../lib/supabaseClient";
import { notifyDeactivation } from "../../utils/deactivationEmail";
import { exportAuditLogsPdf } from "../../utils/exportAuditLogsPdf";
import { SkeletonCards, SkeletonTable } from "../../components/ui/Skeleton";
import { FadeSwap } from "../../components/ui/FadeIn";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const rowsPerPage = 10;

  const actions = [
    "All",
    "Upload",
    "Download",
    "Verify",
    "Create",
    "Delete",
    "Edit",
    "Role Change",
    "Access Request",
    "Access Grant",
    "Login Success",
    "Login Failed",
    "Security Alert",
  ];
  const statuses = ["All", "Success", "Failed", "Pending"];

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction, filterStatus, dateFrom, dateTo]);

  const queryClient = useQueryClient();
  const { data: auditLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("performed_on", { ascending: false })
        .limit(200);

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        action: row.action,
        fileName: row.file_name ?? "N/A",
        details: row.details ?? "",
        performedBy: row.performed_by,
        role: row.role,
        performedOn: row.performed_on,
        status: row.status,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const auditLogs = auditLogsData || [];

  useEffect(() => {
    // Optional: live updates so new uploads (and security alerts) appear
    // without a refresh
    const channel = supabase
      .channel("audit_logs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          const row = payload.new;
          queryClient.setQueryData(["auditLogs"], (prev) => [
            {
              id: row.id,
              action: row.action,
              fileName: row.file_name ?? "N/A",
              details: row.details ?? "",
              performedBy: row.performed_by,
              role: row.role,
              performedOn: row.performed_on,
              status: row.status,
            },
            ...(prev || []),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ─── Handle "Deactivate" action on a Security Alert row ───────
  // Security Alert logs store the offending account's email in
  // `performed_by`. This looks the user up by email and deactivates them,
  // then marks the alert as resolved (Success) so it stops standing out
  // as Pending.
  // ─── Handle "Review" action on a Security Alert row ───────
  // Security Alert logs store the offending account's email in
  // `performed_by`. With auto-deactivation now handling the lockout
  // itself at login time, this button is a fallback/review action:
  // it deactivates the account only if it isn't already inactive,
  // then marks the alert as reviewed so it stops standing out as Pending.
  async function handleDeactivateFromAlert(log) {
    const confirmed = window.confirm(
      `Review security alert for ${log.performedBy}? If the account is still active, it will be deactivated until an administrator reactivates it.`
    );
    if (!confirmed) return;

    const { data: userRow, error: lookupError } = await supabase
      .from("users")
      .select("id, full_name, role, is_active")
      .eq("email", log.performedBy)
      .maybeSingle();

    if (lookupError || !userRow) {
      alert(
        "Could not find a matching user account for " +
        log.performedBy +
        (lookupError ? `: ${lookupError.message}` : "."),
      );
      return;
    }

    // Only deactivate if it isn't already locked (e.g. auto-lockout already handled it)
    if (userRow.is_active) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", userRow.id);

      if (updateError) {
        alert("Error deactivating user: " + updateError.message);
        return;
      }

      await supabase.from("audit_logs").insert({
        action: "Edit",
        file_name: userRow.full_name,
        details: `Deactivated user account (${log.performedBy}) in response to a security alert.`,
        performed_by: "Administrator",
        role: userRow.role,
        status: "Success",
      });

      // Fire-and-forget: tell the user their account was deactivated.
      notifyDeactivation({
        email: log.performedBy,
        full_name: userRow.full_name,
        reason: "admin",
      });
    }

    // Mark the alert itself as reviewed
    const resolutionNote = userRow.is_active
      ? " — Account deactivated."
      : " — Reviewed (account already deactivated).";

    await supabase
      .from("audit_logs")
      .update({ status: "Success", details: `${log.details}${resolutionNote}` })
      .eq("id", log.id);

    queryClient.setQueryData(["auditLogs"], (prev) =>
      (prev || []).map((l) =>
        l.id === log.id
          ? { ...l, status: "Success", details: `${l.details}${resolutionNote}` }
          : l,
      ),
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "All" || log.action === filterAction;
    const matchesStatus = filterStatus === "All" || log.status === filterStatus;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const logDate = new Date(log.performedOn);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (logDate < from) matchesDate = false;
      }
      if (dateTo && matchesDate) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (logDate > to) matchesDate = false;
      }
    }

    return matchesSearch && matchesAction && matchesStatus && matchesDate;
  });

  // Export Logs Button: direct-download filtered PDF (no new tab / print preview).
  // Default filters → exports all rows; active filters → exports filteredLogs only.
  async function handleExport() {
    if (isExporting) return;
    if (!filteredLogs.length) {
      alert("No audit logs match the current filters.");
      return;
    }
    setIsExporting(true);
    try {
      await exportAuditLogsPdf({
        logs: filteredLogs,
        filters: { searchQuery, filterAction, filterStatus, dateFrom, dateTo },
      });
    } catch (err) {
      alert(err?.message || "Failed to export audit logs.");
    } finally {
      setIsExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const actionCounts = {
    Upload: auditLogs.filter((l) => l.action === "Upload").length,
    Download: auditLogs.filter((l) => l.action === "Download").length,
    Verify: auditLogs.filter((l) => l.action === "Verify").length,
    Other: auditLogs.filter(
      (l) => !["Upload", "Download", "Verify"].includes(l.action)
    ).length,
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        <AuditLogsHeader onExport={handleExport} isExporting={isExporting} />

        <FadeSwap
          loading={logsLoading}
          skeleton={<SkeletonCards count={4} />}
        >
          <AuditLogsStats actionCounts={actionCounts} />
        </FadeSwap>

        <AuditLogsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterAction={filterAction}
          onFilterActionChange={setFilterAction}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          actions={actions}
          statuses={statuses}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateRangeChange={(range) => {
            setDateFrom(range.startDate);
            setDateTo(range.endDate);
          }}
        />

        <FadeSwap
          loading={logsLoading}
          skeleton={<SkeletonTable rows={8} columns={6} />}
        >
          <AuditLogsTable
            logs={paginatedLogs}
            filteredCount={filteredLogs.length}
            totalCount={auditLogs.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onDeactivateFromAlert={handleDeactivateFromAlert}
          />
        </FadeSwap>

        <AuditLogsFooter
          shownCount={filteredLogs.length}
          totalCount={auditLogs.length}
        />

        {/* Mobile FAB — Export Logs */}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          aria-label={isExporting ? "Exporting logs" : "Export Logs"}
          title={isExporting ? "Exporting..." : "Export Logs"}
          className="lg:hidden fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60"
        >
          {isExporting ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} strokeWidth={2.25} />}
        </button>
      </div>
    </div>
  );
}
