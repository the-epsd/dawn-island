import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card } from 'ptcg-server';
import { CardFace } from '../components/cards';
import { DECK_CARD_GAP_PX, DECK_DEFAULT_SLOT_W } from './deckCardLayout';
import { DeckBuildPane } from './DeckBuildPane';
import type { DeckSlot } from './types';
import type { DonSlot } from './opDeckRules';
import styles from './OpDeckBuildPane.module.css';

const DON_GAP_PX = DECK_CARD_GAP_PX;
const MIN_SLOT_W = 44;

export type OpDeckBuildPaneProps = {
  leader: Card | null;
  slots: DeckSlot[];
  donSlots: DonSlot[];
  getScanUrl: (card: Card) => string;
  disabled: boolean;
  deckCount: number;
  ruleMessage: string | null;
  showLibraryToggle: boolean;
  libraryHidden: boolean;
  onToggleLibrary: () => void;
  onAddCopy: (fullName: string) => void;
  onRemoveCopy: (fullName: string) => void;
  onOpenCardInfo: (card: Card) => void;
  onOpenLeaderInfo: () => void;
  onClearLeader: () => void;
  onOpenDonInfo: (index: number) => void;
  onSlotWidthChange?: (slotWidthPx: number) => void;
};

export function OpDeckBuildPane({
  leader,
  slots,
  donSlots,
  getScanUrl,
  disabled,
  deckCount,
  ruleMessage,
  showLibraryToggle,
  libraryHidden,
  onToggleLibrary,
  onAddCopy,
  onRemoveCopy,
  onOpenCardInfo,
  onOpenLeaderInfo,
  onClearLeader,
  onOpenDonInfo,
  onSlotWidthChange,
}: OpDeckBuildPaneProps) {
  const { t } = useTranslation();
  const donRowRef = useRef<HTMLDivElement | null>(null);
  const [donSlotW, setDonSlotW] = useState(DECK_DEFAULT_SLOT_W);

  const measureDonRow = useCallback(() => {
    const el = donRowRef.current;
    if (!el || donSlots.length === 0) {
      setDonSlotW(DECK_DEFAULT_SLOT_W);
      return;
    }
    const padLr = 24;
    const cw = Math.max(0, el.clientWidth - padLr);
    if (cw < 48) {
      return;
    }
    const gap = DON_GAP_PX;
    const count = donSlots.length;
    const maxByWidth = Math.floor((cw - gap * (count - 1)) / count);
    const next = Math.max(MIN_SLOT_W, Math.min(DECK_DEFAULT_SLOT_W, maxByWidth));
    setDonSlotW(next);
  }, [donSlots.length]);

  useLayoutEffect(() => {
    const el = donRowRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => {
      measureDonRow();
    });
    ro.observe(el);
    const id = requestAnimationFrame(() => {
      measureDonRow();
    });
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [measureDonRow]);

  const donGridStyle = {
    '--deck-slot-w': `${donSlotW}px`,
    '--deck-gap': `${DON_GAP_PX}px`,
  } as CSSProperties;

  return (
    <div className={styles.wrap}>
      <section className={styles.leaderSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{t('OP_DECK_LEADER')}</span>
        </div>
        <div className={styles.leaderZone}>
          {leader ? (
            <div className={styles.leaderSlot}>
              <button
                type="button"
                className={styles.leaderCardBtn}
                onClick={() => onOpenLeaderInfo()}
                aria-label={t('OP_DECK_VIEW_LEADER', { name: leader.name })}
              >
                <CardFace
                  card={leader}
                  src={getScanUrl(leader)}
                  name={leader.name}
                  loading="lazy"
                  style={{ width: `${DECK_DEFAULT_SLOT_W}px` }}
                />
              </button>
              {!disabled ? (
                <button
                  type="button"
                  className={styles.clearLeaderBtn}
                  onClick={onClearLeader}
                >
                  {t('OP_DECK_CLEAR_LEADER')}
                </button>
              ) : null}
            </div>
          ) : (
            <div className={styles.leaderEmpty}>{t('OP_DECK_LEADER_HINT')}</div>
          )}
        </div>
      </section>

      <div className={styles.mainDeckWrap}>
        <DeckBuildPane
          slots={slots}
          getScanUrl={getScanUrl}
          disabled={disabled}
          deckCount={deckCount}
          ruleMessage={null}
          showLibraryToggle={showLibraryToggle}
          libraryHidden={libraryHidden}
          onToggleLibrary={onToggleLibrary}
          onAddCopy={onAddCopy}
          onRemoveCopy={onRemoveCopy}
          onOpenCardInfo={onOpenCardInfo}
          onSlotWidthChange={onSlotWidthChange}
          deckTitle={t('OP_DECK_MAIN_COUNT', { count: deckCount })}
        />
      </div>

      <section className={styles.donSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{t('OP_DECK_DON')}</span>
          <span className={styles.sectionMeta}>{t('OP_DECK_DON_COUNT', { count: donSlots.length })}</span>
        </div>
        <div ref={donRowRef} className={styles.donRow}>
          <div className={styles.donGrid} style={donGridStyle}>
            {donSlots.map((slot, index) => (
              <button
                key={`don-${index}-${slot.card.fullName}`}
                type="button"
                className={styles.donSlotBtn}
                onClick={() => onOpenDonInfo(index)}
                disabled={disabled}
                aria-label={t('OP_DECK_DON_SLOT_ARIA', { index: index + 1, name: slot.card.name })}
              >
                <CardFace
                  card={slot.card}
                  src={getScanUrl(slot.card)}
                  name={slot.card.name}
                  loading="lazy"
                  style={{ width: 'var(--deck-slot-w)' }}
                />
              </button>
            ))}
          </div>
        </div>
        <p className={styles.donHint}>{t('OP_DECK_DON_ART_HINT')}</p>
      </section>
      {ruleMessage ? (
        <div className={styles.toastWrap}>
          <div className={styles.toast}>{ruleMessage}</div>
        </div>
      ) : null}
    </div>
  );
}
