'use client'

import { useState } from 'react'
import { toggleBoardPublic } from '@/app/b/[boardId]/actions'

interface Props {
  boardId: string
  isPublic: boolean
  isOwner: boolean
}

export function ShareBoardButton({ boardId, isPublic, isOwner }: Props) {
  const [copied, setCopied] = useState(false)
  const [isCurrentlyPublic, setIsCurrentlyPublic] = useState(isPublic)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOwner && !isPublic) return null

  const handleShare = async () => {
    const url = `${window.location.origin}/b/${boardId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Eğer gizliyse otomatik olarak paylaşıma açalım (kolaylık olsun diye)
    if (!isCurrentlyPublic && isOwner) {
      setIsLoading(true)
      await toggleBoardPublic(boardId, true)
      setIsCurrentlyPublic(true)
      setIsLoading(false)
    }
  }

  const handleToggle = async () => {
    setIsLoading(true)
    await toggleBoardPublic(boardId, !isCurrentlyPublic)
    setIsCurrentlyPublic(!isCurrentlyPublic)
    setIsLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {isOwner && (
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
            isCurrentlyPublic 
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
          title={isCurrentlyPublic ? 'Gizli yap' : 'Herkese açık yap'}
        >
          {isCurrentlyPublic ? 'Açık (Public)' : 'Gizli (Private)'}
        </button>
      )}

      {(isOwner || isCurrentlyPublic) && (
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? 'Kopyalandı!' : 'Paylaş'}
        </button>
      )}
    </div>
  )
}
