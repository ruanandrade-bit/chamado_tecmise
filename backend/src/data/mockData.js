export const USERS = {
  'ruan@s4s.com': { id: 0, name: 'Ruan', role: 'Admin', password: '123456', canDragDrop: true },
  'ana@s4s.com': { id: 1, name: 'Ana', role: 'Psicóloga', password: '123456', canDragDrop: false },
  'carol@s4s.com': { id: 2, name: 'Carol', role: 'Psicóloga', password: '123456', canDragDrop: false },
  'beatriz@s4s.com': { id: 3, name: 'Beatriz', role: 'Pedagoga', password: '123456', canDragDrop: false },
  'jessica@s4s.com': { id: 4, name: 'Jessica', role: 'Pedagoga', password: '123456', canDragDrop: false },
  'gabi@s4s.com': { id: 5, name: 'Gabi', role: 'Pedagoga', password: '123456', canDragDrop: false },
  'tecmise@s4s.com': { id: 6, name: 'Tecmise', role: 'Visualização', password: '123456', canDragDrop: false, viewOnly: true }
}

export const STATUSES = [
  { value: 'sem-status', label: 'Sem status', color: 'bg-dark-500' },
  { value: 'recebido', label: 'Recebido', color: 'bg-blue-500' },
  { value: 'em-analise', label: 'Em análise', color: 'bg-yellow-500' },
  { value: 'aguardando-escola', label: 'Aguardando escola', color: 'bg-purple-500' },
  { value: 'reprocessando', label: 'Reprocessando', color: 'bg-indigo-500' },
  { value: 'em-resolucao', label: 'Em resolução', color: 'bg-orange-500' },
  { value: 'resolvido', label: 'Resolvido', color: 'bg-primary-light' }
]

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const TICKETS = [
  {
    id: 'S4S-001',
    school: 'Escola Municipal A',
    classroom: '5º B',
    device: '001',
    period: 'Matutino',
    problemType: 'Sistema não carrega',
    description: 'O sistema de inscrições não está carregando para os alunos',
    responsible: 'Ana',
    priority: 'alta',
    status: 'em-analise',
    createdAt: new Date(now - 2 * day).toISOString(),
    attachments: [],
    checklist: [
      { id: 1, title: 'Verificar servidor', completed: true },
      { id: 2, title: 'Contatar ISP', completed: false }
    ],
    notes: 'Problema pode ser de conectividade',
    history: [
      { action: 'Criado', by: 'Beatriz', date: new Date(now - 2 * day).toISOString() }
    ]
  },
  {
    id: 'S4S-002',
    school: 'Escola Estadual B',
    classroom: '3º D',
    device: '002',
    period: 'Vespertino',
    problemType: 'Dúvida de aluno',
    description: 'Aluno não consegue acessar portal com dados corretos',
    responsible: 'Jessica',
    priority: 'media',
    status: 'sem-status',
    createdAt: new Date(now).toISOString(),
    attachments: [],
    checklist: [
      { id: 1, title: 'Validar dados do aluno', completed: false },
      { id: 2, title: 'Resetar senha', completed: false }
    ],
    notes: '',
    history: [
      { action: 'Criado', by: 'Carol', date: new Date(now).toISOString() }
    ]
  }
]
