import { User, MindGameSession } from '../types';

export interface PhysicalSession {
  id: string;
  user_id: string;
  movement_id: string;
  duration: number;
  completed_at: string;
}

export interface WellnessMetrics {
  cognitiveFatigueScore: number;
  cognitiveFatigueLabel: 'Low' | 'Mid' | 'High';
  homeostasisLabel: 'Stable' | 'Loading' | 'Stressed';
  ergonomicRiskScore: number;
  ergonomicRiskLabel: 'Low' | 'Mid' | 'High';
  ergonomicRiskMessageKey: 'ergonomicRiskLow' | 'ergonomicRiskMid' | 'ergonomicRiskHigh';
}

/**
 * Calculates wellness metrics based on actual history logs and current user profile stats.
 * Assumes English/Spanish translations map the resulting string keys.
 */
export function calculateWellnessMetrics(
  user: User,
  physicalHistory: PhysicalSession[],
  mentalHistory: MindGameSession[]
): WellnessMetrics {
  const now = new Date();

  // --- COGNITIVE FATIGUE CALCULATIONS ---
  let fatigueScore = 45;

  // 1. mentalClarity effect
  // scale of mentalClarity is 1 to 10 (default ~5).
  // If mentalClarity is high (e.g. 10), subtract 15. If low (e.g. 0), add 15.
  const mentalClarity = user.progress.mentalClarity;
  const clarityEffect = (mentalClarity - 5) * 3;
  fatigueScore -= clarityEffect;

  // 2. Time since last pause (physical or mental)
  let lastPauseDate: Date | null = null;

  if (physicalHistory.length > 0 && physicalHistory[0].completed_at) {
    const d = new Date(physicalHistory[0].completed_at);
    if (!isNaN(d.getTime())) {
      lastPauseDate = d;
    }
  }

  if (mentalHistory.length > 0 && mentalHistory[0].completed_at) {
    const d = new Date(mentalHistory[0].completed_at);
    if (!isNaN(d.getTime())) {
      if (!lastPauseDate || d > lastPauseDate) {
        lastPauseDate = d;
      }
    }
  }

  if (lastPauseDate) {
    const diffMs = now.getTime() - lastPauseDate.getTime();
    const diffMins = diffMs / (1000 * 60);
    if (diffMins > 45) {
      fatigueScore += 20;
    }
  } else {
    // If no history exists, we assume no pauses have been made, so fatigue rises
    fatigueScore += 20;
  }

  // 3. Recent mental games in last 2 hours (120 minutes)
  const hasRecentMental = mentalHistory.some(m => {
    if (!m.completed_at) return false;
    const d = new Date(m.completed_at);
    if (isNaN(d.getTime())) return false;
    const diffMins = (now.getTime() - d.getTime()) / (1000 * 60);
    return diffMins >= 0 && diffMins <= 120;
  });

  if (hasRecentMental) {
    fatigueScore -= 15;
  }

  // 4. Recent physical sessions in last 2 hours (120 minutes)
  const hasRecentPhysical = physicalHistory.some(p => {
    if (!p.completed_at) return false;
    const d = new Date(p.completed_at);
    if (isNaN(d.getTime())) return false;
    const diffMins = (now.getTime() - d.getTime()) / (1000 * 60);
    return diffMins >= 0 && diffMins <= 120;
  });

  if (hasRecentPhysical) {
    fatigueScore -= 15;
  }

  // Clamp cognitive fatigue between 5 and 95
  const finalFatigueScore = Math.max(5, Math.min(95, Math.round(fatigueScore)));

  // --- ERGONOMIC RISK CALCULATIONS ---
  let riskScore = 35;

  // 1. backHealth effect
  // scale of backHealth is 0 to 100.
  // If backHealth is high (100), subtract 20. If low (0), add 20.
  const backHealth = user.progress.backHealth;
  const backHealthEffect = (50 - backHealth) * 0.4;
  riskScore += backHealthEffect;

  // 2. Time since last physical exercise
  let lastPhysicalDate: Date | null = null;
  if (physicalHistory.length > 0 && physicalHistory[0].completed_at) {
    const d = new Date(physicalHistory[0].completed_at);
    if (!isNaN(d.getTime())) {
      lastPhysicalDate = d;
    }
  }

  if (lastPhysicalDate) {
    const diffMs = now.getTime() - lastPhysicalDate.getTime();
    const diffMins = diffMs / (1000 * 60);
    if (diffMins > 60) {
      riskScore += 25;
    }
  } else {
    // If no physical exercises recorded, risk rises
    riskScore += 25;
  }

  // 3. Recent physical exercise in the last 2 hours
  if (hasRecentPhysical) {
    riskScore -= 20;
  }

  // Clamp ergonomic risk between 5 and 95
  const finalRiskScore = Math.max(5, Math.min(95, Math.round(riskScore)));

  // --- LABELS & MESSAGES ---
  let cognitiveFatigueLabel: 'Low' | 'Mid' | 'High' = 'Low';
  if (finalFatigueScore > 60) {
    cognitiveFatigueLabel = 'High';
  } else if (finalFatigueScore > 40) {
    cognitiveFatigueLabel = 'Mid';
  }

  const homeostasisLabel: 'Stable' | 'Stressed' = finalFatigueScore > 60 ? 'Stressed' : 'Stable';

  let ergonomicRiskLabel: 'Low' | 'Mid' | 'High' = 'Low';
  let ergonomicRiskMessageKey: 'ergonomicRiskLow' | 'ergonomicRiskMid' | 'ergonomicRiskHigh' = 'ergonomicRiskLow';

  if (finalRiskScore > 60) {
    ergonomicRiskLabel = 'High';
    ergonomicRiskMessageKey = 'ergonomicRiskHigh';
  } else if (finalRiskScore > 40) {
    ergonomicRiskLabel = 'Mid';
    ergonomicRiskMessageKey = 'ergonomicRiskMid';
  }

  return {
    cognitiveFatigueScore: finalFatigueScore,
    cognitiveFatigueLabel,
    homeostasisLabel,
    ergonomicRiskScore: finalRiskScore,
    ergonomicRiskLabel,
    ergonomicRiskMessageKey,
  };
}
