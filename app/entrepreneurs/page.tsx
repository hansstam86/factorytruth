"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { getCompareIds, setCompareIds, toggleCompare, COMPARE_MAX } from "@/lib/compare-factories";

const FREE_PREVIEW_COUNT = 25;

type Factory = {
  id: string;
  name: string;
  address?: string;
  expertise?: string;
  createdAt: string;
};

type SortOption = "name" | "date";

export default function EntrepreneursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIdsState] = useState<string[]>([]);
  const [searchName, setSearchName] = useState(() => searchParams.get("name") ?? "");
  const [searchAddress, setSearchAddress] = useState(() => searchParams.get("address") ?? "");
  const [searchExpertise, setSearchExpertise] = useState(() => searchParams.get("expertise") ?? "");
  const [sort, setSort] = useState<SortOption>(() => (searchParams.get("sort") === "date" ? "date" : "name"));
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [showSearchSignInModal, setShowSearchSignInModal] = useState(false);

  useEffect(() => {
    fetch("/api/entrepreneur-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  // Sync state from URL when user navigates (e.g. back/forward or shared link after hydration)
  useEffect(() => {
    setSearchName(searchParams.get("name") ?? "");
    setSearchAddress(searchParams.get("address") ?? "");
    setSearchExpertise(searchParams.get("expertise") ?? "");
    setSort(searchParams.get("sort") === "date" ? "date" : "name");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/factories")
      .then((res) => res.json())
      .then((data) => {
        setFactories(Array.isArray(data) ? data : []);
      })
      .catch(() => setFactories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCompareIdsState(getCompareIds());
    const onStorage = () => setCompareIdsState(getCompareIds());
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

  const nameLower = searchName.trim().toLowerCase();
  const addressLower = searchAddress.trim().toLowerCase();
  const expertiseLower = searchExpertise.trim().toLowerCase();
  const searchAllowed = !!user;
  const filtered = searchAllowed
    ? factories.filter((f) => {
        const matchName = !nameLower || (f.name && f.name.toLowerCase().includes(nameLower));
        const matchAddress = !addressLower || (f.address && f.address.toLowerCase().includes(addressLower));
        const matchExpertise =
          !expertiseLower || (f.expertise && f.expertise.toLowerCase().includes(expertiseLower));
        return matchName && matchAddress && matchExpertise;
      })
    : factories;
  const filteredFactories = [...filtered].sort((a, b) => {
    if (sort === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  // Keep URL in sync with search and sort so links are shareable (only when signed in)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (searchName.trim()) params.set("name", searchName.trim());
    if (searchAddress.trim()) params.set("address", searchAddress.trim());
    if (searchExpertise.trim()) params.set("expertise", searchExpertise.trim());
    if (sort !== "name") params.set("sort", sort);
    const q = params.toString();
    router.replace(q ? `/entrepreneurs?${q}` : "/entrepreneurs", { scroll: false });
  }, [user, searchName, searchAddress, searchExpertise, sort, router]);

  return (
    <div className={styles.listWrap}>
      <h1 className={styles.pageTitle}>Browse factories</h1>
      <p className={styles.pageDesc}>
        View audit answers submitted by factories in China. Click a factory to see full details, or select several to compare answers side by side.
      </p>

      <div className={styles.searchBar}>
        {!user && (
          <p className={styles.searchGuestHint}>
            Sign in to search by name, address, or expertise.
          </p>
        )}
        <div className={styles.searchFields}>
          <div className={styles.searchField}>
            <label htmlFor="search-name" className={styles.searchLabel}>
              Search by name
            </label>
            <input
              id="search-name"
              type="text"
              value={searchName}
              onChange={(e) => user && setSearchName(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder={user ? "Factory name…" : "Sign in to search"}
              readOnly={!user}
              className={user ? styles.searchInput : styles.searchInputLocked}
              aria-label="Search by factory name"
            />
          </div>
          <div className={styles.searchField}>
            <label htmlFor="search-address" className={styles.searchLabel}>
              Search by address
            </label>
            <input
              id="search-address"
              type="text"
              value={searchAddress}
              onChange={(e) => user && setSearchAddress(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder={user ? "City, region, country…" : "Sign in to search"}
              readOnly={!user}
              className={user ? styles.searchInput : styles.searchInputLocked}
              aria-label="Search by address"
            />
          </div>
          <div className={styles.searchField}>
            <label htmlFor="search-expertise" className={styles.searchLabel}>
              Search by expertise
            </label>
            <input
              id="search-expertise"
              type="text"
              value={searchExpertise}
              onChange={(e) => user && setSearchExpertise(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder={user ? "Expertise, business, capability…" : "Sign in to search"}
              readOnly={!user}
              className={user ? styles.searchInput : styles.searchInputLocked}
              aria-label="Search by expertise"
            />
          </div>
        </div>
        <div className={styles.searchSortRow}>
          <div className={styles.searchField}>
            <label htmlFor="sort-factories" className={styles.searchLabel}>
              Sort by
            </label>
            {user ? (
              <select
                id="sort-factories"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className={styles.sortSelect}
                aria-label="Sort factories"
              >
                <option value="name">Name (A–Z)</option>
                <option value="date">Date added (newest first)</option>
              </select>
            ) : (
              <button
                type="button"
                id="sort-factories"
                className={styles.sortSelectLocked}
                onClick={() => setShowSearchSignInModal(true)}
                aria-label="Sort factories (sign in to change)"
              >
                {sort === "date" ? "Date added (newest first)" : "Name (A–Z)"}
              </button>
            )}
          </div>
          {searchAllowed && (nameLower || addressLower || expertiseLower) && (
            <p className={styles.searchSummary}>
              Showing {filteredFactories.length} of {factories.length} factories
            </p>
          )}
        </div>
      </div>

      {showSearchSignInModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSearchSignInModal(false)} role="dialog" aria-modal="true" aria-labelledby="search-signin-title">
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 id="search-signin-title" className={styles.modalTitle}>Sign in to search</h2>
            <p className={styles.modalDesc}>
              Search by name, address, or expertise is available once you have an account. It’s free — create one or log in.
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

      {loading ? (
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
            Try different or shorter terms for name, address, or expertise.
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
            return (
              <li key={f.id} className={styles.factoryCard}>
                <div className={styles.cardRow}>
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
                    <div className={styles.cardName}>{f.name}</div>
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
