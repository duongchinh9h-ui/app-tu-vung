import React, { useState, useRef } from 'react'
import {
  Sun,
  Moon,
  Database,
  RotateCcw,
  Volume2,
  Check,
  Palette,
  Download,
  Upload,
  FileJson,
} from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useDeckStore } from '../store/deckStore'
import { Button } from '../components/common/Button'
import { db } from '../db'
import { speakText } from '../lib/tts'

export const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeStore()
  const { seedSampleData, loadDecks } = useDeckStore()
  const [resetSuccess, setResetSuccess] = useState(false)
  const [testSpeechDone, setTestSpeechDone] = useState(false)
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportData = async () => {
    try {
      const allDecks = await db.decks.toArray()
      const allCards = await db.cards.toArray()
      const allProgress = await db.progress.toArray()
      const allSessions = await db.sessions.toArray()

      const backupData = {
        version: 1,
        appName: 'LKHcards',
        exportDate: new Date().toISOString(),
        decks: allDecks,
        cards: allCards,
        progress: allProgress,
        sessions: allSessions,
      }

      const jsonStr = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `LKHcards_backup_${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setBackupStatusMessage('Đã xuất file JSON thành công!')
      setTimeout(() => setBackupStatusMessage(null), 3500)
    } catch (err) {
      console.error('Failed to export data:', err)
      alert('Có lỗi xảy ra khi xuất dữ liệu. Vui lòng thử lại.')
    }
  }

  const triggerImportFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string
        const parsed = JSON.parse(text)

        if (!parsed.decks || !Array.isArray(parsed.decks) || !parsed.cards || !Array.isArray(parsed.cards)) {
          alert('File JSON không hợp lệ hoặc thiếu dữ liệu bộ thẻ.')
          return
        }

        const confirmRestore = window.confirm(
          `Tìm thấy ${parsed.decks.length} bộ thẻ và ${parsed.cards.length} thẻ thuật ngữ trong file.\n\nBạn có muốn nhập dữ liệu này vào ứng dụng không?`
        )
        if (!confirmRestore) return

        if (parsed.decks.length > 0) {
          await db.decks.bulkPut(parsed.decks)
        }
        if (parsed.cards.length > 0) {
          await db.cards.bulkPut(parsed.cards)
        }
        if (parsed.progress && Array.isArray(parsed.progress) && parsed.progress.length > 0) {
          await db.progress.bulkPut(parsed.progress)
        }
        if (parsed.sessions && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          await db.sessions.bulkPut(parsed.sessions)
        }

        await loadDecks()
        setBackupStatusMessage('Đã nhập dữ liệu thành công!')
        setTimeout(() => setBackupStatusMessage(null), 3500)
      } catch (err) {
        console.error('Import error:', err)
        alert('Không thể đọc file JSON. Vui lòng kiểm tra lại định dạng file.')
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.readAsText(file)
  }

  const handleTestSpeech = async () => {
    await speakText('Xin chào! LKHcards sẵn sàng giúp bạn học ngoại ngữ.', 'vi-VN')
    setTestSpeechDone(true)
    setTimeout(() => setTestSpeechDone(false), 3000)
  }

  const handleResetData = async () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu và khôi phục các bộ thẻ mẫu ban đầu không?'
      )
    ) {
      await db.decks.clear()
      await db.cards.clear()
      await db.progress.clear()
      await db.sessions.clear()
      await seedSampleData()
      await loadDecks()
      setResetSuccess(true)
      setTimeout(() => setResetSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Cài đặt ứng dụng
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tùy chỉnh giao diện, âm thanh và quản lý cơ sở dữ liệu IndexedDB
        </p>
      </div>

      <div className="space-y-4">
        {/* Theme Palette Showcase */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-[#FBC1D1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FDDEE6] text-[#741634]">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  Bảng màu: Chuẩn sắc Pastel Pink
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FDDEE6] text-[#741634] border border-[#FBC1D1]">
                    #FDDEE6
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chuẩn xác 100% mã màu từ ảnh bạn gửi — đồng bộ toàn bộ nút bấm, banner và thanh điều hướng
                </p>
              </div>
            </div>
          </div>

          {/* Palette shade preview swatches */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {[
              { shade: '100', hex: '#FDDEE6', label: 'Chuẩn màu gốc', highlight: true },
              { shade: '200', hex: '#FBC1D1', label: 'Viền & hover' },
              { shade: '300', hex: '#F79CB7', label: 'Điểm nhấn' },
              { shade: '500', hex: '#D44773', label: 'Biểu tượng' },
              { shade: '700', hex: '#931C43', label: 'Chữ tiêu đề' },
              { shade: '900', hex: '#570F26', label: 'Chữ tương phản' },
            ].map((item) => (
              <div
                key={item.shade}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-transform hover:scale-105 ${
                  item.highlight
                    ? 'border-[#D44773] bg-[#FDDEE6]/40 ring-2 ring-[#FDDEE6]'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg shadow-xs mb-1.5 border border-black/10"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                  {item.hex}
                </span>
                <span className="text-[9px] text-slate-500 truncate max-w-full">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Giao diện tối (Dark Mode)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDarkMode ? 'Đang bật chế độ ban đêm' : 'Đang bật chế độ ban ngày'}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {isDarkMode ? 'Đổi sang Sáng' : 'Đổi sang Tối'}
          </Button>
        </div>

        {/* TTS Speech Settings */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Kiểm tra phát âm (Web Speech API)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nghe thử âm thanh phát âm từ trình duyệt của bạn
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSpeech}
            leftIcon={testSpeechDone ? <Check className="w-4 h-4 text-emerald-500" /> : <Volume2 className="w-4 h-4" />}
          >
            {testSpeechDone ? 'Đã phát' : 'Nghe thử'}
          </Button>
        </div>

        {/* Backup & Restore JSON Data */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FDDEE6] text-[#741634]">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Sao lưu & Phục hồi dữ liệu
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Xuất file JSON lưu về máy hoặc chọn file JSON để nhập lại dữ liệu bộ thẻ
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Xuất dữ liệu
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={triggerImportFileInput}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Nhập dữ liệu
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              className="hidden"
            />

            {backupStatusMessage && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {backupStatusMessage}
              </span>
            )}
          </div>
        </div>

        {/* Storage / IndexedDB Reset */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Khôi phục dữ liệu mẫu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xóa các thay đổi và đặt lại bộ thẻ mẫu ban đầu
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetData}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            {resetSuccess ? 'Đã đặt lại!' : 'Khôi phục'}
          </Button>
        </div>
      </div>
    </div>
  )
}
