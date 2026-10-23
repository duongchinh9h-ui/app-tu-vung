import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

// Lazy load pages for code splitting and instant performance
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
)
const DecksPage = lazy(() =>
  import('./pages/DecksPage').then((m) => ({ default: m.DecksPage }))
)
const DeckDetailPage = lazy(() =>
  import('./pages/DeckDetailPage').then((m) => ({ default: m.DeckDetailPage }))
)
const DeckEditorPage = lazy(() =>
  import('./pages/DeckEditorPage').then((m) => ({ default: m.DeckEditorPage }))
)
const FlashcardsPage = lazy(() =>
  import('./pages/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage }))
)
const LearnPage = lazy(() =>
  import('./pages/LearnPage').then((m) => ({ default: m.LearnPage }))
)
const TestPage = lazy(() =>
  import('./pages/TestPage').then((m) => ({ default: m.TestPage }))
)
const MatchPage = lazy(() =>
  import('./pages/MatchPage').then((m) => ({ default: m.MatchPage }))
)
const TypeInPage = lazy(() =>
  import('./pages/TypeInPage').then((m) => ({ default: m.TypeInPage }))
)
const StatsPage = lazy(() =>
  import('./pages/StatsPage').then((m) => ({ default: m.StatsPage }))
)
const PracticePage = lazy(() =>
  import('./pages/PracticePage').then((m) => ({ default: m.PracticePage }))
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Full-screen minimal study modes */}
          <Route path="/deck/:id/flashcards" element={<FlashcardsPage />} />
          <Route path="/deck/:id/learn" element={<LearnPage />} />
          <Route path="/deck/:id/test" element={<TestPage />} />
          <Route path="/deck/:id/match" element={<MatchPage />} />
          <Route path="/deck/:id/type-in" element={<TypeInPage />} />
          <Route path="/deck/:id/practice" element={<PracticePage />} />

          {/* Standard App Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/decks" element={<DecksPage />} />
            <Route path="/deck/new" element={<DeckEditorPage />} />
            <Route path="/deck/:id" element={<DeckDetailPage />} />
            <Route path="/deck/:id/edit" element={<DeckEditorPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
