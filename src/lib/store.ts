'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  BADGES,
  DATA_VERSION,
  emptyData,
  type AdaptiveDecision,
  type AppData,
  type ChildProfile,
  type ExerciseAttempt,
  type ExerciseDef,
  type Grade,
  type PracticeSession,
  type SkillType,
} from './types'
import { decideNext, pickExercise } from './adaptive'
import { starsFor } from './scoring'
import { uid } from './fa'
import { setSoundFlags, stopAudio } from './audio'

export type View =
  | 'start'
  | 'childHome'
  | 'skills'
  | 'practice'
  | 'feedback'
  | 'specialist'
  | 'settings'
  | 'help'
  | 'backup'
  | 'childForm'

interface AppState {
  data: AppData
  hydrated: boolean
  view: View
  currentChildId: string | null
  sessionId: string | null
  sessionStartedAt: string | null
  currentExercise: ExerciseDef | null
  lastAttempt: ExerciseAttempt | null
  lastDecision: AdaptiveDecision | null
  editingChildId: string | null
  justEarnedBadges: string[]

  setHydrated: (v: boolean) => void
  go: (view: View) => void
  selectChild: (id: string | null) => void
  startEditingChild: (id: string | null) => void

  addChild: (displayName: string, grade: Grade) => ChildProfile
  updateChild: (id: string, patch: Partial<Pick<ChildProfile, 'displayName' | 'grade'>> & { plan?: ChildProfile['plan'] }) => void
  removeChild: (id: string) => void

  startSession: () => void
  endSession: (status: PracticeSession['status']) => void

  beginExercise: (skillType: SkillType) => void
  recordAttempt: (metrics: {
    durationMs: number
    accuracyPercent: number
    coveragePercent: number
    completed: boolean
    offPathCount: number
    startedCorrectly: boolean
    rawPoints?: number[][]
  }) => void
  applyDecision: (decisionId: string, mode: 'accept' | 'override', forcedLevel?: number) => void
  updatePlan: (childId: string, plan: Partial<ChildProfile['plan']>) => void

  updateSettings: (patch: Partial<AppData['settings']>) => void
  replaceAllData: (data: AppData) => void
  resetAll: () => void
}

function emptyStore(): Omit<
  AppState,
  | 'setHydrated'
  | 'go'
  | 'selectChild'
  | 'startEditingChild'
  | 'addChild'
  | 'updateChild'
  | 'removeChild'
  | 'startSession'
  | 'endSession'
  | 'beginExercise'
  | 'recordAttempt'
  | 'applyDecision'
  | 'updatePlan'
  | 'updateSettings'
  | 'replaceAllData'
  | 'resetAll'
