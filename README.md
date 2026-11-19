# FleetControl

Sistema web acadêmico para gestão de frota e acompanhamento de manutenções de veículos. O projeto reúne uma interface web, uma API REST e um banco de dados MySQL.

> Este repositório apresenta o código para fins de estudo e portfólio. Antes de publicar, confira se os registros de demonstração e os materiais utilizados podem ser compartilhados.

## Funcionalidades

- Login e gerenciamento de usuários;
- Cadastro, consulta e edição de viaturas;
- Acompanhamento de quilometragem e situação das viaturas;
- Cadastro e consulta de manutenções;
- Atualização de status das manutenções;
- Consulta de tipos de manutenção;
- Acompanhamento de manutenções preventivas;
- Dashboard com indicadores da frota.

A disponibilidade de cada operação depende da configuração do banco de dados e da versão atual do código.

## Tecnologias

- **Frontend:** HTML5, CSS3 e JavaScript;
- **Backend:** Node.js e Express;
- **API:** endpoints REST;
- **Banco de dados:** MySQL;
- **Acesso ao banco:** mysql2;
- **Autenticação:** JWT;
- **Configuração de ambiente:** dotenv.

O `localStorage` mantém dados da sessão e apoia o funcionamento da interface. Ele não substitui o MySQL como fonte persistente dos dados.

## Estrutura do projeto

```text
FleetControl/
├── api/
│   ├── database.sql
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── assets/
├── css/
├── data/
├── js/
│   ├── core/
│   └── services/
├── pages/
├── .gitignore
├── index.html
└── README.md
```

## Requisitos

- Node.js e npm;
- MySQL;
- Navegador atualizado;
- Visual Studio Code e uma extensão de servidor local, como Live Server (recomendados).

## Configuração e execução local

### 1. Preparar o banco de dados

1. Inicie o serviço do MySQL.
2. Importe `api/database.sql` pelo phpMyAdmin ou pelo cliente MySQL. O script cria o banco `fleetcontrol`, as tabelas e os tipos de manutenção iniciais.

Exemplo no Prompt de Comando do Windows, a partir da raiz do projeto:

```bash
C:\xampp\mysql\bin\mysql.exe -u root < api/database.sql
```

Se seu MySQL utilizar outro usuário ou senha, ajuste o comando e as variáveis de ambiente na próxima etapa.

### 2. Configurar as variáveis de ambiente

1. Faça uma cópia de `api/.env.example` com o nome `api/.env`.
2. Abra `api/.env` e preencha os dados de conexão do seu MySQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`).
3. Gere uma chave JWT aleatória e coloque o resultado em `JWT_SECRET`. Você pode gerar uma chave com Node.js usando:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

4. Para um banco novo, preencha também `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`. A senha do administrador inicial precisa ter pelo menos 12 caracteres.

**Não publique nem envie o arquivo `api/.env`.** Ele contém configurações privadas. O `.gitignore` já está preparado para ignorar esse arquivo e manter somente `api/.env.example` no repositório.

### 3. Instalar as dependências

Abra um terminal na raiz do projeto e execute:

```bash
cd api
npm install
```

### 4. Iniciar a API

Ainda dentro da pasta `api`, execute:

```bash
npm start
```

A API utiliza a porta `3000`. Para verificar a sintaxe do servidor, execute `npm run check`.

### 5. Abrir o frontend

Abra a pasta raiz do projeto no VS Code e inicie `index.html` com o Live Server ou outro servidor HTTP local. A configuração atual do frontend aponta para `http://localhost:3000/api`.

### 6. Criar o primeiro administrador

A API não contém mais uma senha padrão fixa no código. Em um banco novo, o primeiro administrador só será criado quando `ADMIN_EMAIL` e `ADMIN_PASSWORD` estiverem preenchidos em `api/.env`, e a senha tiver pelo menos 12 caracteres.

Se o e-mail configurado já existir na tabela `usuario`, a API não cria outro usuário nem altera a senha existente. Contas já cadastradas no banco são preservadas.

Se essas variáveis não estiverem configuradas, a API ainda poderá iniciar, mas não criará automaticamente um administrador.

### 7. Verificar a API e o banco

Com a API em execução, acesse:

- `http://localhost:3000/` — verifica se a API responde;
- `http://localhost:3000/api/teste-banco` — testa a conexão com o MySQL.

Se houver erro, confira se o MySQL está iniciado, se o banco `fleetcontrol` existe e se os dados em `api/.env` estão corretos.

## Rotas principais identificadas

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/` | Verificar se a API responde |
| GET | `/api/teste-banco` | Testar a conexão com o MySQL |
| POST | `/api/login` | Autenticar usuário e emitir token |
| GET / POST | `/api/usuarios` | Consultar e cadastrar usuários |
| PUT | `/api/usuarios/:id` | Atualizar usuário |
| PUT | `/api/usuarios/:id/status` | Atualizar status do usuário |
| GET / POST | `/api/viaturas` | Consultar e cadastrar viaturas |
| PUT | `/api/viaturas/:id` | Atualizar viatura |
| GET | `/api/viaturas/identificacao/:identificacao` | Consultar viatura pela identificação |
| PUT | `/api/viaturas/:id/quilometragem` | Atualizar quilometragem |
| GET | `/api/tipos-manutencao` | Consultar tipos de manutenção |
| GET / POST | `/api/manutencoes` | Consultar e cadastrar manutenções |
| PUT | `/api/manutencoes/:id/status` | Atualizar status da manutenção |

A tabela resume rotas identificadas no código analisado. Ela não representa uma garantia de prontidão para produção.

## Segurança e limitações conhecidas

- Não coloque senhas, tokens, chaves JWT ou arquivos `.env` no GitHub.
- Não inclua `node_modules`; as dependências são instaladas com `npm install`.
- O `package-lock.json` deve permanecer no repositório para registrar as versões das dependências.
- A autenticação JWT e as permissões devem ser revisadas e testadas em conjunto com as rotas protegidas.
- A API usa uma lista de origens permitidas em `ALLOWED_ORIGINS`; configure somente o domínio exato do frontend.
- Há limite básico de tentativas de login em memória; para produção com múltiplas instâncias, use um limitador compartilhado.
- A API utiliza a porta `3000` e o frontend está configurado para uma API local. Uma implantação exige configuração própria de ambiente e endereço.
- O projeto não possui uma suíte automatizada de testes configurada. `npm run check` verifica somente a sintaxe do arquivo `server.js`.

O FleetControl é um projeto acadêmico e não deve ser considerado pronto para produção sem uma revisão completa de segurança, autorização, configuração de ambiente e testes.

Consulte também [`SECURITY.md`](SECURITY.md) para os limites e cuidados de segurança.

## Publicação no GitHub

Antes de criar um repositório público:

1. Revise os arquivos de `data/` e confirme que não contêm dados pessoais, operacionais ou de terceiros.
2. Confira se `api/.env` não está sendo enviado.
3. Confira se `node_modules/` não está sendo enviado.
4. Revise imagens, logotipos e outros materiais para confirmar que você pode publicá-los.
5. Decida se deseja adicionar uma licença ao projeto. Um repositório público sem arquivo de licença pode ser visualizado, mas não concede automaticamente permissão para reutilização do código.

Na pasta raiz do projeto, os comandos básicos para iniciar o versionamento são:

```bash
git init
git status
git add .
git status
git commit -m "Preparação inicial do FleetControl"
```

Antes de executar `git add .`, confira a saída de `git status` e verifique se não há arquivos privados. Depois, crie um repositório no GitHub e siga as instruções da própria plataforma para conectar o repositório local e enviar o primeiro commit.
