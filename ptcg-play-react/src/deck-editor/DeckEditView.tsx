import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Archetype, Card } from 'ptcg-server';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { ApiError } from '../api/apiError';
import { deleteDeck, getDeck, saveDeck } from '../api/deckApi';
import { useDeckCardScanUrl } from '../context/CardImagesContext';
import { DeckBuildPane } from './DeckBuildPane';
import { OpDeckBuildPane } from './OpDeckBuildPane';
import { DeckEditInfoValidity } from './DeckEditInfoValidity';
import { DeckEditToolbar } from './DeckEditToolbar';
import { DeckLibraryPane } from './DeckLibraryPane';
import { CardInfoPopup } from '../card-info/CardInfoPopup';
import { readFavoriteCards } from '../card-info/favoriteCardsStorage';
import {
  addCardToDeck,
  canAddOne,
  flatNamesFromSlots,
  removeOneCopy,
  reorderSlots,
  replaceSlotCard,
  slotsFromFlatNames,
} from './deckRules';
import { clipboardImportFromText, formatPtcgoImportFailures } from './clipboardDeckImport';
import { deckListExportAngularCountedLines } from './deckListExportText';
import { sortLibraryCatalog } from './filterLibrary';
import { useIncrementalFilteredLibrary } from './useIncrementalFilteredLibrary';
import { DECK_DEFAULT_SLOT_W } from './deckCardLayout';
import { defaultToolbarFilter, type DeckEditToolbarFilter, type DeckSlot } from './types';
import {
  addCardToOpMainDeck,
  canAddOneOpMain,
  canSetLeader,
  donSlotsFromFlatNames,
  ensureDonSlots,
  filterOpCatalog,
  flatNamesForOpSave,
  isOpLeaderCard,
  isOpMainDeckCard,
  mainDeckFlatNames,
  replaceDonSlotCard,
  resolveLeaderFromDeck,
  type DonSlot,
} from './opDeckRules';
import styles from './DeckEditView.module.css';

const LS_DEFAULT_DECK_ID = 'defaultDeckId';
const LS_FORMAT_DEFAULTS = 'formatDefaultDecks';

