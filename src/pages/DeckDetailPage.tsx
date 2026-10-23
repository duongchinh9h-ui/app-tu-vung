import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Edit3,
  Trash2,
  Layers,
  Brain,
  FileCheck2,
  Gamepad2,
  Keyboard,
  MessageSquareText,
  ArrowLeft,
  Star,
  Download,
  AlertTriangle,
  Languages,
  FileSpreadsheet,
} from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import { PreviewCard } from '../components/deck/PreviewCard'
import { CardListItem } from '../components/deck/CardListItem'
import { ImportDataModal } from '../components/deck/ImportDataModal'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { repository } from '../db'
import type { ParsedCardItem } from '../lib/importParser'

export const DeckDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    activeDeck,
    activeCards,
    isLoading,
    loadDeck,
    deleteDeck,
    toggleStarCard,
  } = useDeckStore()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [filterStarredOnly, setFilterStarredOnly] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const handleImportMore = async (imported: ParsedCardItem[]) => {
    if (!activeDeck || imported.length === 0) return
    for (const item of imported) {
      await repository.cards.create(activeDeck.id, {
        term: item.term,
        definition: item.definition,
        note: item.note || '',
      })
    }
    await loadDeck(activeDeck.id)
  }

  useEffect(() => {
    if (id) {
      loadDeck(id)
    }
  }, [id, loadDeck])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  if (!activeDeck) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Không tìm thấy bộ thẻ
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Bộ thẻ bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Button onClick={() => navigate('/')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Quay lại trang chủ
        </Button>
      </div>
    )
  }

  const handleDeleteConfirm = async () => {
    if (!id) return
    await deleteDeck(id)
    setDeleteModalOpen(false)
    navigate('/')
  }

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ deck: activeDeck, cards: activeCards }, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${activeDeck.title}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const starredCardsCount = activeCards.filter((c) => c.starred).length
  const displayedCards = filterStarredOnly
    ? activeCards.filter((c) => c.starred)
    : activeCards

  // 5 Study Modes grid items
  const studyModes = [
    {
      id: 'flashcards',
      title: 'Thẻ ghi nhớ',
      desc: 'Lật thẻ và phát âm',
      icon: Layers,
      color: 'from-rose-400 to-indigo-500',
      badge: 'Cơ bản',
      path: `/deck/${activeDeck.id}/flashcards`,
    },
    {
      id: 'learn',
      title: 'Học SM-2',
      desc: 'Lặp lại ngắt quãng',
      icon: Brain,
      color: 'from-indigo-600 to-purple-600',
      badge: `${activeDeck.dueCount || 0} cần ôn`,
      badgeVariant: (activeDeck.dueCount || 0) > 0 ? ('amber' as const) : ('emerald' as const),
      path: `/deck/${activeDeck.id}/learn`,
    },
    {
      id: 'test',
      title: 'Kiểm tra',
      desc: 'Trắc nghiệm & Tự luận',
      icon: FileCheck2,
      color: 'from-violet-600 to-fuchsia-600',
      badge: 'Thử thách',
      path: `/deck/${activeDeck.id}/test`,
    },
    {
      id: 'match',
      title: 'Ghép thẻ',
      desc: 'Ghép từ & nghĩa tính giờ',
      icon: Gamepad2,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Trò chơi',
      path: `/deck/${activeDeck.id}/match`,
    },
    {
      id: 'type-in',
      title: 'Gõ từ',
      desc: 'Luyện trí nhớ & chính tả',
      icon: Keyboard,
      color: 'from-amber-500 to-orange-600',
      badge: 'Luyện gõ',
      path: `/deck/${activeDeck.id}/type-in`,
    },
    {
      id: 'practice',
      title: 'Điền từ & Hội thoại',
      desc: 'Câu khuyết & Đối đáp thực tế',
      icon: MessageSquareText,
      color: 'from-rose-500 to-pink-600',
      badge: 'Luyện tập',
      badgeVariant: 'indigo' as const,
      path: `/deck/${activeDeck.id}/practice`,
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header: Back navigation & Deck Title & Actions */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="indigo" size="sm" className="gap-1 font-semibold">
                <Languages className="w-3 h-3" />
                <span>
                  {activeDeck.termLang} → {activeDeck.definitionLang}
                </span>
              </Badge>
              <Badge variant="default" size="sm">
                {activeCards.length} thuật ngữ
              </Badge>
              {(activeDeck.dueCount || 0) > 0 && (
                <Badge variant="amber" size="sm">
                  {activeDeck.dueCount} thẻ cần ôn hôm nay
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeDeck.title}
            </h1>

            {activeDeck.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {activeDeck.description}
              </p>
            )}
          </div>

          {/* Action buttons: Edit, Export, Delete */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              title="Nhập thêm từ vựng từ Excel / Word"
            >
              Nhập từ
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/deck/${activeDeck.id}/edit`)}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Sửa
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              leftIcon={<Download className="w-4 h-4" />}
              title="Xuất file JSON sao lưu"
            >
              Xuất
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* Grid 2x3 Study Modes Buttons */}
      <section>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Chế độ học tập
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5">
          {studyModes.map((mode) => {
            const Icon = mode.icon
            return (
              <Link
                key={mode.id}
                to={mode.path}
                className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/80 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mode.color} text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {mode.badge && (
                      <Badge
                        variant={mode.badgeVariant || 'default'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {mode.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {mode.desc}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Preview Card Section */}
      <section className="p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Xem nhanh thẻ ghi nhớ (Preview)
          </h2>
          <Button
            size="sm"
            onClick={() => navigate(`/deck/${activeDeck.id}/flashcards`)}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Học toàn màn hình
          </Button>
        </div>

        <PreviewCard
          cards={activeCards}
          termLang={activeDeck.termLang}
          onToggleStar={toggleStarCard}
        />
      </section>

      {/* Cards List Section: Thuật ngữ | Định nghĩa | Phát âm | Đánh sao */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Danh sách thuật ngữ ({activeCards.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhấn vào biểu tượng loa để nghe phát âm giọng bản xứ
            </p>
          </div>

          <div className="flex items-center gap-2">
            {starredCardsCount > 0 && (
              <button
                onClick={() => setFilterStarredOnly(!filterStarredOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  filterStarredOnly
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    filterStarredOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                  }`}
                />
                <span>Chỉ thẻ có sao ({starredCardsCount})</span>
              </button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />}
            >
              + Nhập từ
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/deck/${activeDeck.id}/edit`)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Chỉnh sửa thẻ
            </Button>
          </div>
        </div>

        {/* Term List Items */}
        <div className="space-y-2.5">
          {displayedCards.length > 0 ? (
            displayedCards.map((card, idx) => (
              <CardListItem
                key={card.id}
                card={card}
                index={idx}
                termLang={activeDeck.termLang}
                onToggleStar={toggleStarCard}
              />
            ))
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              Không có thuật ngữ nào thỏa mãn bộ lọc.
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Xác nhận xóa bộ thẻ"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              Hành động này sẽ xóa vĩnh viễn bộ thẻ{' '}
              <strong className="font-bold">"{activeDeck.title}"</strong> cùng toàn bộ{' '}
              {activeCards.length} thẻ thuật ngữ và tiến độ học tập SM-2 liên quan. Bạn có chắc chắn muốn xóa?
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quizlet-style Import Data Modal */}
      <ImportDataModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportMore}
      />
    </div>
  )
}
