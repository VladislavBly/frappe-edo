import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { RichTextEditor } from './RichTextEditor'
import { useComments, useAddComment, useDeleteComment } from '../api/comments/api'
import { useCurrentUser } from '../api/users/api'
import type { Comment } from '../api/comments/types'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Comments.module.scss'

interface CommentsProps {
  doctype: string
  docname: string
  refreshTrigger?: number // Optional trigger to force refresh
}

export function Comments({ doctype, docname, refreshTrigger }: CommentsProps) {
  const { t } = useTranslation()
  const { data: commentsData = [], isLoading: loading } = useComments(doctype, docname)
  const { data: currentUser } = useCurrentUser()
  const addCommentMutation = useAddComment()
  const deleteCommentMutation = useDeleteComment()

  const [allComments, setAllComments] = useState<Comment[]>([])
  const [displayCount, setDisplayCount] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [lastCommentId, setLastCommentId] = useState<string | null>(null)
  const commentsListRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isAdmin = currentUser?.roles?.includes('EDO Admin') || false

  useEffect(() => {
    if (commentsData.length > 0) {
      // Filter out comments that contain resolution information
      const filteredData = commentsData.filter(comment => {
        const content = comment.content || ''
        // Remove HTML tags for checking
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content
        const textContent = (tempDiv.textContent || tempDiv.innerText || '').toLowerCase()

        // Filter out comments that contain resolution-related keywords
        const resolutionKeywords = [
          'резолюция',
          'resolution',
          'документ обработан в приёмной',
          'исполнитель:',
          'соисполнители:',
          'executor:',
          'co-executor:',
        ]

        // Check if comment contains resolution keywords
        const hasResolutionInfo = resolutionKeywords.some(keyword =>
          textContent.includes(keyword.toLowerCase())
        )

        return !hasResolutionInfo
      })

      // Reverse to show newest first
      setAllComments(filteredData.reverse())
    } else {
      setAllComments([])
    }
  }, [commentsData, refreshTrigger])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50

    if (scrolledToBottom && displayCount < allComments.length) {
      // Load 5 more comments
      setDisplayCount(prev => Math.min(prev + 5, allComments.length))
    }
  }

  const displayedComments = allComments.slice(0, displayCount)
  const hasMore = displayCount < allComments.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Check if comment has actual content (not just empty HTML tags)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = newComment
    const textContent = tempDiv.textContent || tempDiv.innerText || ''

    if (!textContent.trim()) return

    try {
      const addedComment = await addCommentMutation.mutateAsync({
        doctype,
        docname,
        content: newComment,
      })
      setNewComment('')

      // Mark the new comment for animation
      setLastCommentId(addedComment.name)

      // Smooth scroll to top
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth',
          })
        }
      }, 100)
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return (
      name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    )
  }

  const handleDeleteComment = async (commentName: string) => {
    if (!isAdmin) return

    const confirmMessage =
      t('deleteCommentConfirm') || 'Вы уверены, что хотите удалить этот комментарий?'
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await deleteCommentMutation.mutateAsync({
        commentName,
        doctype,
        docname,
      })
    } catch (error) {
      console.error('Failed to delete comment:', error)
      const errorMessage = t('deleteCommentError') || 'Не удалось удалить комментарий'
      alert(errorMessage)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        {t('comments')}
        <span className="text-muted-foreground">({allComments.length})</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">{t('loading')}...</div>
      ) : (
        <div
          ref={scrollContainerRef}
          className={`pr-2 ${styles.customScrollbar}`}
          onScroll={handleScroll}
          style={{
            maxHeight: '300px',
            overflowY: 'scroll',
          }}
        >
          <div ref={commentsListRef} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayedComments.map(comment => {
                const isNewComment = comment.name === lastCommentId

                return (
                  <motion.div
                    key={comment.name}
                    layout
                    initial={isNewComment ? { opacity: 0, x: -100 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                    }}
                    className="flex gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary-foreground">
                        {getInitials(comment.comment_by)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.comment_by}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.creation)}
                          </span>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.name)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div
                        className={`text-sm text-foreground ${styles.commentContent}`}
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {hasMore && (
              <div className="text-center py-2 text-xs text-muted-foreground">
                Прокрутите вниз для загрузки еще...
              </div>
            )}
          </div>
        </div>
      )}

      <motion.form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-2"
        animate={addCommentMutation.isPending ? { scale: 0.98 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <RichTextEditor value={newComment} onChange={setNewComment} placeholder={t('addComment')} />
        <Button type="submit" size="sm" disabled={addCommentMutation.isPending}>
          <Send className="h-4 w-4 mr-2" />
          {addCommentMutation.isPending ? t('sending') : t('send')}
        </Button>
      </motion.form>
    </div>
  )
}
