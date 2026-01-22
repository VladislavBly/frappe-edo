import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { RichTextEditor } from './RichTextEditor'
import { api } from '../lib/api'
import type { Comment } from '../lib/api'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Comments.module.scss'

interface CommentsProps {
  doctype: string
  docname: string
}

export function Comments({ doctype, docname }: CommentsProps) {
  const { t } = useTranslation()
  const [allComments, setAllComments] = useState<Comment[]>([])
  const [displayCount, setDisplayCount] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastCommentId, setLastCommentId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const commentsListRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    loadComments()
    checkAdminRole()
  }, [doctype, docname])

  const checkAdminRole = async () => {
    try {
      const user = await api.getCurrentUser()
      setIsAdmin(user.roles?.includes('EDO Admin') || false)
    } catch (error) {
      console.error('Failed to check admin role:', error)
      setIsAdmin(false)
    }
  }

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await api.getComments(doctype, docname)
      // Reverse to show newest first
      setAllComments(data.reverse())
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

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

    setSubmitting(true)

    try {
      const addedComment = await api.addComment(doctype, docname, newComment)
      setNewComment('')

      // Mark the new comment for animation BEFORE loading
      setLastCommentId(addedComment.name)

      // Small delay to ensure state is set
      await new Promise(resolve => setTimeout(resolve, 50))

      // Load comments - the new one will be animated
      await loadComments()

      // Smooth scroll to top
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
      }, 100)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmitting(false)
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
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleDeleteComment = async (commentName: string) => {
    if (!isAdmin) return
    
    const confirmMessage = t('deleteCommentConfirm') || 'Вы уверены, что хотите удалить этот комментарий?'
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await api.deleteComment(commentName)
      // Remove comment from list
      setAllComments(prev => prev.filter(c => c.name !== commentName))
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
            overflowY: 'scroll'
          }}
        >
          <div ref={commentsListRef} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayedComments.map((comment) => {
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
                      mass: 0.8
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
              )})}

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
        animate={submitting ? { scale: 0.98 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <RichTextEditor value={newComment} onChange={setNewComment} placeholder={t('addComment')} />
        <Button type="submit" size="sm" disabled={submitting}>
          <Send className="h-4 w-4 mr-2" />
          {submitting ? t('sending') : t('send')}
        </Button>
      </motion.form>
    </div>
  )
}
