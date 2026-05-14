export const USERS = {
  'ruan@s4s.com': { id: 0, name: 'Ruan', role: 'Admin', passwordHash: '7a3a9a98a4771201d35b7937bdaa8d16:57cca60b0e6aafc171e95a8be7e5e98909606c34b0ece7761081de284b57589033eed3f484b4a1b77da1ab88be3e43248eb787a08cc7045ae8b211d99189738a', canDragDrop: true },
  'ana@s4s.com': { id: 1, name: 'Ana', role: 'Psicóloga', passwordHash: 'be42a6c82b8c545337ba9851912a8af8:b7958152dd81eb78695cc4294e91bf6fe95e2d0f952bdc086f52b167d2e0eea14be4dd8bf223d8b0a91a9112755be62669339bdf92ca254d5aeb18484f1bed07', canDragDrop: false },
  'carol@s4s.com': { id: 2, name: 'Carol', role: 'Psicóloga', passwordHash: '6ec0487ef0c65c22cf3861269d6e2335:6751931db67c873ca02156840034a7613f1ab60cdff527f14a786f7b2dec8a7c1ded99e95f7364f97c5b6a823f661ba6f79a252bb10325256fdcb2e90c4e0427', canDragDrop: false },
  'beatriz@s4s.com': { id: 3, name: 'Beatriz', role: 'Pedagoga', passwordHash: 'f14788a0f5847f6ffaf62b7a70697420:59fd3c23f68d98b800e30862afc5a4af0683a967798f52095a9f216b1e2aaf82cf945d2dacc3e35ed2f2d0774cd256e6088f6150c7392bab5e93e10228d12a35', canDragDrop: false },
  'jessica@s4s.com': { id: 4, name: 'Jessica', role: 'Pedagoga', passwordHash: '59d637799928581a6786ea1e07b0e8ce:d478f746a9dc19d30e8eafcb5e2c248eed8e4bfd1fc987f8e4fdcb523ee9d9ffea5356419754336d87bd562618715ee606e1061e02e0a40f97c1221a64b4cfdb', canDragDrop: false },
  'gabi@s4s.com': { id: 5, name: 'Gabi', role: 'Pedagoga', passwordHash: '4560532f1768259429d55da6e7596cca:5faee5e5b1212f736cb53a53b05b37043cf46818cf4012eae540640458a0435fe631648e8142f92971910dbddc34c73920fb0356e45565a977307ae2f9e999b4', canDragDrop: false },
  'tecmise@s4s.com': { id: 6, name: 'Tecmise', role: 'Visualização', passwordHash: 'cef87b6f891005043f60479e53f04dec:65b9a1e72e5310e974f8fd8828fc9e8bd57c0034213d98c6a169a58ca762ef8a9970518d07eb31cde6325920f5a532df6abaceb2d2764ca03c7a86b0466b3eca', canDragDrop: false, viewOnly: true }
}

export const STATUSES = [
  { value: 'sem-status', label: 'Sem status', color: 'bg-dark-500' },
  { value: 'recebido', label: 'Recebido', color: 'bg-blue-500' },
  { value: 'em-analise', label: 'Em análise', color: 'bg-yellow-500' },
  { value: 'aguardando-escola', label: 'Aguardando escola', color: 'bg-purple-500' },
  { value: 'reprocessando', label: 'Processamento', color: 'bg-indigo-500' },
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
