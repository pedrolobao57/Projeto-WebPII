# Gestor de Estacionamento — MySQL + Faker

Este projecto contém:

- `sql/schema.sql`: criação da base de dados MySQL.
- `src/seed.js`: geração de dados fictícios usando `@faker-js/faker`.
- `.env.example`: exemplo de configuração.
- `sql/test_queries.sql`: queries simples para validar os dados gerados.

## 1. Criar a base de dados

No terminal:

```bash
mysql -u root -p < sql/schema.sql
```

Se estiveres a usar password vazia no MySQL local, podes usar:

```bash
mysql -u root < sql/schema.sql
```

## 2. Instalar dependências

```bash
npm install --prefix backend
npm install --prefix frontend
```

## 3. Configurar variáveis de ambiente

Copia o ficheiro `.env.example` para `.env`:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Depois ajusta os valores de ligação ao MySQL.

## 4. Gerar dados

```bash
npm run seed:b
```

## 5. Validar dados

```bash
mysql -u root -p gestor_estacionamento < sql/test_queries.sql
```

## Notas

- O script `seed.js` limpa as tabelas antes de inserir dados se `RESET_DATABASE=true`.
- As passwords geradas são apenas valores fictícios.
- Estes dados servem para testes, demonstrações e desenvolvimento local.
