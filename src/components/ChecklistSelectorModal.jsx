import { useState } from 'react'
import { X, Check, ClipboardList } from 'lucide-react'

const CHECKLIST_TEMPLATE = [
  {
    category: '1. Verificação no S4S',
    items: [
      'Tentei emitir relatório de emoções',
      'Relatório travou no processamento',
      'Sim → acionar infra (memória/fila/Gui)',
      'Relatório não trouxe dados',
      'Verifiquei cadastro do aluno',
      'Foto está nítida',
      'Aluno está vinculado corretamente',
    ]
  },
  {
    category: '2. Verificação no S3',
    items: [
      'Verifiquei vídeos no S3 (device + período + turno)',
      '✅ Tem vídeo',
      'Fazer reprocessamento',
      'Reprocessamento resolveu',
      'Não resolveu → escalar N2',
      '❌ Não tem vídeo',
    ]
  },
  {
    category: '3. Verificação de Hardware',
    items: [
      'Raspberry ligado (LED correto)',
      'Fonte funcionando',
      'Cabos conectados',
      'Câmera conectada',
      'Internet da escola funcionando',
      'Reiniciei equipamento',
      'Troca de fonte',
      'Troca de device',
      'Problema novo → escalar N2',
    ]
  },
  {
    category: '4. Escalonamento N2 (Exceções)',
    items: [
      'Reprocessamento falhou',
      'Banco de dados cheio',
      'CDC parado / fila travada',
      'SD card cheio / Docker com erro',
      'Problema fora do padrão',
    ]
  },
  {
    category: '5. Finalização do Chamado',
    items: [
      'Descrevi o problema encontrado',
      'Descrevi o que foi feito',
      'Informei se pedagoga precisa agir',
      'Informei se foi escalado (N2)',
      'Defini status: Resolvido',
      'Defini status: Em andamento',
      'Defini status: Escalado',
    ]
  }
]

export default function ChecklistSelectorModal({ ticket, onClose, onApply }) {
  // Build a set of already-added titles for pre-checking
  const existingTitles = new Set((ticket.checklist || []).map(item => item.title))

  // Initialize selected state: pre-check items already in the ticket
  const [selected, setSelected] = useState(() => {
    const initial = {}
    CHECKLIST_TEMPLATE.forEach(section => {
      section.items.forEach(item => {
        initial[item] = existingTitles.has(item)
      })
    })
    return initial
  })

  const toggleItem = (item) => {
    // Don't allow unchecking items that are already in the ticket (they're already added)
    if (existingTitles.has(item)) return
    setSelected(prev => ({ ...prev, [item]: !prev[item] }))
  }

  const toggleSection = (section) => {
    const allNewItems = section.items.filter(item => !existingTitles.has(item))
    const allSelected = allNewItems.every(item => selected[item])
    const newState = { ...selected }
    allNewItems.forEach(item => {
      newState[item] = !allSelected
    })
    setSelected(newState)
  }

  const handleApply = () => {
    // Only add items that are newly selected (not already in the ticket)
    const newItems = []
    CHECKLIST_TEMPLATE.forEach(section => {
      section.items.forEach(item => {
        if (selected[item] && !existingTitles.has(item)) {
          newItems.push(item)
        }
      })
    })
    onApply(newItems)
    onClose()
  }

  const newSelectedCount = Object.entries(selected)
    .filter(([item, checked]) => checked && !existingTitles.has(item))
    .length

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[75] p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-800 border border-dark-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-slideInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light/20 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} className="text-primary-light" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-100">Checklist de Atendimento</h2>
              <p className="text-xs text-dark-400">Selecione os itens para adicionar ao chamado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-dark-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {CHECKLIST_TEMPLATE.map((section) => {
            const newItems = section.items.filter(item => !existingTitles.has(item))
            const allNewSelected = newItems.length > 0 && newItems.every(item => selected[item])
            const someNewSelected = newItems.some(item => selected[item])

            return (
              <div key={section.category}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="flex items-center gap-3 mb-3 w-full text-left group"
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    allNewSelected
                      ? 'border-primary-light bg-primary-light'
                      : someNewSelected
                        ? 'border-primary-light/50 bg-primary-light/30'
                        : 'border-dark-500 group-hover:border-primary-light/50'
                  }`}>
                    {(allNewSelected || someNewSelected) && (
                      <Check size={12} className={allNewSelected ? 'text-dark-950' : 'text-primary-light'} />
                    )}
                  </div>
                  <h3 className="font-bold text-dark-100 text-sm group-hover:text-primary-light transition-colors">
                    {section.category}
                  </h3>
                </button>

                {/* Section items */}
                <div className="space-y-1.5 ml-2">
                  {section.items.map((item) => {
                    const isExisting = existingTitles.has(item)
                    const isChecked = selected[item]

                    return (
                      <button
                        key={item}
                        onClick={() => toggleItem(item)}
                        disabled={isExisting}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                          isExisting
                            ? 'bg-primary-light/10 border border-primary-light/20 opacity-60 cursor-not-allowed'
                            : isChecked
                              ? 'bg-primary-light/15 border border-primary-light/30 hover:bg-primary-light/20'
                              : 'bg-dark-750 border border-dark-600 hover:border-dark-500 hover:bg-dark-700'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'border-primary-light bg-primary-light'
                            : 'border-dark-500'
                        }`}>
                          {isChecked && <Check size={10} className="text-dark-950" />}
                        </div>
                        <span className={`text-sm ${
                          isExisting
                            ? 'text-dark-400 line-through'
                            : isChecked
                              ? 'text-primary-light'
                              : 'text-dark-300'
                        }`}>
                          {item}
                        </span>
                        {isExisting && (
                          <span className="text-xs text-dark-500 ml-auto">já adicionado</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-between">
          <p className="text-sm text-dark-400">
            {newSelectedCount > 0
              ? `${newSelectedCount} novo${newSelectedCount !== 1 ? 's' : ''} item${newSelectedCount !== 1 ? 's' : ''} selecionado${newSelectedCount !== 1 ? 's' : ''}`
              : 'Nenhum item novo selecionado'
            }
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={newSelectedCount === 0}
              className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              Adicionar ({newSelectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
