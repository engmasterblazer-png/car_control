# 🚗 Fleet App — Gestão de Frota (estilo iOS)

Aplicação de gestão de frota construída com **Next.js 14 (App Router) + TypeScript
+ Tailwind CSS + Supabase**, seguindo os princípios de design das Human
Interface Guidelines da Apple (glassmorphism, cards agrupados, bottom sheets).

## 1. Pré-requisitos

- Node.js 18+
- Uma conta gratuita em [supabase.com](https://supabase.com)

## 2. Configurar o Supabase

1. Crie um novo projeto no [painel do Supabase](https://app.supabase.com).
2. Vá em **SQL Editor** e execute todo o conteúdo do arquivo `schema.sql`
   deste repositório. Isso cria as tabelas `vehicles` e `records`, as
   políticas de RLS, a trigger de atualização de KM e a view
   `vehicle_alerts` usada para calcular os alertas de troca de óleo.
3. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public key`

## 3. Configurar o projeto localmente

```bash
# instalar dependências
npm install

# copiar o arquivo de variáveis de ambiente
cp .env.local.example .env.local
```

Edite `.env.local` e cole as chaves copiadas do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=coloque-sua-anon-key-aqui
```

## 4. Rodar em desenvolvimento

```bash
npm run dev
```

Ig2oaHhxhJrrhf8d

Acesse [http://localhost:3000](http://localhost:3000). Você será redirecionado
para `/login`. Crie uma conta (o Supabase pode exigir confirmação por
e-mail, dependendo da configuração do projeto) e faça login.

## 5. Deploy na Vercel (plano gratuito)

1. Suba este projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Adicione as mesmas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) nas configurações do projeto na Vercel.
4. Clique em **Deploy**.

## 6. Estrutura de pastas

```
fleet-app/
├── package.json
├── tailwind.config.js
├── next.config.js
├── postcss.config.js
├── tsconfig.json
├── middleware.ts            # proteção de rotas (/dashboard e /login)
├── .env.local.example
├── schema.sql                # schema completo do Supabase (RLS + triggers + view)
├── lib/
│   ├── supabase.ts           # clientes Supabase (browser + server)
│   └── types.ts              # tipos TypeScript compartilhados
└── app/
    ├── layout.tsx
    ├── page.tsx               # redireciona /login ou /dashboard
    ├── globals.css
    ├── login/
    │   └── page.tsx           # login + cadastro
    └── dashboard/
        ├── page.tsx           # dashboard principal
        └── components/
            ├── VehicleCard.tsx
            ├── AddExpenseSheet.tsx
            ├── AddVehicleSheet.tsx   # (extra, necessário para cadastrar veículos)
            └── AlertBadge.tsx
```

## 7. Regras de negócio implementadas

- **Alertas de troca de óleo/revisão:** calculados na view SQL
  `vehicle_alerts`. Um veículo aparece como:
  - `vencido` → ≥ 10.000 km ou ≥ 365 dias desde a última troca de óleo;
  - `proximo` → ≥ 8.000 km (80%) ou ≥ 305 dias (80%);
  - `em_dia` → dentro dos limites;
  - `sem_registro` → nunca houve registro de troca de óleo.
- **Atualização automática de KM:** uma trigger (`trg_update_vehicle_km`)
  atualiza `vehicles.km_atual` sempre que um novo registro é inserido com
  KM maior que o atual — não é necessário fazer isso manualmente pelo
  front-end.
- **RLS ativo:** cada usuário só consegue ler/criar/editar/excluir seus
  próprios veículos e registros.
- **IPVA de Santa Catarina:** a view `vehicle_alerts` calcula a data da cota
   única pelo final da placa e exibe o status do vencimento no cartão do veículo.
