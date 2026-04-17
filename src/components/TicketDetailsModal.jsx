import { useState, useRef } from 'react'
import { X, Paperclip, Send, MessageCircle, Upload, ClipboardList, Image as ImageIcon, Undo2 } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import ChecklistSelectorModal from './ChecklistSelectorModal'

export default function TicketDetailsModal({ ticket, onClose, onImageClick }) {
  const { updateTicket, STATUSES } = useTicketsStore()
  const { user } = useAuthStore()
  const [isChecklistSelectorOpen, setIsChecklistSelectorOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null)
  const [confirmUndoChecklist, setConfirmUndoChecklist] = useState(false)
  const fileInputRef = useRef(null)
  const canManageChecklist = user?.canDragDrop === true

  // Permission: owner of the ticket OR admin (Ruan)
  const isAdmin = user?.canDragDrop === true
  const isOwner = user?.name === ticket?.responsible
  const canManageAttachments = isAdmin || isOwner
  
  if (!ticket) return null


  const statusConfig = STATUSES.find(s => s.value === ticket.status)

  // Normalize comments: support both legacy string `notes` and new `comments` array
  const comments = Array.isArray(ticket.comments) ? ticket.comments : []

  const normalizedAttachments = (ticket.attachments || []).map((attachment, index) => {
    if (typeof attachment === 'string') {
      return {
        id: `${ticket.id}-${index}`,
        name: attachment,
        preview: null,
        isImage: false
      }
    }

    const name = attachment?.name || `anexo-${index + 1}`
    const preview = attachment?.preview || null
    const isImage = typeof preview === 'string' && preview.startsWith('data:image/')

    return {
      id: `${ticket.id}-${index}`,
      name,
      preview,
      isImage
    }
  })

  const handleApplyChecklist = async (newItems) => {
    if (!canManageChecklist || newItems.length === 0) return
    const currentChecklist = ticket.checklist || []
    const maxId = currentChecklist.reduce((max, item) => Math.max(max, item.id || 0), 0)
    const newChecklistItems = newItems.map((title, index) => ({
      id: maxId + index + 1,
      title,
      completed: false
    }))
    const updatedChecklist = [...currentChecklist, ...newChecklistItems]
    await updateTicket(ticket.id, { checklist: updatedChecklist })
  }

  const handleSendComment = async () => {
    if (!commentText.trim() || isSendingComment) return
    setIsSendingComment(true)
    try {
      const newComment = {
        id: Date.now(),
        text: commentText.trim(),
        by: user?.name || 'Anônimo',
        date: new Date().toISOString()
      }
      const updatedComments = [...comments, newComment]
      await updateTicket(ticket.id, { comments: updatedComments })
      setCommentText('')
    } catch (err) {
      console.error('Erro ao enviar comentário:', err)
    } finally {
      setIsSendingComment(false)
    }
  }

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendComment()
    }
  }

  const handleAddPhotos = (files) => {
    if (!canManageAttachments) return
    const fileArray = Array.from(files || [])
    const currentAttachments = ticket.attachments || []
    let pending = fileArray.length

    if (pending === 0) return

    const newAttachments = []

    fileArray.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        newAttachments.push({
          name: file.name,
          preview: event.target.result,
          type: file.type
        })
        pending--
        if (pending === 0) {
          updateTicket(ticket.id, {
            attachments: [...currentAttachments, ...newAttachments]
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveAttachment = async (index) => {
    if (!canManageAttachments) return
    const currentAttachments = [...(ticket.attachments || [])]
    currentAttachments.splice(index, 1)
    await updateTicket(ticket.id, { attachments: currentAttachments })
    setConfirmDeleteIndex(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Confirm delete dialog */}
      {confirmDeleteIndex !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4"
          onClick={() => setConfirmDeleteIndex(null)}
        >
          <div
            className="bg-dark-800 border border-dark-600 rounded-2xl p-6 max-w-sm w-full animate-slideInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-dark-100 mb-2">Excluir foto</h3>
            <p className="text-sm text-dark-300 mb-6">Deseja realmente excluir essa foto? Essa ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteIndex(null)}
                className="btn-secondary flex-1 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRemoveAttachment(confirmDeleteIndex)}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-sm font-medium transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image zoom modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[70] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[80vh] relative">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-dark-300" />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Main modal */}
      <div className="bg-dark-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-dark-700 animate-slideInUp">
        {/* Header */}
        <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-primary-light">{ticket.id}</h2>
            <p className="text-sm text-dark-400 mt-1">{ticket.school}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-dark-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-dark-400 text-xs font-medium mb-1">Status</p>
              <p className={`text-sm font-semibold ${statusConfig?.color.replace('bg-', 'text-').replace('500', '400')} flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${statusConfig?.color}`}></span>
                {statusConfig?.label}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs font-medium mb-1">Turma / Device</p>
              <p className="text-sm font-semibold text-dark-100">
                {ticket.classroom} / {ticket.device}
              </p>
            </div>
            <div>
              <p className="text-dark-400 text-xs font-medium mb-1">Período</p>
              <p className="text-sm font-semibold text-dark-100">{ticket.period}</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs font-medium mb-1">Responsável</p>
              <p className="text-sm font-semibold text-dark-100">{ticket.responsible}</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs font-medium mb-1">Prioridade</p>
              <p className="text-sm font-semibold text-dark-100 capitalize">{ticket.priority}</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs font-medium mb-1">Criado</p>
              <p className="text-sm font-semibold text-dark-100">
                {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Problem type and description */}
          <div className="card-base border-dark-600">
            <h3 className="font-semibold text-dark-100 mb-3">Local do problema</h3>
            <p className="px-3 py-2 bg-dark-750 rounded-lg text-sm text-dark-300 mb-4">{ticket.problemType}</p>
            
            <h3 className="font-semibold text-dark-100 mb-3">Descrição</h3>
            <p className="text-dark-300 text-sm leading-relaxed">{ticket.description}</p>
          </div>

          {/* Checklist */}
          <div className="card-base border-dark-600">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-dark-100">Checklist de Atendimento</h3>
              </div>
              <div className="flex items-center gap-2">
                {canManageChecklist && ticket.checklist.length > 0 && (
                  <button
                    onClick={async () => {
                      if (confirmUndoChecklist) {
                        const updated = [...ticket.checklist]
                        updated.pop()
                        await updateTicket(ticket.id, { checklist: updated })
                        setConfirmUndoChecklist(false)
                      } else {
                        setConfirmUndoChecklist(true)
                        setTimeout(() => setConfirmUndoChecklist(false), 3000)
                      }
                    }}
                    className={`px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium rounded-lg border transition-all ${
                      confirmUndoChecklist
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-dark-700 border-dark-600 text-dark-300 hover:bg-dark-600 hover:text-dark-200'
                    }`}
                    title={confirmUndoChecklist ? 'Clique novamente para confirmar' : 'Remover último item do checklist'}
                  >
                    <Undo2 size={14} />
                    {confirmUndoChecklist ? 'Confirmar?' : 'Reverter'}
                  </button>
                )}
                {canManageChecklist && (
                  <button
                    onClick={() => setIsChecklistSelectorOpen(true)}
                    className="btn-primary px-3 py-1.5 flex items-center gap-1.5 text-sm"
                  >
                    <ClipboardList size={14} />
                    Checklist
                  </button>
                )}
              </div>
            </div>

            {/* Checklist items - simple text list */}
            {ticket.checklist.length > 0 ? (
              <div className="space-y-2">
                {ticket.checklist.map((item, index) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg flex items-center justify-between transition-all ${
                      confirmUndoChecklist && index === ticket.checklist.length - 1
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : ''
                    }`}
                  >
                    <span className="text-sm text-dark-200">{item.title}</span>
                    {confirmUndoChecklist && index === ticket.checklist.length - 1 && (
                      <span className="text-xs text-amber-400 font-medium ml-2 flex-shrink-0">← será removido</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-500">
                {canManageChecklist
                  ? 'Clique em "Checklist" para adicionar itens.'
                  : 'Nenhum item no checklist.'
                }
              </p>
            )}
          </div>

          {/* Attachments */}
          <div className="card-base border-dark-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark-100 flex items-center gap-2">
                <Paperclip size={18} className="text-primary-light" />
                Anexos ({normalizedAttachments.length})
              </h3>
              {canManageAttachments && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary px-3 py-1.5 flex items-center gap-1.5 text-sm"
                >
                  <Upload size={14} />
                  Adicionar foto
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                handleAddPhotos(e.target.files)
                e.target.value = ''
              }}
              className="hidden"
            />

            {normalizedAttachments.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {normalizedAttachments.map((attachment, index) => (
                  <div key={attachment.id} className="group relative">
                    <button
                      onClick={() => attachment.isImage && setSelectedImage(attachment.preview)}
                      className={`w-full bg-dark-750 border border-dark-600 rounded-lg aspect-square flex items-center justify-center transition-colors hover:bg-dark-700 ${
                        attachment.isImage
                          ? 'hover:border-primary-light/50 cursor-pointer'
                          : 'cursor-default'
                      }`}
                    >
                      {attachment.isImage ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon size={24} className="text-primary-light/50 group-hover:text-primary-light" />
                      )}
                    </button>
                    {/* Delete button */}
                    {canManageAttachments && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDeleteIndex(index)
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        title="Remover foto"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    )}
                    <p className="text-xs text-dark-400 mt-2 truncate text-center">{attachment.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-500">Nenhum anexo.</p>
            )}
          </div>

          {/* Comments (was "Observações") */}
          <div className="card-base border-dark-600">
            <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-primary-light" />
              Comentários
            </h3>

            {/* Comment list */}
            {comments.length > 0 ? (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {comments.map((comment, index) => (
                  <div
                    key={comment.id || index}
                    className="bg-dark-750 border border-dark-600 rounded-lg p-3 transition-all hover:border-dark-500"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-primary-light">{comment.by}</span>
                      <span className="text-xs text-dark-500">
                        {new Date(comment.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-500 mb-4">Nenhum comentário ainda.</p>
            )}

            {/* Comment input */}
            <div className="flex gap-2 items-end">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                placeholder="Escreva um comentário... (Enter para enviar, Shift+Enter para nova linha)"
                rows="2"
                className="input-base w-full resize-none flex-1 text-sm"
              />
              <button
                onClick={handleSendComment}
                disabled={!commentText.trim() || isSendingComment}
                className="btn-primary px-4 py-2.5 flex items-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Enviar comentário"
              >
                <Send size={16} />
                <span className="hidden sm:inline text-sm">Enviar</span>
              </button>
            </div>
          </div>

          {/* History */}
          {ticket.history.length > 0 && (
            <div className="card-base border-dark-600">
              <h3 className="font-semibold text-dark-100 mb-4">Histórico</h3>
              <div className="space-y-3">
                {ticket.history.map((entry, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary-light rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-dark-300">
                        <span className="font-semibold text-dark-100">{entry.action}</span>
                        {' '}<span className="text-dark-500">por</span>{' '}
                        <span className="text-primary-light">{entry.by}</span>
                      </p>
                      <p className="text-xs text-dark-500 mt-1">
                        {new Date(entry.date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checklist Selector Modal */}
      {isChecklistSelectorOpen && (
        <ChecklistSelectorModal
          ticket={ticket}
          onClose={() => setIsChecklistSelectorOpen(false)}
          onApply={handleApplyChecklist}
        />
      )}
    </div>
  )
}

