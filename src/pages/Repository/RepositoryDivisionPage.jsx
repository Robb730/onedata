import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  RepositorySectionHeader,
  SectionFolderGrid,
} from "../../components/RepositoryComponents";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";
import { canAccessDivision } from "../../utils/accessControl";

export default function RepositoryDivisionPage() {
  const navigate = useNavigate();
  const { divisionSlug } = useParams(); // this is the division id
  const { userProfile } = useUser();

  // ── Supabase state ─────────────────────────────────────────────
  const [division, setDivision] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!divisionSlug || !userProfile) return;
    console.log("divisionSlug:", divisionSlug, "userProfile:", userProfile);
    // ── Permission check happens before any data is fetched ──────
    if (!canAccessDivision(userProfile, divisionSlug)) {
      navigate(`/repository/restricted/${encodeURIComponent(divisionSlug)}`, {
        replace: true,
      });
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      // Fetch division + its sections in parallel
      const [divisionRes, sectionsRes] = await Promise.all([
        supabase
          .from("divisions")
          .select("id, name, managed_by")
          .eq("id", divisionSlug)
          .single(),
        supabase
          .from("sections")
          .select("id, name, managed_by")
          .eq("division_id", divisionSlug)
          .order("name", { ascending: true }),
      ]);

      if (divisionRes.error) {
        setError(divisionRes.error.message);
      } else {
        setDivision(divisionRes.data);
      }

      if (sectionsRes.error) {
        setError((prev) => prev || sectionsRes.error.message);
      } else {
        setSections(sectionsRes.data || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [divisionSlug, userProfile]);

  // ── Map sections → shape expected by SectionFolderGrid ────────
  const folders = sections.map((section) => ({
    id: section.id,
    name: section.name,
    owner: section.managed_by,
    route: `/repository/folder/${encodeURIComponent(section.name)}`,
  }));

  return (
    <div className="p-8 bg-linear-to-b from-slate-50 to-white min-h-screen">
      <RepositorySectionHeader
        title={loading ? "Loading…" : (division?.name ?? "Division")}
        subtitle={
          division
            ? `Browse the section folders inside ${division.name}.`
            : ""
        }
        onBack={() => navigate("/repository")}
        backLabel="Repository"
      />

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Sections
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {loading ? "—" : `${sections.length} ${sections.length === 1 ? "folder" : "folders"}`}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Managed by
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {loading ? "—" : (division?.managed_by ?? "—")}
          </p>
        </div>
      </div>

      {/* ── States: loading / error / grid ────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">
          Loading sections…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 text-sm text-red-400">
          Failed to load sections: {error}
        </div>
      ) : (
        <SectionFolderGrid
          folders={folders}
          showCreateCard
          onFolderClick={(folder) =>
            navigate(`/repository/folder/${encodeURIComponent(folder.name)}`)
          }
          onCreateSection={() => navigate("/upload-files")}
        />
      )}
    </div>
  );
}