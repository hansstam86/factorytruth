"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getCompareIds, setCompareIds, toggleCompare, COMPARE_MAX } from "@/lib/compare-factories";

type Factory = {
  id: string;
  name: string;
  address?: string;
  expertise?: string;
  createdAt: string;
};

export default function EntrepreneursPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIdsState] = useState<string[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [searchExpertise, setSearchExpertise] = useState("");

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
  const filteredFactories = factories.filter((f) => {
    const matchName = !nameLower || (f.name && f.name.toLowerCase().includes(nameLower));
    const matchAddress = !addressLower || (f.address && f.address.toLowerCase().includes(addressLower));
    const matchExpertise =
      !expertiseLower || (f.expertise && f.expertise.toLowerCase().includes(expertiseLower));
    return matchName && matchAddress && matchExpertise;
  });

  return (
    <div className={styles.listWrap}>
      <h1 className={styles.pageTitle}>Browse factories</h1>
      <p className={styles.pageDesc}>
        View audit answers submitted by factories in China. Click a factory to see full details, or select several to compare answers side by side.
      </p>

      <div className={styles.searchBar}>
        <div className={styles.searchFields}>
          <div className={styles.searchField}>
            <label htmlFor="search-name" className={styles.searchLabel}>
              Search by name
            </label>
            <input
              id="search-name"
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Factory name…"
              className={styles.searchInput}
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
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="City, region, country…"
              className={styles.searchInput}
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
              onChange={(e) => setSearchExpertise(e.target.value)}
              placeholder="Expertise, business, capability…"
              className={styles.searchInput}
              aria-label="Search by expertise"
            />
          </div>
        </div>
        {(nameLower || addressLower || expertiseLower) && (
          <p className={styles.searchSummary}>
            Showing {filteredFactories.length} of {factories.length} factories
          </p>
        )}
      </div>

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
            Try different or shorter terms for name or expertise.
          </p>
        </div>
      ) : (
        <ul className={styles.factoryList}>
          {filteredFactories.map((f) => {
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
      )}
    </div>
  );
}