function clearStoredDeckDefaults(deletedId: number): void {
  const def = localStorage.getItem(LS_DEFAULT_DECK_ID);
  if (def !== null && parseInt(def, 10) === deletedId) {
    localStorage.removeItem(LS_DEFAULT_DECK_ID);
  }
  try {
    const raw = localStorage.getItem(LS_FORMAT_DEFAULTS);
    if (!raw) {
      return;
    }
    const o = JSON.parse(raw) as Record<string, number>;
    const next = { ...o };
    let changed = false;
    for (const k of Object.keys(next)) {
      if (next[k] === deletedId) {
        delete next[k];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(LS_FORMAT_DEFAULTS, JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }
}

function useNarrowLayout(breakpointPx: number): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${breakpointPx}px)`).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [breakpointPx]);

  return narrow;
}

export type DeckEditViewProps = {
  deckId: number;
};

export function DeckEditView({ deckId }: DeckEditViewProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const clipboardFromNavConsumed = useRef(false);
  const { cardsInfo, serverConfig, user } = useAuth();
  const { hiddenFormats } = useSettings();
  const isNarrow = useNarrowLayout(899);
  const [mobileTab, setMobileTab] = useState<'library' | 'deck'>('deck');
  const [libraryHidden, setLibraryHidden] = useState(false);

  const [deckName, setDeckName] = useState('');
  const [slots, setSlots] = useState<DeckSlot[]>([]);
  const [deckLinesFromServer, setDeckLinesFromServer] = useState<string[] | null>(null);
  /** Kept in sync with last load; forwarded on save so the API does not clear these fields. */
  const [manualArchetype1, setManualArchetype1] = useState<Archetype | undefined>(undefined);
  const [manualArchetype2, setManualArchetype2] = useState<Archetype | undefined>(undefined);
  const [deckArtworks, setDeckArtworks] = useState<{ code: string; artworkId?: number }[] | undefined>(undefined);
  const [sleeveIdentifier, setSleeveIdentifier] = useState<string | undefined>(undefined);
  const [importUnknown, setImportUnknown] = useState<string[]>([]);
  const [filter, setFilter] = useState<DeckEditToolbarFilter>(() => defaultToolbarFilter());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ruleMessage, setRuleMessage] = useState<string | null>(null);
  const [cardInfoCard, setCardInfoCard] = useState<Card | null>(null);
  const [cardInfoDonIndex, setCardInfoDonIndex] = useState<number | null>(null);
  const [leader, setLeader] = useState<Card | null>(null);
  const [donSlots, setDonSlots] = useState<DonSlot[]>([]);
  const [deckCardSlotW, setDeckCardSlotW] = useState(DECK_DEFAULT_SLOT_W);

  const opMode = true;

  const isThemeDeck = deckId < 0;
  const disabled = isThemeDeck || loading;
  const isAdmin = user?.roleId === 4;

  const allCards = useMemo(
    () => sortLibraryCatalog(filterOpCatalog(cardsInfo?.cards ?? [])),
    [cardsInfo?.cards],
  );
  const byFullName = useMemo(() => {
    const m = new Map<string, Card>();
    for (const c of allCards) {
      m.set(c.fullName, c);
    }
    return m;
  }, [allCards]);

  const cardsCatalogHash = cardsInfo?.hash ?? '';

  const {
    cards: filteredLibrary,
    done: libraryScanComplete,
    requestScrollBoost,
  } = useIncrementalFilteredLibrary(allCards, filter);

  const getScanUrl = useDeckCardScanUrl(serverConfig?.scansUrl);

  const librarySource = useMemo(
    () => filteredLibrary.filter((card) => isOpMainDeckCard(card) || isOpLeaderCard(card)),
    [filteredLibrary],
  );

  const saveDeckWithFlatCards = useCallback(
    async (flatNames: string[], leaderFullName?: string) => {
      await saveDeck(
        deckId,
        deckName.trim(),
        flatNames,
        leaderFullName as Archetype | undefined,
        manualArchetype2,
        deckArtworks,
        sleeveIdentifier,
      );
    },
    [deckId, deckName, manualArchetype2, deckArtworks, sleeveIdentifier],
  );

  useEffect(() => {
    if (!Number.isFinite(deckId)) {
      setLoading(false);
      setError(t('REACT_INVALID_DECK'));
      return;
    }
    setDeckLinesFromServer(null);
    setSlots([]);
    setLeader(null);
    setDonSlots([]);
    setImportUnknown([]);
    setManualArchetype1(undefined);
    setManualArchetype2(undefined);
    setDeckArtworks(undefined);
    setSleeveIdentifier(undefined);
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDeck(deckId);
        const d = res.deck;
        setDeckName(d.name);
        const lines = (d.cards ?? []).filter(Boolean);
        setDeckLinesFromServer(lines);
        setManualArchetype1(d.manualArchetype1 || undefined);
        setManualArchetype2(d.manualArchetype2 || undefined);
        setDeckArtworks(d.artworks);
        setSleeveIdentifier(d.sleeveIdentifier);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : t('REACT_ERROR_LOAD_SINGLE_DECK'));
        setDeckLinesFromServer(null);
        setSlots([]);
        setImportUnknown([]);
        setManualArchetype1(undefined);
        setManualArchetype2(undefined);
        setDeckArtworks(undefined);
        setSleeveIdentifier(undefined);
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId, t]);

  useEffect(() => {
    if (deckLinesFromServer === null) {
      return;
    }
    if (!cardsCatalogHash || byFullName.size === 0) {
      return;
    }
    const mainNames = opMode
      ? mainDeckFlatNames(deckLinesFromServer, byFullName)
      : deckLinesFromServer;
    const { slots: next, unknown } = slotsFromFlatNames(mainNames, byFullName);
    setSlots(next);
    if (opMode) {
      setLeader(resolveLeaderFromDeck(manualArchetype1, byFullName));
      setDonSlots(ensureDonSlots(donSlotsFromFlatNames(deckLinesFromServer, byFullName), byFullName));
    }
    setImportUnknown(unknown);
  }, [deckLinesFromServer, cardsCatalogHash, byFullName, manualArchetype1, opMode]);

  useEffect(() => {
    clipboardFromNavConsumed.current = false;
  }, [deckId]);

  useEffect(() => {
    const raw = (location.state as { importFromClipboard?: string } | null)?.importFromClipboard;
    if (raw == null || typeof raw !== 'string') {
      return;
    }
    if (loading || disabled) {
      return;
    }
    if (!cardsCatalogHash || byFullName.size === 0) {
      return;
    }
    if (clipboardFromNavConsumed.current) {
      return;
    }
    clipboardFromNavConsumed.current = true;
    const imp = clipboardImportFromText(raw, allCards, byFullName, readFavoriteCards());
    const { slots: next, unknown: u2 } = slotsFromFlatNames(imp.flatFullNames, byFullName);
    const failureFmt = formatPtcgoImportFailures(imp.ptcgoFailureCounts);
    const unknownAll = [...failureFmt, ...imp.fallbackUnknown, ...u2];
    setSlots(next);
    setImportUnknown(unknownAll);
    setRuleMessage(
      unknownAll.length ? t('DECK_IMPORT_SKIP_UNKNOWN', { count: unknownAll.length }) : t('DECK_IMPORT_APPLIED_CLIPBOARD'),
    );
    window.setTimeout(() => setRuleMessage(null), 3200);
    navigate(location.pathname, { replace: true, state: {} });

    if (!isThemeDeck) {
      void (async () => {
        try {
          await saveDeckWithFlatCards(flatNamesFromSlots(next));
        } catch (e) {
          setError(e instanceof ApiError ? e.message : t('REACT_ERROR_SAVE_DECK'));
        }
      })();
    }
  }, [
    location.pathname,
    location.state,
    loading,
    disabled,
    cardsCatalogHash,
    byFullName,
    allCards,
    deckId,
    deckName,
    isThemeDeck,
    navigate,
    saveDeckWithFlatCards,
    t,
  ]);

  useEffect(() => {
    if (!opMode) {
      return;
    }
    setFilter((f) => (f.selectedSet === 'OP01' ? f : { ...f, selectedSet: 'OP01' }));
  }, [opMode]);

  useEffect(() => {
    setFilter((f) => {
      const nextFormats = f.formats.filter((fmt) => !hiddenFormats.includes(fmt));
      if (nextFormats.length === f.formats.length) {
        return f;
      }
      return { ...f, formats: nextFormats };
    });
  }, [hiddenFormats]);

  const deckCount = useMemo(() => slots.reduce((s, x) => s + x.count, 0), [slots]);

  const inDeckCounts = useMemo(() => new Map(slots.map((s) => [s.card.fullName, s.count])), [slots]);

  const canAddCard = useCallback(
    (card: Card) => {
      if (opMode && isOpLeaderCard(card)) {
        return canSetLeader(card).ok;
      }
      if (opMode) {
        return canAddOneOpMain(slots, card).ok;
      }
      return canAddOne(slots, card).ok;
    },
    [opMode, slots],
  );

  const tryAdd = useCallback(
    (card: Card) => {
      if (opMode && isOpLeaderCard(card)) {
        const gate = canSetLeader(card);
        if (!gate.ok) {
          setRuleMessage(gate.reason);
          window.setTimeout(() => setRuleMessage(null), 3200);
          return;
        }
        setRuleMessage(null);
        setLeader(card);
        return;
      }
      const res = opMode ? addCardToOpMainDeck(slots, card) : addCardToDeck(slots, card);
      if (!res.ok) {
        setRuleMessage(res.reason);
        window.setTimeout(() => setRuleMessage(null), 3200);
        return;
      }
      setRuleMessage(null);
      setSlots(res.slots);
    },
    [opMode, slots],
  );

  const tryAddByFullName = useCallback(
    (fullName: string) => {
      const card = byFullName.get(fullName);
      if (card) {
        tryAdd(card);
      }
    },
    [byFullName, tryAdd],
  );

  const onSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const flatNames = opMode
        ? flatNamesForOpSave(slots, donSlots)
        : flatNamesFromSlots(slots);
      await saveDeckWithFlatCards(flatNames, leader?.fullName);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('REACT_ERROR_SAVE_DECK'));
    } finally {
      setSaving(false);
    }
  }, [opMode, slots, donSlots, leader, saveDeckWithFlatCards, t]);

  const onDeleteDeck = useCallback(async () => {
    if (!window.confirm(t('DECK_DELETE_SELECTED'))) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteDeck(deckId);
      clearStoredDeckDefaults(deckId);
      navigate('/deck');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('REACT_ERROR_DELETE_DECK'));
    } finally {
      setDeleting(false);
    }
  }, [deckId, navigate, t]);

  const onExport = useCallback(() => {
    const text = deckListExportAngularCountedLines(slots);
    void navigator.clipboard.writeText(text);
    setRuleMessage(t('DECK_EXPORTED_TO_CLIPBOARD'));
    window.setTimeout(() => setRuleMessage(null), 2400);
  }, [slots, t]);

  const onImport = useCallback(() => {
    void navigator.clipboard
      .readText()
      .then((text) => {
        const imp = clipboardImportFromText(text, allCards, byFullName, readFavoriteCards());
        const { slots: next, unknown: u2 } = slotsFromFlatNames(imp.flatFullNames, byFullName);
        const failureFmt = formatPtcgoImportFailures(imp.ptcgoFailureCounts);
        const unknownAll = [...failureFmt, ...imp.fallbackUnknown, ...u2];
        setSlots(next);
        setImportUnknown(unknownAll);
        setRuleMessage(
          unknownAll.length
            ? t('DECK_IMPORT_SKIP_UNKNOWN', { count: unknownAll.length })
            : t('DECK_IMPORT_APPLIED_CLIPBOARD'),
        );
        window.setTimeout(() => setRuleMessage(null), 3200);
      })
      .catch(() => {
        setRuleMessage(t('ERROR_CLIPBOARD_ACCESS'));
        window.setTimeout(() => setRuleMessage(null), 3200);
      });
  }, [allCards, byFullName, t]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const deckIds = useMemo(() => slots.map((s) => s.card.fullName), [slots]);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) {
        return;
      }
      const a = active.data.current as { source?: string; card?: Card } | undefined;
      if (a?.source === 'deck') {
        const aid = String(active.id);
        const oid = String(over.id);
        if (aid === oid) {
          return;
        }
        if (deckIds.includes(aid) && deckIds.includes(oid)) {
          setSlots((prev) => reorderSlots(prev, aid, oid));
        }
      }
    },
    [deckIds],
  );

  if (!Number.isFinite(deckId)) {
    return <p>Invalid deck</p>;
  }

  if (loading) {
    return <p style={{ padding: 20 }}>Loading deck…</p>;
  }

  const libraryPane = (
    <DeckLibraryPane
      cardSlotW={deckCardSlotW}
      cards={opMode ? librarySource : filteredLibrary}
      scanComplete={libraryScanComplete}
      onNearCatalogEnd={requestScrollBoost}
      getScanUrl={getScanUrl}
      showTypeBadge={isAdmin && filter.showLibraryCardTypeBadge}
      disabled={disabled}
      onAddCard={tryAdd}
      onRemoveOneFromDeck={(fullName) => setSlots((prev) => removeOneCopy(prev, fullName))}
      inDeckCounts={inDeckCounts}
      canAddCard={canAddCard}
      onOpenCardInfo={(c) => {
        setCardInfoDonIndex(null);
        setCardInfoCard(c);
      }}
    />
  );

  const deckPane = opMode ? (
    <OpDeckBuildPane
      leader={leader}
      slots={slots}
      donSlots={donSlots}
      getScanUrl={getScanUrl}
      disabled={disabled}
      deckCount={deckCount}
      ruleMessage={ruleMessage}
      showLibraryToggle={!isNarrow}
      libraryHidden={libraryHidden}
      onToggleLibrary={() => setLibraryHidden((v) => !v)}
      onAddCopy={tryAddByFullName}
      onRemoveCopy={(fullName) => setSlots((prev) => removeOneCopy(prev, fullName))}
      onOpenCardInfo={(c) => {
        setCardInfoDonIndex(null);
        setCardInfoCard(c);
      }}
      onOpenLeaderInfo={() => {
        if (leader) {
          setCardInfoDonIndex(null);
          setCardInfoCard(leader);
        }
      }}
      onClearLeader={() => setLeader(null)}
      onOpenDonInfo={(index) => {
        const slot = donSlots[index];
        if (slot) {
          setCardInfoDonIndex(index);
          setCardInfoCard(slot.card);
        }
      }}
      onSlotWidthChange={setDeckCardSlotW}
    />
  ) : (
    <DeckBuildPane
      slots={slots}
      getScanUrl={getScanUrl}
      disabled={disabled}
      deckCount={deckCount}
      ruleMessage={ruleMessage}
      showLibraryToggle={!isNarrow}
      libraryHidden={libraryHidden}
      onToggleLibrary={() => setLibraryHidden((v) => !v)}
      onAddCopy={tryAddByFullName}
      onRemoveCopy={(fullName) => setSlots((prev) => removeOneCopy(prev, fullName))}
      onOpenCardInfo={(c) => setCardInfoCard(c)}
      onSlotWidthChange={setDeckCardSlotW}
    />
  );

  return (
    <div className={styles.noSelectWrap}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className={styles.shell}>
          <DeckEditToolbar
            deckName={deckName}
            filter={filter}
            onFilterChange={setFilter}
            allCards={allCards}
            disabled={disabled}
            isAdmin={isAdmin}
            saving={saving}
            onSave={() => void onSave()}
            onExport={onExport}
            onImport={onImport}
            onDelete={isThemeDeck ? undefined : () => void onDeleteDeck()}
            deleting={deleting}
            opMode={opMode}
          />
          {isThemeDeck && (
            <div className={styles.warnBanner}>{t('DECK_EDIT_THEME_READONLY')}</div>
          )}
          {error && <div className={styles.errorBanner}>{error}</div>}
          {!error &&
            !loading &&
            deckLinesFromServer !== null &&
            (!cardsCatalogHash || byFullName.size === 0) && (
              <div className={styles.warnBanner}>{t('DECK_EDIT_WAITING_CATALOG')}</div>
            )}
          {importUnknown.length > 0 && (
            <div className={styles.warnBanner}>
              {t('DECK_EDIT_UNKNOWN_ENTRIES', {
                count: importUnknown.length,
                preview: `${importUnknown.slice(0, 8).join('; ')}${importUnknown.length > 8 ? '…' : ''}`,
              })}
            </div>
          )}
          <div className={styles.panes}>
            {isNarrow && (
              <div className={styles.mobileTabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${mobileTab === 'library' ? styles.tabActive : ''}`}
                  onClick={() => setMobileTab('library')}
                >
                  {t('LIBRARY_TITLE')}
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${mobileTab === 'deck' ? styles.tabActive : ''}`}
                  onClick={() => setMobileTab('deck')}
                >
                  {t('DECK_EDIT_TAB_DECK')}
                </button>
              </div>
            )}
            <div
              className={`${styles.libraryCol} ${libraryHidden && !isNarrow ? styles.libraryColHidden : ''} ${isNarrow && mobileTab !== 'library' ? styles.paneMobileInactive : ''
                }`}
            >
              {libraryPane}
            </div>
            <div
              className={`${styles.deckCol} ${isNarrow && mobileTab !== 'deck' ? styles.paneMobileInactive : ''
                }`}
            >
              {deckPane}
            </div>
          </div>
          <DeckEditInfoValidity
            slots={slots}
            allCards={allCards}
            opMode={opMode}
            leader={leader}
            donSlots={donSlots}
          />
        </div>
        {cardInfoCard && (
          <CardInfoPopup
            card={cardInfoCard}
            catalog={allCards}
            getScanUrl={getScanUrl}
            isInGame={false}
            onClose={() => {
              setCardInfoCard(null);
              setCardInfoDonIndex(null);
            }}
            onCardSwap={({ originalCard, replacementCard }) => {
              if (cardInfoDonIndex !== null) {
                setDonSlots((prev) => replaceDonSlotCard(prev, cardInfoDonIndex, replacementCard));
                setCardInfoCard(replacementCard);
                return;
              }
              if (isOpLeaderCard(originalCard)) {
                setLeader(replacementCard);
                setCardInfoCard(replacementCard);
                return;
              }
              setSlots((prev) => replaceSlotCard(prev, originalCard.fullName, replacementCard));
              setCardInfoCard(replacementCard);
            }}
          />
        )}
      </DndContext>
    </div>
  );
}
