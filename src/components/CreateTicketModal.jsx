import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'

export default function CreateTicketModal({ onClose }) {
  const { addTicket } = useTicketsStore()
  const { user } = useAuthStore()
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  
  const [formData, setFormData] = useState({
    school: '',
    schoolCustom: '',
    classroom: '',
    period: 'Matutino',
    device: '',
    problemType: '',
    description: '',
    priority: 'media'
  })
  
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const schools = ['Escola Municipal A', 'Escola Estadual B', 'Escola Municipal C', 'Escola Privada D']
  const periods = ['Matutino', 'Vespertino', 'Integral']
  const problemLocations = [
    'Sem dados no relatório',
    'Gráfico juntos',
    'Sem videos na AWS',
    'Cadastro de escola/turmas',
    'Processar imagens',
    'Criação de acesso S4S'
  ]
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (files) => {
    const fileArray = Array.from(files || [])
    fileArray.slice(0, 5 - images.length).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          preview: event.target.result,
          type: file.type
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleImageUpload(e.dataTransfer.files)
  }

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const requiredFields = [
      { key: 'schoolCustom', label: 'Escola' },
      { key: 'classroom', label: 'Turma' },
      { key: 'device', label: 'Device' },
      { key: 'description', label: 'Descrição' }
    ]

    const missingFields = requiredFields
      .filter(({ key }) => !String(formData[key] || '').trim())
      .map(({ label }) => label)

    if (missingFields.length > 0) {
      alert(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`)
      return
    }

    setLoading(true)

    try {
      await addTicket({
        school: formData.schoolCustom.trim(),
        classroom: formData.classroom.trim(),
        device: String(formData.device).trim(),
        period: formData.period,
        problemType: formData.problemType,
        description: formData.description.trim(),
        priority: formData.priority,
        attachments: images.map(img => ({
          name: img.name,
          preview: img.preview,
          type: img.type
        }))
      })

      onClose()
    } catch (error) {
      alert(error.message || 'Não foi possível criar o chamado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-700 animate-slideInUp">
        {/* Header */}
        <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-dark-100">Criar Novo Chamado</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-dark-300" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grid de campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* School - Input apenas */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Escola *
              </label>
              <input
                type="text"
                name="schoolCustom"
                value={formData.schoolCustom}
                onChange={handleChange}
                placeholder="Digite o nome da escola"
                className="input-base w-full"
                required
              />
            </div>

            {/* Classroom */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Turma *
              </label>
              <input
                type="text"
                name="classroom"
                value={formData.classroom}
                onChange={handleChange}
                placeholder="Ex: 5º B, 3º D"
                className="input-base w-full"
                required
              />
            </div>

            {/* Device - Números */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Device *
              </label>
              <input
                type="number"
                name="device"
                value={formData.device}
                onChange={handleChange}
                placeholder="Ex: 001, 042"
                className="input-base w-full"
                required
              />
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Período
              </label>
              <select
                name="period"
                value={formData.period}
                onChange={handleChange}
                className="input-base w-full"
              >
                {periods.map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>

            {/* Local do problema */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Local do problema
              </label>
              <select
                name="problemType"
                value={formData.problemType}
                onChange={handleChange}
                className="input-base w-full"
              >
                <option value="" disabled>Escolha o local do problema</option>
                {problemLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Responsible - Auto-filled, disabled */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Responsável
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="input-base w-full bg-dark-750 opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-dark-500 mt-1">📌 Atribuído automaticamente</p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Prioridade
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-base w-full"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Descrição *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva o problema em detalhes..."
              rows="4"
              className="input-base w-full resize-none"
              required
            />
          </div>

          {/* Image upload with drag and drop */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-3">
              Anexar Imagens (até 5)
            </label>
            
            {/* Upload area with drag and drop */}
            <div
              ref={dropZoneRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                w-full border-2 border-dashed rounded-lg p-6 transition-all text-center mb-3 group cursor-pointer
                ${dragActive 
                  ? 'border-primary-light bg-primary-light/10' 
                  : 'border-primary-light/30 hover:border-primary-light/50'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload size={24} className={dragActive ? 'text-primary-light' : 'text-primary-light/60 group-hover:text-primary-light'} />
                <div>
                  <p className={`text-sm font-medium ${dragActive ? 'text-primary-light' : 'text-primary-light/60 group-hover:text-primary-light'}`}>
                    {dragActive ? 'Solte para fazer upload' : 'Clique para fazer upload'}
                  </p>
                  <p className="text-xs text-dark-400">ou arraste imagens aqui</p>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
            />

            {/* Image previews */}
            {images.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-dark-400">{images.length} imagem{images.length !== 1 ? 's' : ''} anexada{images.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map(img => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded-lg border border-dark-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-xs text-dark-400 mt-1 truncate text-center">{img.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Criando...' : 'Criar Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
