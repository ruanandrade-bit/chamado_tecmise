import { useState } from 'react'
import { X, Plus, Check, Paperclip, ZoomIn, Image as ImageIcon } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'

export default function TicketDetailsModal({ ticket, onClose, onImageClick }) {
  const { updateTicket, updateChecklistItem, addChecklistItem, getTicketProgress, STATUSES } = useTicketsStore()
  const { user } = useAuthStore()
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const canManageChecklist = user?.canDragDrop === true
  
  if (!ticket) return null

  const progress = getTicketProgress(ticket)
  const statusConfig = STATUSES.find(s => s.value === ticket.status)
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

  const handleAddChecklistItem = () => {
    if (!canManageChecklist) return
    if (newChecklistItem.trim()) {
      addChecklistItem(ticket.id, newChecklistItem)
      setNewChecklistItem('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
            <h3 className="font-semibold text-dark-100 mb-3">Tipo de Problema</h3>
            <p className="px-3 py-2 bg-dark-750 rounded-lg text-sm text-dark-300 mb-4">{ticket.problemType}</p>
            
            <h3 className="font-semibold text-dark-100 mb-3">Descrição</h3>
            <p className="text-dark-300 text-sm leading-relaxed">{ticket.description}</p>
          </div>

          {/* Checklist */}
          <div className="card-base border-dark-600">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-dark-100">Checklist de Atendimento</h3>
                <p className="text-xs text-dark-400 mt-1">
                  {ticket.checklist.filter(c => c.completed).length}/{ticket.checklist.length} concluído{ticket.checklist.filter(c => c.completed).length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-lg font-bold text-primary-light">{progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-dark-600 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-light to-primary transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-2 mb-4">
              {ticket.checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => canManageChecklist && updateChecklistItem(ticket.id, item.id, !item.completed)}
                  disabled={!canManageChecklist}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    item.completed
                      ? 'bg-primary-light/20 border border-primary-light/30'
                      : 'bg-dark-700 border border-dark-600 hover:border-primary-light/50'
                  } ${canManageChecklist ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    item.completed
                      ? 'border-primary-light bg-primary-light'
                      : 'border-dark-500 hover:border-primary-light'
                  }`}>
                    {item.completed && <Check size={14} className="text-dark-950" />}
                  </div>
                  <span className={`flex-1 text-left text-sm ${
                    item.completed
                      ? 'text-primary-light line-through'
                      : 'text-dark-300'
                  }`}>
                    {item.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Add new item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                placeholder="Nova tarefa..."
                className="input-base flex-1 text-sm"
                disabled={!canManageChecklist}
              />
              <button
                onClick={handleAddChecklistItem}
                className="btn-primary px-3"
                disabled={!canManageChecklist}
              >
                <Plus size={18} />
              </button>
            </div>
            {!canManageChecklist && (
              <p className="text-xs text-dark-500 mt-2">
                Apenas o admin (Ruan) pode marcar e adicionar tarefas do checklist.
              </p>
            )}
          </div>

          {/* Attachments */}
          {normalizedAttachments.length > 0 && (
            <div className="card-base border-dark-600">
              <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Paperclip size={18} className="text-primary-light" />
                Anexos ({normalizedAttachments.length})
              </h3>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {normalizedAttachments.map((attachment) => (
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
                    <p className="text-xs text-dark-400 mt-2 truncate text-center">{attachment.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card-base border-dark-600">
            <h3 className="font-semibold text-dark-100 mb-3">Observações</h3>
            <textarea
              value={ticket.notes}
              onChange={(e) => updateTicket(ticket.id, { notes: e.target.value })}
              placeholder="Adicione observações sobre este chamado..."
              rows="3"
              className="input-base w-full resize-none"
            />
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
    </div>
  )
}
