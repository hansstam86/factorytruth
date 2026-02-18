"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import HowItWorks from "./how-it-works";
import { getCompareIds, setCompareIds, toggleCompare, COMPARE_MAX } from "@/lib/compare-factories";
import { getShortlistIds, toggleShortlist } from "@/lib/shortlist";

const FREE_PREVIEW_COUNT = 25;

type Factory = {
  id: string;
  name: string;
  address?: string;
  expertise?: string;
  createdAt: string;
  transparencyScore?: number;
};

type SortOption = "name" | "date" | "transparency";

function EntrepreneursBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [compareIds, setCompareIdsState] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortOption>(() => {
    const s = searchParams.get("sort");
    return s === "date" || s === "transparency" ? s : "name";
  });
  const [minTransparency, setMinTransparency] = useState<number | null>(() => {
    const v = searchParams.get("minScore");
    if (v == null || v === "") return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  });
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [showSearchSignInModal, setShowSearchSignInModal] = useState(false);
  const [shortlistIds, setShortlistIdsState] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/entrepreneur-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  // Sync state from URL when user navigates (e.g. back/forward or shared link after hydration)
  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
    const s = searchParams.get("sort");
    setSort(s === "date" || s === "transparency" ? s : "name");
    const v = searchParams.get("minScore");
    if (v == null || v === "") setMinTransparency(null);
    else {
      const n = parseInt(v, 10);
      setMinTransparency(Number.isFinite(n) && n >= 0 && n <= 100 ? n : null);
    }
  }, [searchParams]);

  const fetchFactories = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/factories")
      .then((res) => res.json())
      .then((data) => {
        setFactories(Array.isArray(data) ? data : []);
        setLoadError(null);
      })
      .catch(() => {
        setFactories([]);
        setLoadError("Failed to load factories.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  useEffect(() => {
    setCompareIdsState(getCompareIds());
    setShortlistIdsState(getShortlistIds());
    const onStorage = () => {
      setCompareIdsState(getCompareIds());
      setShortlistIdsState(getShortlistIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleToggleCompare = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = getCompareIds();
    const inList = next.includes(id);
    if (inList) {
      const updated = next.filter((x) => x !== id);
      setCompareIds(updated);
      setCompareIdsState(updated);
    } else if (next.length < COMPARE_MAX) {
      const updated = [...next, id];
      setCompareIds(updated);
      setCompareIdsState(updated);
    }
  };

  const compareUrl = compareIds.length >= 2
    ? `/entrepreneurs/compare?ids=${compareIds.join(",")}`
    : "/entrepreneurs/compare";

  const queryLower = searchQuery.trim().toLowerCase();
  const searchAllowed = !!user;
  const filtered = searchAllowed
    ? factories.filter((f) => {
        const matchQuery =
          !queryLower ||
          [f.name, f.address, f.expertise].some(
            (v) => v && String(v).toLowerCase().includes(queryLower)
          );
        const score = typeof f.transparencyScore === "number" ? f.transparencyScore : 0;
        const matchScore = minTransparency === null || score >= minTransparency;
        return matchQuery && matchScore;
      })
    : factories;
  const filteredFactories = [...filtered].sort((a, b) => {
    if (sort === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "transparency") {
      const sa = typeof a.transparencyScore === "number" ? a.transparencyScore : 0;
      const sb = typeof b.transparencyScore === "number" ? b.transparencyScore : 0;
      return sb - sa;
    }
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });
  const visibleFactories = user ? filteredFactories : filteredFactories.slice(0, FREE_PREVIEW_COUNT);
  const hasMoreForGuests = !user && filteredFactories.length > FREE_PREVIEW_COUNT;

  const handleSearchFocus = () => {
    if (!user) {
      setShowSearchSignInModal(true);
      if (typeof document !== "undefined") (document.activeElement as HTMLElement)?.blur?.();
    }
  };

  // Keep URL in sync with search, sort, and min score so links are shareable (only when signed in)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (sort !== "name") params.set("sort", sort);
    if (minTransparency !== null) params.set("minScore", String(minTransparency));
    const qs = params.toString();
    router.replace(qs ? `/entrepreneurs?${qs}` : "/entrepreneurs", { scroll: false });
  }, [user, searchQuery, sort, minTransparency, router]);

  const highTransparencyCount = factories.filter(
    (f) => (typeof f.transparencyScore === "number" ? f.transparencyScore : 0) >= 75
  ).length;
  const compareShortlistUrl =
    shortlistIds.length >= 2
      ? `/entrepreneurs/compare?ids=${shortlistIds.slice(0, 6).join(",")}`
      : "/entrepreneurs/compare";

  const applyChip = (chip: "high-transparency" | "recent") => {
    if (chip === "recent") {
      setSort("date");
      setMinTransparency(null);
      if (user) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", "date");
        params.delete("minScore");
        router.replace(`/entrepreneurs?${params.toString()}`, { scroll: false });
      }
    } else {
      setSort("transparency");
      if (user) {
        setMinTransparency(75);
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", "transparency");
        params.set("minScore", "75");
        router.replace(`/entrepreneurs?${params.toString()}`, { scroll: false });
      } else {
        setShowSearchSignInModal(true);
      }
    }
  };

  const hasActiveFilters = searchAllowed && (queryLower || minTransparency !== null);

  return (
    <div className={styles.listWrap}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Find trustworthy factories</h1>
        {!loading && factories.length > 0 && (
          <span className={styles.platformStatsInline}>
            {factories.length} factories
            {highTransparencyCount > 0 && ` · ${highTransparencyCount} with 75%+ transparency`}
          </span>
        )}
      </div>
      <p className={styles.pageIntro}>
        Browse by the same audit steps, compare answers, and shortlist or contact factories. Click a factory to see full details.
      </p>
      <HowItWorks />
      {shortlistIds.length >= 2 && (
        <div className={styles.nextStepCta}>
          <p>
            <Link href={compareShortlistUrl} className={styles.nextStepLink}>
              Compare your {shortlistIds.length} shortlisted factories →
            </Link>
          </p>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <input
            id="search-factories"
            type="text"
            value={searchQuery}
            onChange={(e) => user && setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            placeholder={user ? "Search name, address or expertise…" : "Sign in to search"}
            readOnly={!user}
            className={user ? styles.searchInputSingle : styles.searchInputLocked}
            aria-label="Search factories"
          />
        </div>
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarGroup}>
            <label htmlFor="sort-factories" className={styles.toolbarLabel}>Sort</label>
            {user ? (
              <select
                id="sort-factories"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className={styles.sortSelect}
                aria-label="Sort factories"
              >
                <option value="name">Name (A–Z)</option>
                <option value="date">Newest</option>
                <option value="transparency">Transparency</option>
              </select>
            ) : (
              <button
                type="button"
                id="sort-factories"
                className={styles.sortSelectLocked}
                onClick={() => setShowSearchSignInModal(true)}
                aria-label="Sort (sign in to change)"
              >
                {sort === "date" ? "Newest" : sort === "transparency" ? "Transparency" : "Name (A–Z)"}
              </button>
            )}
          </div>
          {user && (
            <div className={styles.toolbarGroup}>
              <label htmlFor="min-transparency" className={styles.toolbarLabel}>Min. transparency</label>
              <select
                id="min-transparency"
                value={minTransparency === null ? "" : String(minTransparency)}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinTransparency(v === "" ? null : parseInt(v, 10));
                }}
                className={styles.sortSelect}
                aria-label="Minimum transparency"
              >
                <option value="">All</option>
                <option value="25">25%+</option>
                <option value="50">50%+</option>
                <option value="75">75%+</option>
                <option value="90">90%+</option>
              </select>
            </div>
          )}
          {factories.length > 0 && (
            <div className={styles.filterChips}>
              <button type="button" className={styles.filterChip} onClick={() => applyChip("recent")} aria-label="Recently added">
                Recently added
              </button>
              <button type="button" className={styles.filterChip} onClick={() => applyChip("high-transparency")} aria-label="High transparency 75%+">
                High transparency (75%+)
              </button>
            </div>
          )}
          {hasActiveFilters && (
            <span className={styles.searchSummary}>
              {filteredFactories.length} of {factories.length}
            </span>
          )}
        </div>
      </div>
      {!user && (
        <p className={styles.searchGuestHint}>
          Sign in to search and filter. It’s free.
        </p>
      )}

      {showSearchSignInModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSearchSignInModal(false)} role="dialog" aria-modal="true" aria-labelledby="search-signin-title">
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 id="search-signin-title" className={styles.modalTitle}>Sign in to search</h2>
            <p className={styles.modalDesc}>
              Search and filter are available once you have an account. It’s free — create one or log in.
            </p>
            <div className={styles.modalActions}>
              <Link href="/entrepreneurs/login" className={styles.modalBtnPrimary}>
                Log in
              </Link>
              <Link href="/entrepreneurs/register" className={styles.modalBtnSecondary}>
                Create free account
              </Link>
              <button type="button" className={styles.modalClose} onClick={() => setShowSearchSignInModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {compareIds.length >= 2 && (
        <div className={styles.compareBar}>
          <span className={styles.compareCount}>
            {compareIds.length} factory {compareIds.length === 1 ? "selected" : "factories selected"} (max {COMPARE_MAX})
          </span>
          <Link href={compareUrl} className={styles.compareLink}>
            Compare side by side →
          </Link>
          <button
            type="button"
            className={styles.compareClear}
            onClick={() => {
              setCompareIds([]);
              setCompareIdsState([]);
            }}
          >
            Clear selection
          </button>
        </div>
      )}

      {loadError && !loading ? (
        <div className={styles.loadErrorBlock}>
          <p className={styles.loadErrorText}>{loadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => fetchFactories()}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <p className={styles.loading}>Loading factories…</p>
      ) : factories.length === 0 ? (
        <div className={styles.empty}>
          <p>No factory submissions yet.</p>
          <p className={styles.emptyHint}>
            When factories submit their audit answers via the factory portal, they will appear here.
          </p>
        </div>
      ) : filteredFactories.length === 0 ? (
        <div className={styles.empty}>
          <p>No factories match your search.</p>
          <p className={styles.emptyHint}>
            Try a different or shorter search term.
          </p>
        </div>
      ) : (
        <>
          {hasMoreForGuests && (
            <p className={styles.previewHint}>
              Showing first {FREE_PREVIEW_COUNT} of {filteredFactories.length} factories. Sign in to see all and compare.
            </p>
          )}
          <ul className={styles.factoryList}>
          {visibleFactories.map((f) => {
            const selected = compareIds.includes(f.id);
            const atMax = compareIds.length >= COMPARE_MAX && !selected;
            const inShortlist = shortlistIds.includes(f.id);
            return (
              <li key={f.id} className={styles.factoryCard}>
                <div className={styles.cardRow}>
                  <button
                    type="button"
                    className={styles.shortlistBtn}
                    title={inShortlist ? "Remove from shortlist" : "Save to shortlist"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleShortlist(f.id);
                      setShortlistIdsState(getShortlistIds());
                    }}
                    aria-pressed={inShortlist}
                  >
                    <span className={styles.shortlistIcon} aria-hidden>{inShortlist ? "★" : "☆"}</span>
                    <span className={styles.shortlistLabelText}>{inShortlist ? "Saved" : "Save"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.compareBtn}
                    disabled={atMax}
                    title={atMax ? `Maximum ${COMPARE_MAX} factories` : selected ? "Remove from comparison" : "Add to comparison"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleCompare(e, f.id);
                    }}
                    aria-pressed={selected}
                  >
                    <span className={styles.compareCheckbox} aria-hidden>
                      {selected ? "☑" : "☐"}
                    </span>
                    <span className={styles.compareLabelText}>Compare</span>
                  </button>
                  <Link href={`/entrepreneurs/factory/${f.id}`} className={styles.cardLink}>
                    <div className={styles.cardHead}>
                      <span className={styles.cardName}>{f.name}</span>
                      {typeof f.transparencyScore === "number" && (
                        <span className={styles.transparencyBadge} title="Transparency score: share more audit answers = higher score">
                          {f.transparencyScore}%
                        </span>
                      )}
                    </div>
                    {f.address && (
                      <div className={styles.cardMeta}>Address: {f.address}</div>
                    )}
                    {f.expertise && (
                      <div className={styles.cardMeta}>Expertise: {f.expertise}</div>
                    )}
                  </Link>
                </div>
              </li>
            );
          })}
          </ul>
          {hasMoreForGuests && (
            <div className={styles.loginGate}>
              <p className={styles.loginGateTitle}>Sign in to see more factories</p>
              <p className={styles.loginGateDesc}>
                It’s still free — you just need an account. Log in or sign up to browse all {filteredFactories.length} factories and use the compare tool.
              </p>
              <div className={styles.loginGateActions}>
                <Link href="/entrepreneurs/login" className={styles.loginGateBtnPrimary}>
                  Log in
                </Link>
                <Link href="/entrepreneurs/register" className={styles.loginGateBtnSecondary}>
                  Create free account
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function EntrepreneursPage() {
  return (
    <Suspense fallback={<p className={styles.loading}>Loading factories…</p>}>
      <EntrepreneursBrowseContent />
    </Suspense>
  );
}
