import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Clock,
  Plus,
  BookOpen,
  ArrowRight,
  Flame,
  Search,
  RotateCcw,
} from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import { DeckCard } from '../components/deck/DeckCard'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const {
    decks,
    totalDueToday,
    isLoading,
    searchQuery,
    loadDecks,
    seedSampleData,
  } = useDeckStore()

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  // Recent decks (decks studied or modified recently)
  const recentDecks = decks.slice(0, 3)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero / Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FDDEE6] border border-[#FBC1D1] text-[#380716] p-6 sm:p-8 shadow-sm">
        {/* Background decorative soft shapes */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-[#FBC1D1]/40 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#FBC1D1] backdrop-blur-sm text-xs font-semibold tracking-wide uppercase mb-3 text-[#741634]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Phương pháp học lặp lại ngắt quãng SM-2</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-2 text-[#380716]">
            Chào mừng bạn đến với LKHcards!
          </h1>
          <p className="text-[#741634] text-sm sm:text-base leading-relaxed mb-6 font-normal">
            Học từ vựng nhanh hơn, nhớ lâu hơn gấp 3 lần với hệ thống thẻ thông minh và phát âm chuẩn bản xứ.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/deck/new')}
              leftIcon={<Plus className="w-4 h-4 text-[#741634]" />}
              className="bg-white text-[#741634] hover:bg-[#FFF9FA] border border-[#FBC1D1] shadow-sm font-bold"
            >
              Tạo bộ thẻ mới
            </Button>

            {totalDueToday > 0 && recentDecks[0] && (
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/deck/${recentDecks[0].id}`)}
                leftIcon={<Clock className="w-4 h-4 text-[#741634]" />}
                className="bg-white/70 border-[#FBC1D1] text-[#741634] hover:bg-white font-medium"
              >
                Ôn ngay ({totalDueToday} thẻ đến hạn)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: Cần ôn hôm nay (Due today cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Cần ôn hôm nay
                {totalDueToday > 0 ? (
                  <Badge variant="amber" size="sm">
                    {totalDueToday} thẻ đến hạn
                  </Badge>
                ) : (
                  <Badge variant="emerald" size="sm">
                    Tất cả đã xong
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Các thẻ thuật ngữ được thuật toán SM-2 tính toán cần ôn tập hôm nay
              </p>
            </div>
          </div>
        </div>

        {totalDueToday > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks
              .filter((d) => (d.dueCount || 0) > 0)
              .slice(0, 2)
              .map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40"
                >
                  <div className="min-w-0 pr-3">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm sm:text-base">
                      {deck.title}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                      {deck.dueCount} thẻ cần xem lại
                    </p>
                  </div>
                  <Link
                    to={`/deck/${deck.id}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <span>Ôn ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
            <Flame className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>
              Tuyệt vời! Bạn không còn thẻ nào cần ôn hôm nay. Bạn có thể học thêm bộ mới hoặc tạo thêm thẻ.
            </span>
          </div>
        )}
      </section>

      {/* SECTION 2: Khối Tiếp tục học (recent decks horizontally) */}
      {recentDecks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Tiếp tục học
            </h2>
            <Link
              to="/decks"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: Lưới bộ thẻ (All decks grid with search filter) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Tất cả bộ thẻ của bạn'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng cộng {decks.length} bộ thẻ trong thư viện
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={seedSampleData}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Khôi phục hoặc tải bộ thẻ mẫu"
            >
              Tải lại bộ mẫu
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/deck/new')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Tạo bộ thẻ
            </Button>
          </div>
        </div>

        {/* Deck Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : decks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              {searchQuery ? <Search className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {searchQuery
                ? 'Không tìm thấy bộ thẻ nào phù hợp'
                : 'Chưa có bộ thẻ nào'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                : 'Bắt đầu hành trình học tập bằng cách tạo bộ thẻ mới hoặc tải bộ thẻ mẫu!'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/deck/new')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Tạo bộ thẻ ngay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={seedSampleData}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Tải bộ mẫu
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
