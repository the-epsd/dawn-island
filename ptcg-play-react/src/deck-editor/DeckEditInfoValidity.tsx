import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card } from 'ptcg-server';
import { Format, SuperType } from 'ptcg-server';
import { formatOptionLabel } from './formatLabelI18n';
import { FormatValidator } from './formatValidator';
import type { DeckSlot } from './types';
import {
  isOpDeckComplete,
  mainDeckCount,
  type DonSlot,
} from './opDeckRules';
import { OP_DON_DECK_SIZE, OP_MAIN_DECK_SIZE } from './opDeckConfig';
import styles from './DeckEditInfoValidity.module.css';

export type DeckEditInfoValidityProps = {
  slots: DeckSlot[];
  allCards: Card[];
  opMode?: boolean;
  leader?: Card | null;
  donSlots?: DonSlot[];
};

export function DeckEditInfoValidity({
  slots,
  allCards,
  opMode = false,
  leader = null,
  donSlots = [],
}: DeckEditInfoValidityProps) {
  const { t } = useTranslation();
  const { total, pokemon, trainer, energy } = useMemo(() => {
    let t = 0;
    let p = 0;
    let tr = 0;
    let e = 0;
    for (const s of slots) {
      t += s.count;
      if (s.card.superType === SuperType.POKEMON) {
        p += s.count;
      } else if (s.card.superType === SuperType.TRAINER) {
        tr += s.count;
      } else if (s.card.superType === SuperType.ENERGY) {
        e += s.count;
      }
    }
    return { total: t, pokemon: p, trainer: tr, energy: e };
  }, [slots]);

  const flatCards = useMemo(() => {
    const list: Card[] = [];
    for (const s of slots) {
      for (let i = 0; i < s.count; i++) {
        list.push(s.card);
      }
    }
    return list;
  }, [slots]);

  const deferredFlat = useDeferredValue(flatCards);
  const deferredAll = useDeferredValue(allCards);

  const [validFormats, setValidFormats] = useState<Format[]>([]);

  useEffect(() => {
    if (opMode) {
      startTransition(() => setValidFormats([]));
      return;
    }
    if (deferredFlat.length === 0) {
      startTransition(() => setValidFormats([]));
      return;
    }
    startTransition(() => {
      setValidFormats(FormatValidator.getValidFormatsForCardList(deferredFlat, deferredAll));
    });
  }, [deferredFlat, deferredAll, opMode]);

  if (opMode) {
    const mainCount = mainDeckCount(slots);
    const complete = isOpDeckComplete(leader, slots, donSlots);
    return (
      <footer className={styles.bar}>
        <div className={styles.counts}>
          <span>{t('OP_DECK_VALIDITY_LEADER', { count: leader ? 1 : 0 })}</span>
          <span>{t('OP_DECK_VALIDITY_MAIN', { count: mainCount, max: OP_MAIN_DECK_SIZE })}</span>
          <span>{t('OP_DECK_VALIDITY_DON', { count: donSlots.length, max: OP_DON_DECK_SIZE })}</span>
        </div>
        <div className={styles.formats}>
          {complete ? (
            <span className={styles.chip}>{t('OP_DECK_VALIDITY_COMPLETE')}</span>
          ) : (
            <span className={styles.chipMuted}>{t('OP_DECK_VALIDITY_INCOMPLETE')}</span>
          )}
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.bar}>
      <div className={styles.counts}>
        <span>{t('DECK_VALIDITY_CARDS_TOTAL', { count: total })}</span>
        <span>{t('DECK_VALIDITY_POKEMON', { count: pokemon })}</span>
        <span>{t('DECK_VALIDITY_TRAINER', { count: trainer })}</span>
        <span>{t('DECK_VALIDITY_ENERGY', { count: energy })}</span>
      </div>
      <div className={styles.formats}>
        {flatCards.length === 0 ? (
          <span className={styles.chipMuted}>{t('DECK_VALIDITY_ADD_CARDS')}</span>
        ) : deferredFlat.length !== flatCards.length ? (
          <span className={styles.chipMuted}>{t('DECK_VALIDITY_UPDATING')}</span>
        ) : validFormats.length === 0 ? (
          <span className={styles.chipMuted}>{t('DECK_VALIDITY_NO_FORMATS')}</span>
        ) : (
          validFormats.map((f) => (
            <span key={f} className={styles.chip} title={t('DECK_EDIT_LEGAL_FOR_CARD')}>
              {formatOptionLabel(t, f)}
            </span>
          ))
        )}
      </div>
    </footer>
  );
}
