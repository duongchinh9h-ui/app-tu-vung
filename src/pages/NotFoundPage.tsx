import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/common/Button'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-3xl flex items-center justify-center mx-auto mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Không tìm thấy trang
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Quay lại
        </Button>
        <Button
          size="sm"
          onClick={() => navigate('/')}
          leftIcon={<Home className="w-4 h-4" />}
        >
          Trang chủ
        </Button>
      </div>
    </div>
  )
}
