# Segurança e publicação — FleetControl

## Escopo
Esta versão aplica proteções básicas para desenvolvimento e publicação do código: CORS por allowlist, cabeçalhos HTTP, limite de corpo JSON e limitação simples de tentativas de login. Isso **não é uma certificação de segurança** e não torna o sistema 100% seguro.

## Antes de publicar no GitHub
- Nunca envie `api/.env`, dumps de banco reais, credenciais, tokens ou dados pessoais.
- Mantenha somente `api/.env.example` no repositório.
- Revise também o histórico Git: apagar um segredo do último commit não o remove de commits anteriores.
- Revise `data/`, capturas de tela, imagens e exemplos para garantir que sejam dados fictícios e materiais que você tem direito de publicar.
- Se alguma credencial já foi commitada, revogue/rotacione-a; não basta apagar o arquivo.

## Configuração local
Copie `api/.env.example` para `api/.env` e configure credenciais próprias. `ALLOWED_ORIGINS` deve conter apenas as origens reais do frontend, separadas por vírgula. Não use `*`.

## Limitações importantes
- O limitador de login é em memória: reiniciar a API zera os contadores e múltiplas instâncias não compartilham os limites. Para produção, use um limitador distribuído e monitore tentativas.
- O frontend usa `localStorage` para a sessão. Um XSS pode expor tokens; a prevenção exige auditoria de todos os pontos que montam HTML dinâmico e uma estratégia de sessão adequada.
- Ainda é necessária uma revisão manual de autorização em todas as rotas, validação de entradas, política de senhas legadas, dependências (`npm audit`), HTTPS, backups e configuração do banco com usuário de privilégio mínimo.
- A configuração padrão escuta em `127.0.0.1`. Não exponha a API diretamente à internet sem configuração e revisão próprias do ambiente de hospedagem.

## Uso
Este repositório é acadêmico/portfólio. A publicação do código não equivale à implantação segura do serviço.
