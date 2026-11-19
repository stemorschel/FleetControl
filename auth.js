const Auth = {

    async login(usuario, senha) {

        try {

            const resposta =
                await fetch(
                    `${CONFIG.api.baseUrl}/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            usuario: usuario,
                            senha: senha
                        })
                    }
                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                return {
                    sucesso: false,
                    mensagem:
                        resultado.mensagem ||
                        "Usuário ou senha inválidos."
                };

            }


            if (!resultado.sucesso) {

                return {
                    sucesso: false,
                    mensagem:
                        resultado.mensagem ||
                        "Usuário ou senha inválidos."
                };

            }


            const sessao = {

                usuarioId:
                    resultado.usuario.usuarioId,

                nome:
                    resultado.usuario.nome,

                usuario:
                    resultado.usuario.usuario,

                perfil:
                    resultado.usuario.perfil,

                token: resultado.token,

                loginEm:
                    new Date().toISOString()

            };


            Storage.salvar(
                CONFIG.storage.sessao,
                sessao
            );


            return {
                sucesso: true,
                usuario: sessao
            };


        } catch (erro) {

            console.error(
                "Erro ao conectar com a API:",
                erro
            );


            return {
                sucesso: false,
                mensagem:
                    "Não foi possível conectar ao servidor."
            };

        }

    },


    logout() {

        Storage.remover(
            CONFIG.storage.sessao
        );


        window.location.href =
            "../index.html";

    },


    obterSessao() {

        return Storage.buscar(
            CONFIG.storage.sessao,
            null
        );

    },


    cabecalhosAutenticados() {

        const sessao = this.obterSessao();

        if (!sessao || !sessao.token) {
            return {};
        }

        return {
            Authorization: `Bearer ${sessao.token}`
        };

    },


    estaAutenticado() {

        return (
            this.obterSessao()
            !== null
        );

    },


    exigirLogin() {

        if (!this.estaAutenticado()) {

            window.location.href =
                "../index.html";

            return false;

        }


        return true;

    },


    exigirPermissao(acao) {

        const sessao =
            this.obterSessao();


        if (!sessao) {

            window.location.href =
                "../index.html";

            return false;

        }


        if (
            !Permissions.pode(
                acao,
                sessao.perfil
            )
        ) {

            alert(
                "Você não possui permissão para acessar esta área."
            );

            window.history.back();

            return false;

        }


        return true;

    }

};