> {
  return {
    data: emptyData(),
    hydrated: false,
    view: 'start',
    currentChildId: null,
    sessionId: null,
    sessionStartedAt: null,
    currentExercise: null,
    lastAttempt: null,
    lastDecision: null,
    editingChildId: null,
    justEarnedBadges: [],
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyStore(),

      setHydrated: (v) => set({ hydrated: v }),

      go: (view) => {
        if (view !== 'practice' && view !== 'feedback') stopAudio()
        set({ view })
      },

      selectChild: (id) => set({ currentChildId: id }),

      startEditingChild: (id) => set({ editingChildId: id, view: 'childForm' }),

      addChild: (displayName, grade) => {
        const child: ChildProfile = {
          id: uid(),
          displayName: displayName.trim(),
          grade,
          createdAt: new Date().toISOString(),
          stars: 0,
          skillLevels: { path: 1, letter: 1, independent: 1 },
          plan: {
            enabledSkills: grade === 1 ? ['path', 'letter'] : ['path', 'letter', 'independent'],
            autoAdvance: true,
            levelOverrides: {},
            maxSessionMinutes: 10,
            updatedAt: new Date().toISOString(),
          },
          badges: [],
        }
        set((s) => ({ data: { ...s.data, children: [...s.data.children, child] }, currentChildId: child.id }))
        return child
      },

      updateChild: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            children: s.data.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        })),

      removeChild: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            children: s.data.children.filter((c) => c.id !== id),
            sessions: s.data.sessions.filter((x) => x.childId !== id),
            attempts: s.data.attempts.filter((x) => x.childId !== id),
            decisions: s.data.decisions.filter((x) => x.childId !== id),
            rewards: s.data.rewards.filter((x) => x.childId !== id),
          },
          currentChildId: s.currentChildId === id ? null : s.currentChildId,
        })),

      startSession: () => {
        const { currentChildId } = get()
        if (!currentChildId) return
        const session: PracticeSession = {
          id: uid(),
          childId: currentChildId,
          startedAt: new Date().toISOString(),
          status: 'active',
          attemptCount: 0,
        }
        set((s) => ({
          data: { ...s.data, sessions: [...s.data.sessions, session] },
          sessionId: session.id,
          sessionStartedAt: session.startedAt,
        }))
      },

      endSession: (status) => {
        const { sessionId } = get()
        if (!sessionId) return
        set((s) => ({
          data: {
            ...s.data,
            sessions: s.data.sessions.map((x) =>
              x.id === sessionId ? { ...x, status, endedAt: new Date().toISOString() } : x,
            ),
          },
          sessionId: null,
          sessionStartedAt: null,
        }))
      },

      beginExercise: (skillType) => {
        const { currentChildId, data } = get()
        const child = data.children.find((c) => c.id === currentChildId)
        if (!child) return
        const level = child.plan.levelOverrides[skillType] ?? child.skillLevels[skillType] ?? 1
        const recent = data.attempts
          .filter((a) => a.childId === child.id && a.skillType === skillType)
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        const decision = decideNext(level, recent)
        const lastId = recent[0]?.exerciseId ?? null
        const exercise = pickExercise(child, skillType, decision.nextLevel, decision.guidance, lastId)
        set({ currentExercise: exercise })
        get().go('practice')
      },

      recordAttempt: (metrics) => {
        const { currentChildId, sessionId, currentExercise, data } = get()
        const exercise = currentExercise
        if (!currentChildId || !exercise) return
        const child = data.children.find((c) => c.id === currentChildId)
        if (!child) return

        const attempt: ExerciseAttempt = {
          id: uid(),
          childId: currentChildId,
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          skillType: exercise.skillType,
          level: exercise.level,
          sessionId: sessionId ?? '',
          startedAt: new Date(Date.now() - metrics.durationMs).toISOString(),
          durationMs: Math.round(metrics.durationMs),
          accuracyPercent: metrics.accuracyPercent,
          coveragePercent: Math.round(metrics.coveragePercent * 1000) / 10,
          completed: metrics.completed,
          guidanceLevel: exercise.guidance,
          offPathCount: metrics.offPathCount,
          startedCorrectly: metrics.startedCorrectly,
          algorithmVersion: 1,
          rawPoints: metrics.rawPoints,
        }

        // ستاره‌ها و نشان‌ها — محاسبه خارج از set برای جلوگیری از اثر جانبی
        const earnedStars = starsFor(metrics.accuracyPercent)
        const newStars = child.stars + earnedStars
        const prevBadges = new Set(child.badges)
        const earnedBadges: string[] = []
        const childAttemptCount = data.attempts.filter((a) => a.childId === currentChildId).length + 1
        const check = (bid: string, cond: boolean) => {
          if (cond && !prevBadges.has(bid)) earnedBadges.push(bid)
        }
        check('first_attempt', childAttemptCount >= 1)
        check('persistent', childAttemptCount >= 10)
        check('stars_10', newStars >= 10)
        check('stars_30', newStars >= 30)
        check('perfect', metrics.accuracyPercent >= 97)
        check('level2', exercise.level >= 2)
        check('level3', exercise.level >= 3)
        check('independent', exercise.skillType === 'independent' && metrics.completed)

        const newRewards = earnedBadges.map((bid) => ({
          id: uid(),
          childId: currentChildId,
          type: 'badge' as const,
          badgeId: bid,
          earnedAt: new Date().toISOString(),
        }))

        // تصمیم تطبیقی برای تلاش جدید
        const recentForSkill = [
          attempt,
          ...data.attempts.filter((a) => a.childId === currentChildId && a.skillType === exercise.skillType),
        ]
        const currentLevel = child.plan.levelOverrides[exercise.skillType] ?? child.skillLevels[exercise.skillType] ?? 1
        const dec = decideNext(currentLevel, recentForSkill)
        const decision: AdaptiveDecision = {
          id: uid(),
          childId: currentChildId,
          sessionId: sessionId ?? undefined,
          attemptId: attempt.id,
          skillType: exercise.skillType,
          createdAt: new Date().toISOString(),
          action: dec.action,
          suggestedLevel: dec.nextLevel,
          suggestedGuidance: dec.guidance,
          reason: dec.reason,
          applied: false,
          overridden: false,
        }

        // اعمال خودکار سطح در صورت فعال بودن پیشروی خودکار (متخصص می‌تواند خاموش کند)
        const shouldApply =
          child.plan.autoAdvance && (dec.action === 'advance' || dec.action === 'ease') && dec.nextLevel !== currentLevel
        if (shouldApply) decision.applied = true
        const newLevel = shouldApply ? dec.nextLevel : currentLevel

        set((s) => ({
          data: {
            ...s.data,
            attempts: [...s.data.attempts, attempt],
            rewards: [...s.data.rewards, ...newRewards],
            decisions: [...s.data.decisions, decision],
            sessions: s.data.sessions.map((x) =>
              x.id === sessionId ? { ...x, attemptCount: x.attemptCount + 1 } : x,
            ),
            children: s.data.children.map((c) =>
              c.id === currentChildId
                ? {
                    ...c,
                    stars: newStars,
                    badges: [...c.badges, ...earnedBadges],
                    skillLevels: { ...c.skillLevels, [exercise.skillType]: newLevel },
                  }
                : c,
            ),
          },
          lastAttempt: attempt,
          lastDecision: decision,
          justEarnedBadges: earnedBadges,
        }))

        get().go('feedback')
      },

      applyDecision: (decisionId, mode, forcedLevel) => {
        set((s) => {
          const decision = s.data.decisions.find((d) => d.id === decisionId)
          if (!decision) return s
          const child = s.data.children.find((c) => c.id === decision.childId)
          if (!child) return s
          const level = mode === 'override' && forcedLevel !== undefined ? forcedLevel : decision.suggestedLevel
          return {
            data: {
              ...s.data,
              decisions: s.data.decisions.map((d) =>
                d.id === decisionId ? { ...d, applied: true, overridden: mode === 'override' } : d,
              ),
              children: s.data.children.map((c) =>
                c.id === child.id ? { ...c, skillLevels: { ...c.skillLevels, [decision.skillType]: level } } : c,
              ),
            },
          }
        })
      },

      updatePlan: (childId, plan) =>
        set((s) => ({
          data: {
            ...s.data,
            children: s.data.children.map((c) =>
              c.id === childId ? { ...c, plan: { ...c.plan, ...plan, updatedAt: new Date().toISOString() } } : c,
            ),
          },
        })),

      updateSettings: (patch) => {
        const settings = { ...get().data.settings, ...patch }
        setSoundFlags(settings.soundEnabled, settings.voiceEnabled)
        set((s) => ({ data: { ...s.data, settings } }))
      },

      replaceAllData: (data) => {
        setSoundFlags(data.settings.soundEnabled, data.settings.voiceEnabled)
        set({ ...emptyStore(), data, view: 'start' })
      },

      resetAll: () => {
        set({ ...emptyStore(), data: emptyData(), view: 'start' })
      },
    }),
    {
      name: 'nazarkahriz-store',
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data, currentChildId: s.currentChildId }),
      onRehydrateStorage: () => (state) => {
        if (state?.data) {
          setSoundFlags(state.data.settings.soundEnabled, state.data.settings.voiceEnabled)
        }
        state?.setHydrated(true)
      },
    },
  ),
)

// انتخابگرهای کمکی
export function useCurrentChild(): ChildProfile | null {
  return useAppStore((s) => s.data.children.find((c) => c.id === s.currentChildId) ?? null)
}

export function badgesOf(child: ChildProfile) {
  return BADGES.filter((b) => child.badges.includes(b.id))
}
