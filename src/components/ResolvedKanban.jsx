import { useState, useMemo, useEffect, useRef } from 'react'
import { Archive, Trash2, CalendarDays, Filter, Loader2, ShieldAlert, ChevronDown, Check, RotateCcw, X } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

function ResolvedPrettySelect({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  selectKey,
  openSelectKey,
  setOpenSelectKey,
  compact = false
}) {
  const containerRef = useRef(null)
  const isOpen = openSelectKey === selectKey

  const normalizedOptions = useMemo(
    () => (options || []).map((item) => (
      typeof item === 'string'
        ? { value: item, label: item }
        : { value: item.value, label: item.label ?? item.value }
    )),
    [options]
  )

  const selectedOption = normalizedOptions.find((item) => item.value === value)

  useEffect(() => {
    const handleOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenSelectKey(null)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [setOpenSelectKey])

  return (
    <div
      className={`rk-pretty-select ${isOpen ? 'rk-pretty-select-open' : ''} ${compact ? 'rk-pretty-select-compact' : ''}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="rk-pretty-trigger"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpenSelectKey((prev) => (prev === selectKey ? null : selectKey))}
        aria-expanded={isOpen}
      >
        <span className={`rk-pretty-label ${value ? 'rk-pretty-label-filled' : ''}`}>
          {Icon && <Icon size={14} />}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={15} className={`rk-pretty-chevron ${isOpen ? 'rk-pretty-chevron-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="rk-pretty-options" onMouseDown={(e) => e.stopPropagation()}>
          {normalizedOptions.map((item, index) => (
            <button
              key={`${selectKey}-${item.value}`}
              type="button"
              className={`rk-pretty-option ${value === item.value ? 'rk-pretty-option-active' : ''}`}
              onClick={() => {
                onChange(item.value)
                setOpenSelectKey(null)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ '--rk-option-index': index }}
            >
              {value === item.value && <Check size={12} className="rk-pretty-option-check" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Confirm Delete Modal (premium glassmorphism) ─────────────────── */
function ConfirmDeleteModalResolved({ isOpen, onClose, onConfirm, isDeleting, task }) {
  if (!isOpen || !task) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isDeleting) onClose()
  }

  const previewText = task.title || task.description || ''

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.97) 0%, rgba(18, 22, 34, 0.99) 100%)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(239, 68, 68, 0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top red accent bar */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.8), rgba(239,68,68,0.6), transparent)',
          }}
        />

        {/* Red glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative p-6 flex flex-col items-center text-center space-y-5">
          {/* Animated icon */}
          <div
            className="w-18 h-18 rounded-2xl flex items-center justify-center"
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.08) 100%)',
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 0 30px rgba(239,68,68,0.08)',
            }}
          >
            <ShieldAlert size={32} style={{ color: '#f87171' }} />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
              Excluir Tarefa?
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Tem certeza que deseja excluir esta tarefa? Essa ação <strong style={{ color: '#f87171' }}>não poderá ser desfeita</strong>.
            </p>
          </div>

          {/* Preview of task being deleted */}
          <div
            className="w-full rounded-xl p-3 text-left"
            style={{
              background: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Tarefa a ser excluída:</p>
            <p className="text-sm font-semibold mb-0.5" style={{ color: '#f87171' }}>
              #{task.id}
            </p>
            {previewText && (
              <p className="text-sm line-clamp-3" style={{ color: '#cbd5e1' }}>
                {previewText.length > 120 ? previewText.slice(0, 120) + '…' : previewText}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'rgba(100, 116, 139, 0.1)',
                color: '#94a3b8',
                border: '1px solid rgba(100, 116, 139, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.18)'
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.15)'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: isDeleting
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.75) 0%, rgba(185,28,28,0.85) 100%)',
                color: '#fff',
                border: '1px solid rgba(239,68,68,0.35)',
                boxShadow: isDeleting ? 'none' : '0 4px 20px rgba(239,68,68,0.2)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(239,68,68,0.35)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,68,68,0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Sim, excluir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────── */
export default function ResolvedKanban() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [openSelectKey, setOpenSelectKey] = useState(null)

  // ── Date filters ──
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [filterYear, setFilterYear] = useState(String(currentYear))
  const [filterMonth, setFilterMonth] = useState(String(currentMonth))

  const canDeleteTask = user?.canDragDrop === true

  // Fetch tasks
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const data = await api.get('/kanban')
      setTasks(data || [])
    } catch (err) {
      console.error('Erro ao buscar tarefas resolvidas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Build available years from task data
  const availableYears = [...new Set(tasks.filter(t => t.isArchived).map(t => {
    const d = new Date(t.archivedAt || t.createdAt)
    return d.getFullYear()
  }))].sort((a, b) => b - a)

  // If current year has no tasks, add it anyway
  if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear)

  const months = [
    { value: '0', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ]
  const yearOptions = availableYears.map((year) => ({ value: String(year), label: String(year) }))

  // Filter by year and month
  const filteredTasks = tasks.filter(task => {
    if (!task.isArchived) return false
    
    const d = new Date(task.archivedAt || task.createdAt)
    const taskYear = d.getFullYear()
    const taskMonth = d.getMonth() + 1

    if (String(taskYear) !== filterYear) return false
    if (filterMonth !== '0' && taskMonth !== Number(filterMonth)) return false
    return true
  })

  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) || null

  const handleDeleteRequest = (task) => {
    setTaskToDelete(task)
  }

  const handleConfirmDelete = async () => {
    if (!taskToDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await api.delete(`/kanban/${taskToDelete.id}`)
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id))
      if (selectedTaskId === taskToDelete.id) {
        setSelectedTaskId(null)
      }
    } catch (error) {
      alert(error.message || 'Não foi possível excluir a tarefa.')
    } finally {
      setIsDeleting(false)
      setTaskToDelete(null)
    }
  }

  return (
    <div className="rk-container">
      {/* Confirm Delete Modal */}
      <ConfirmDeleteModalResolved
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        task={taskToDelete}
      />

      {/* Header */}
      <div className="rk-page-header">
        <div className="rk-header-icon">
          <Archive size={22} style={{ color: '#86efac' }} />
        </div>
        <div>
          <h1 className="rk-page-title">Tarefas Resolvidas</h1>
          <p className="rk-page-subtitle">Tarefas arquivadas após conclusão</p>
        </div>
      </div>

      {/* ── Year/Month filter bar ── */}
      <div className="rk-filter-bar">
        <div className="rk-filter-group">
          <CalendarDays size={16} style={{ color: '#86efac', flexShrink: 0 }} />
          <ResolvedPrettySelect
            value={filterYear}
            onChange={setFilterYear}
            options={yearOptions}
            placeholder="Ano"
            selectKey="rk-filter-year"
            openSelectKey={openSelectKey}
            setOpenSelectKey={setOpenSelectKey}
            compact
          />
          <ResolvedPrettySelect
            value={filterMonth}
            onChange={setFilterMonth}
            options={months}
            placeholder="Mês"
            selectKey="rk-filter-month"
            openSelectKey={openSelectKey}
            setOpenSelectKey={setOpenSelectKey}
            compact
          />
        </div>
        <div className="rk-filter-count">
          <Filter size={13} style={{ color: '#6b7280' }} />
          <span>{filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rk-empty">
          <div className="rk-empty-icon">
            <Archive size={28} style={{ color: '#4b5563' }} />
          </div>
          <p className="rk-empty-text">Nenhuma tarefa encontrada para o período selecionado.</p>
        </div>
      ) : (
        <div className="rk-grid">
          {filteredTasks.map((task, index) => {
            const status = task.status === 'todo' ? 'A Fazer' : 
                           task.status === 'inprogress' ? 'Em Andamento' : 
                           task.status === 'inrevision' ? 'Em Revisão' : 'Concluído'

            return (
              <div key={task.id} className="rk-card-wrap" style={{ animationDelay: `${index * 0.06}s` }}>
                <div 
                  className="rk-card-item"
                  onClick={() => setSelectedTaskId(task.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="rk-card-header-item">
                    <div className="rk-card-id">#{task.id}</div>
                    <div className="rk-card-actions">
                      {canDeleteTask && (
                        <button 
                          className="rk-card-action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRequest(task)
                          }}
                          title="Excluir tarefa"
                        >
                          <Trash2 size={16} style={{ color: '#ef4444' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="rk-card-title-item">{task.title}</h3>
                  
                  {task.description && (
                    <p className="rk-card-desc-item">{task.description}</p>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="rk-card-tags-item">
                      {task.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="rk-card-tag-item">{tag}</span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="rk-card-tag-item rk-card-tag-more">+{task.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="rk-card-meta-item">
                    <span className={`rk-card-priority-item prio-${task.priority}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <span className="rk-card-status-item">{status}</span>
                  </div>

                  <div className="rk-card-footer-item">
                    <span className="rk-card-date-item">
                      {new Date(task.archivedAt || task.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedTask && (
        <div 
          className="rk-modal-overlay" 
          onClick={() => setSelectedTaskId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <div 
            className="rk-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '600px',
              margin: '16px',
              background: 'linear-gradient(135deg, rgba(20, 25, 40, 0.95) 0%, rgba(15, 20, 35, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(12px)',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedTaskId(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = '#94a3b8'
              }}
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#86efac', margin: '8px 0 0 0' }}>#{selectedTask.id}</p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Título</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', margin: '8px 0 0 0' }}>{selectedTask.title}</h2>
              </div>

              {selectedTask.description && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descrição</span>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: '8px 0 0 0' }}>{selectedTask.description}</p>
                </div>
              )}

              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Etiquetas</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {selectedTask.tags.map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', padding: '4px 10px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', color: '#86efac', fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Prioridade</span>
                  <p style={{ margin: '6px 0 0 0', fontWeight: 700, color: selectedTask.priority === 'high' ? '#fca5a5' : selectedTask.priority === 'medium' ? '#93c5fd' : '#86efac' }}>
                    {selectedTask.priority === 'high' ? 'Alta' : selectedTask.priority === 'medium' ? 'Média' : 'Baixa'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</span>
                  <p style={{ margin: '6px 0 0 0', color: '#cbd5e1' }}>
                    {selectedTask.status === 'todo' ? 'A Fazer' : selectedTask.status === 'inprogress' ? 'Em Andamento' : selectedTask.status === 'inrevision' ? 'Em Revisão' : 'Concluído'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Responsável</span>
                  <p style={{ margin: '6px 0 0 0', color: '#cbd5e1' }}>{selectedTask.responsible}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Arquivado Em</span>
                  <p style={{ margin: '6px 0 0 0', color: '#cbd5e1' }}>{new Date(selectedTask.archivedAt || selectedTask.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Delete button */}
              {canDeleteTask && (
                <button
                  onClick={() => {
                    handleDeleteRequest(selectedTask)
                    setSelectedTaskId(null)
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(185,28,28,0.9) 100%)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Trash2 size={16} /> Excluir Permanentemente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rk-container {
          display: flex;
          flex-direction: column;
          gap: 34px;
          width: 100%;
          max-width: 1700px;
          margin: 0 auto;
          position: relative;
          isolation: isolate;
          animation: rkFadeIn 0.55s ease-out;
        }

        @keyframes rkFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rk-page-header {
          display: flex;
          align-items: center;
          gap: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 24px;
          animation: rkRiseIn 0.45s ease both;
        }

        @keyframes rkRiseIn {
          from { opacity: 0; transform: translateY(14px) scale(0.992); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .rk-header-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.08));
          border: 1px solid rgba(34,197,94,0.2);
          box-shadow: 0 0 20px rgba(34,197,94,0.06);
        }

        .rk-page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #f3f4f6;
          letter-spacing: -0.01em;
        }

        .rk-page-subtitle {
          font-size: 0.9375rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        .rk-filter-bar {
          position: relative;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 22px;
          background: linear-gradient(155deg, rgba(15, 15, 30, 0.55) 0%, rgba(11, 15, 28, 0.6) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
          flex-wrap: wrap;
          animation: rkRiseIn 0.45s ease both;
          animation-delay: 0.08s;
        }

        .rk-filter-bar:hover {
          border-color: rgba(134, 239, 172, 0.2);
          box-shadow: 0 20px 34px rgba(2, 8, 23, 0.3), 0 0 18px rgba(34, 197, 94, 0.06);
        }

        .rk-filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .rk-pretty-select {
          position: relative;
          min-width: 148px;
        }

        .rk-pretty-select-open {
          z-index: 80;
        }

        .rk-pretty-trigger {
          width: 100%;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 11px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.24s ease;
        }

        .rk-pretty-trigger:hover {
          border-color: rgba(34, 197, 94, 0.24);
          background: rgba(255, 255, 255, 0.06);
        }

        .rk-pretty-select-open .rk-pretty-trigger {
          border-color: rgba(34, 197, 94, 0.42);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08), 0 0 16px rgba(34, 197, 94, 0.06);
          background: rgba(255, 255, 255, 0.06);
        }

        .rk-pretty-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #d1d5db;
          text-align: left;
          font-size: 0.8rem;
          line-height: 1.15;
          font-weight: 500;
          white-space: nowrap;
        }

        .rk-pretty-label-filled {
          color: #e5e7eb;
        }

        .rk-pretty-chevron {
          color: #64748b;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .rk-pretty-chevron-open {
          transform: rotate(180deg);
        }

        .rk-pretty-options {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 100;
          background: linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(11, 15, 28, 0.98) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(16px);
          overflow: hidden;
          max-height: 320px;
          overflow-y: auto;
        }

        .rk-pretty-option {
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: transparent;
          color: #d1d5db;
          text-align: left;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
        }

        .rk-pretty-option:hover {
          background: rgba(34, 197, 94, 0.08);
          color: #86efac;
        }

        .rk-pretty-option-active {
          background: rgba(34, 197, 94, 0.12);
          color: #86efac;
          font-weight: 500;
        }

        .rk-pretty-option-check {
          color: #86efac;
        }

        .rk-filter-count {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .rk-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 24px;
          background: linear-gradient(135deg, rgba(15, 15, 30, 0.4) 0%, rgba(11, 15, 28, 0.45) 100%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 18px;
          animation: rkRiseIn 0.45s ease both;
          animation-delay: 0.16s;
        }

        .rk-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 14px;
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.1);
        }

        .rk-empty-text {
          font-size: 0.95rem;
          color: #9ca3af;
          text-align: center;
          margin: 0;
        }

        .rk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          animation: rkRiseIn 0.45s ease both;
          animation-delay: 0.12s;
        }

        .rk-card-wrap {
          animation: rkCardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes rkCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .rk-card-item {
          padding: 20px;
          background: linear-gradient(135deg, rgba(20, 25, 40, 0.6) 0%, rgba(15, 20, 35, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
          backdrop-filter: blur(8px);
        }

        .rk-card-item:hover {
          border-color: rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, rgba(20, 25, 40, 0.8) 0%, rgba(15, 20, 35, 0.9) 100%);
          box-shadow: 0 8px 32px rgba(34, 197, 94, 0.08), 0 0 20px rgba(34, 197, 94, 0.04);
          transform: translateY(-4px);
        }

        .rk-card-header-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rk-card-id {
          font-size: 0.75rem;
          font-weight: 700;
          color: #86efac;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rk-card-actions {
          display: flex;
          gap: 6px;
        }

        .rk-card-action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: rgba(239, 68, 68, 0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0;
        }

        .rk-card-item:hover .rk-card-action-btn {
          opacity: 1;
        }

        .rk-card-action-btn:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .rk-card-title-item {
          font-size: 1rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rk-card-desc-item {
          font-size: 0.85rem;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rk-card-tags-item {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .rk-card-tag-item {
          display: inline-block;
          font-size: 0.7rem;
          padding: 3px 8px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 6px;
          color: #86efac;
          font-weight: 500;
        }

        .rk-card-tag-more {
          background: rgba(100, 116, 139, 0.1);
          border-color: rgba(100, 116, 139, 0.2);
          color: #94a3b8;
        }

        .rk-card-meta-item {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .rk-card-priority-item {
          display: inline-block;
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .rk-card-priority-item.prio-high {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        .rk-card-priority-item.prio-medium {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }

        .rk-card-priority-item.prio-low {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
        }

        .rk-card-status-item {
          font-size: 0.7rem;
          padding: 3px 8px;
          background: rgba(100, 116, 139, 0.1);
          border-radius: 6px;
          color: #cbd5e1;
          font-weight: 500;
        }

        .rk-card-footer-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .rk-card-date-item {
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
    </div>
  )
}
