document.addEventListener("DOMContentLoaded", () => {

    if (!Auth.exigirPermissao("usuarios")) {
        return;
    }


    const sessao =
        Auth.obterSessao();


    const usuarioNome =
        document.getElementById(
            "usuarioNome"
        );

    const usuarioPerfil =
        document.getElementById(
            "usuarioPerfil"
        );


    if (sessao) {

        usuarioNome.textContent =
            sessao.nome;

        usuarioPerfil.textContent =
            `Perfil: ${sessao.perfil}`;

    }


    const btnVoltar =
        document.getElementById(
            "btnVoltar"
        );


    btnVoltar.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );


    const busca =
        document.getElementById(
            "busca"
        );

    const filtroPerfil =
        document.getElementById(
            "filtroPerfil"
        );

    const filtroStatus =
        document.getElementById(
            "filtroStatus"
        );


    const btnNovoUsuario =
        document.getElementById(
            "btnNovoUsuario"
        );

    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );


    const formulario =
        document.getElementById(
            "formularioUsuario"
        );

    const usuarioForm =
        document.getElementById(
            "usuarioForm"
        );


    const API_URL = CONFIG.api.baseUrl;


    let usuarios =
        [];


    async function carregarUsuarios() {

        try {

            const resposta =
    await fetch(
        `${API_URL}/usuarios`,
        {
            headers: Auth.cabecalhosAutenticados()
        }
    );


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.erro ||
                    "Não foi possível carregar os usuários."
                );

            }


            usuarios =
                dados.usuarios.map(
                usuario => ({
            id:
                usuario.id,

            nome:
                usuario.nome,

            usuario:
                usuario.usuario,

            perfil:
                usuario.perfil,

            ativo:
                Boolean(
                    usuario.ativo
                ),

            dataCadastro:
                usuario.data_cadastro

                        })
                );


            renderizar();

        } catch (erro) {

            console.error(
                "Erro ao carregar usuários:",
                erro
            );


            const tabela =
                document.getElementById(
                    "tabelaUsuarios"
                );

            const estadoVazio =
                document.getElementById(
                    "estadoVazio"
                );


            tabela.innerHTML = "";


            estadoVazio.hidden =
                false;


            estadoVazio.textContent =
                "Não foi possível carregar os usuários.";


            document.getElementById(
                "contadorUsuarios"
            ).textContent =
                "0 usuário(s)";

        }

    }


    function renderizar() {

        const termo =
            busca.value
                .trim()
                .toLowerCase();


        const perfil =
            filtroPerfil.value;


        const status =
            filtroStatus.value;


        const filtrados =
            usuarios.filter(
                usuario => {

                    const nome =
                        String(
                            usuario.nome || ""
                        ).toLowerCase();


                    const login =
                        String(
                            usuario.usuario || ""
                        ).toLowerCase();


                    const correspondeBusca =
                        !termo ||
                        nome.includes(
                            termo
                        ) ||
                        login.includes(
                            termo
                        );


                    const correspondePerfil =
                        !perfil ||
                        usuario.perfil ===
                            perfil;


                    const correspondeStatus =
                        !status ||
                        (
                            status === "ativo" &&
                            usuario.ativo === true
                        ) ||
                        (
                            status === "inativo" &&
                            usuario.ativo === false
                        );


                    return (
                        correspondeBusca &&
                        correspondePerfil &&
                        correspondeStatus
                    );

                }
            );


        const tabela =
            document.getElementById(
                "tabelaUsuarios"
            );


        const estadoVazio =
            document.getElementById(
                "estadoVazio"
            );


        tabela.innerHTML = "";


        filtrados.forEach(
            usuario => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                const situacao =
                    usuario.ativo
                        ? "Ativo"
                        : "Inativo";


                const classeSituacao =
                    usuario.ativo
                        ? "status-ativo"
                        : "status-inativo";


                tr.innerHTML = `

                    <td>
                        ${usuario.nome}
                    </td>

                    <td>
                        ${usuario.usuario}
                    </td>

                    <td>
                        ${formatarPerfil(
                            usuario.perfil
                        )}
                    </td>

                    <td>

                        <span
                            class="status-usuario ${classeSituacao}"
                        >
                            ${situacao}
                        </span>

                    </td>

                    <td>

                        <div class="acoes-tabela">

                            <button
                                type="button"
                                data-editar="${usuario.id}"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                data-status="${usuario.id}"
                            >
                                ${
                                    usuario.ativo
                                        ? "Inativar"
                                        : "Ativar"
                                }
                            </button>

                        </div>

                    </td>

                `;


                tabela.appendChild(
                    tr
                );

            }
        );


        estadoVazio.hidden =
            filtrados.length !== 0;


        document.getElementById(
            "contadorUsuarios"
        ).textContent =
            `${filtrados.length} usuário(s)`;


        adicionarEventosTabela();

    }


    function adicionarEventosTabela() {

        document
            .querySelectorAll(
                "[data-editar]"
            )
            .forEach(
                botao => {

                    botao.addEventListener(
                        "click",
                        () => {

                            editarUsuario(
                                Number(
                                    botao.dataset.editar
                                )
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                "[data-status]"
            )
            .forEach(
                botao => {

                    botao.addEventListener(
                        "click",
                        () => {

                            alterarStatus(
                                Number(
                                    botao.dataset.status
                                )
                            );

                        }
                    );

                }
            );

    }


    function editarUsuario(
        id
    ) {

        const usuario =
            usuarios.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!usuario) {
            return;
        }


        document.getElementById(
            "usuarioId"
        ).value =
            usuario.id;


        document.getElementById(
            "nome"
        ).value =
            usuario.nome;


        document.getElementById(
            "usuario"
        ).value =
            usuario.usuario;


        /*
         * A senha não é carregada do banco.
         *
         * Por segurança, a API não retorna
         * a senha do usuário.
         *
         * Se o campo ficar vazio durante a edição,
         * a senha atual será mantida.
         */
        document.getElementById(
            "senha"
        ).value = "";


        document.getElementById(
            "perfil"
        ).value =
            usuario.perfil;


        document.getElementById(
            "tituloFormulario"
        ).textContent =
            "Editar usuário";


        document.getElementById(
            "senha"
        ).required =
            false;


        formulario.hidden =
            false;


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    async function alterarStatus(
        id
    ) {

        const usuario =
            usuarios.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!usuario) {
            return;
        }


        if (
            Number(usuario.id) ===
            Number(sessao.usuarioId)
        ) {

            alert(
                "O usuário atualmente conectado não pode ser inativado."
            );

            return;

        }


        const novoStatus =
            !usuario.ativo;


        const mensagemConfirmacao =
            novoStatus
                ? "Deseja ativar este usuário?"
                : "Deseja inativar este usuário?";


        if (
            !confirm(
                mensagemConfirmacao
            )
        ) {
            return;
        }


        try {

            const resposta =
                await fetch(
                    `${API_URL}/usuarios/${id}/status`,
                    {
                        method: "PUT",

                        headers: {
    ...Auth.cabecalhosAutenticados(),
    "Content-Type": "application/json"
},

                        body:
                            JSON.stringify({
                                ativo:
                                    novoStatus
                            })
                    }
                );


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.erro ||
                    "Não foi possível alterar o status do usuário."
                );

            }


usuario.ativo = novoStatus;


            renderizar();

        } catch (erro) {

            console.error(
                "Erro ao alterar status:",
                erro
            );


            alert(
                erro.message ||
                "Não foi possível alterar o status do usuário."
            );

        }

    }


    btnNovoUsuario.addEventListener(
        "click",
        () => {

            formulario.hidden =
                false;

            usuarioForm.reset();


            document.getElementById(
                "usuarioId"
            ).value = "";


            document.getElementById(
                "tituloFormulario"
            ).textContent =
                "Novo usuário";


            document.getElementById(
                "senha"
            ).required =
                true;


            const mensagem =
                document.getElementById(
                    "mensagemUsuario"
                );


            mensagem.textContent = "";

            mensagem.className =
                "mensagem-formulario";

        }
    );


    btnCancelar.addEventListener(
        "click",
        () => {

            formulario.hidden =
                true;

            usuarioForm.reset();


            document.getElementById(
                "senha"
            ).required =
                true;


            const mensagem =
                document.getElementById(
                    "mensagemUsuario"
                );


            mensagem.textContent = "";

            mensagem.className =
                "mensagem-formulario";

        }
    );


    usuarioForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const id =
                document.getElementById(
                    "usuarioId"
                ).value;


            const nome =
                document.getElementById(
                    "nome"
                ).value.trim();


            const usuarioLogin =
                document.getElementById(
                    "usuario"
                ).value.trim();


            const senha =
                document.getElementById(
                    "senha"
                ).value;


            const perfil =
                document.getElementById(
                    "perfil"
                ).value;


            const mensagem =
                document.getElementById(
                    "mensagemUsuario"
                );


            mensagem.textContent = "";

            mensagem.className =
                "mensagem-formulario";


            /*
             * Nome, login e perfil são sempre obrigatórios.
             *
             * A senha é obrigatória somente para
             * novos usuários.
             */
            if (
                nome === "" ||
                usuarioLogin === "" ||
                perfil === "" ||
                (
                    !id &&
                    senha === ""
                )
            ) {

                mensagem.textContent =
                    !id && senha === ""
                        ? "Preencha todos os campos."
                        : "Preencha todos os campos obrigatórios.";

                mensagem.className =
                    "mensagem-formulario erro";

                return;

            }


            /*
             * Verificação visual para evitar uma
             * requisição desnecessária à API.
             */
            const loginDuplicado =
                usuarios.some(
                    item =>
                        String(
                            item.usuario || ""
                        ).toLowerCase() ===
                        usuarioLogin.toLowerCase() &&
                        Number(item.id) !==
                        Number(id)
                );


            if (loginDuplicado) {

                mensagem.textContent =
                    "Este nome de usuário já está cadastrado.";

                mensagem.className =
                    "mensagem-formulario erro";

                return;

            }


            const dadosUsuario = {

                nome:
                    nome,

                usuario:
                    usuarioLogin,

                perfil:
                    perfil

            };


            /*
             * Ao criar, envia a senha.
             *
             * Ao editar:
             * - senha preenchida = altera senha
             * - senha vazia = mantém senha atual
             */
            if (
                senha !== ""
            ) {

                dadosUsuario.senha =
                    senha;

            }


            try {

                let resposta;


                if (id) {

                    resposta =
                        await fetch(
                            `${API_URL}/usuarios/${id}`,
                            {
                                method: "PUT",

                                headers: {
    ...Auth.cabecalhosAutenticados(),
    "Content-Type": "application/json"
},

                                body:
                                    JSON.stringify(
                                        dadosUsuario
                                    )
                            }
                        );

                } else {

                    resposta =
                        await fetch(
                            `${API_URL}/usuarios`,
                            {
                                method: "POST",

                                headers: {
    ...Auth.cabecalhosAutenticados(),
    "Content-Type": "application/json"
},

                                body:
                                    JSON.stringify({
                                        ...dadosUsuario,
                                        senha:
                                            senha
                                    })
                            }
                        );

                }


                const dados =
                    await resposta.json();


                if (!resposta.ok) {

                    throw new Error(
                        dados.mensagem ||
                        dados.erro ||
                        "Não foi possível salvar o usuário."
                    );

                }


                mensagem.textContent =
                    id
                        ? "Usuário atualizado com sucesso."
                        : "Usuário criado com sucesso.";


                mensagem.className =
                    "mensagem-formulario sucesso";


                await carregarUsuarios();


                setTimeout(
                    () => {

                        formulario.hidden =
                            true;

                        usuarioForm.reset();

                        mensagem.textContent = "";

                        mensagem.className =
                            "mensagem-formulario";

                    },
                    500
                );

            } catch (erro) {

                console.error(
                    "Erro ao salvar usuário:",
                    erro
                );


                mensagem.textContent =
                    erro.message ||
                    "Não foi possível salvar o usuário.";

                mensagem.className =
                    "mensagem-formulario erro";

            }

        }
    );


    busca.addEventListener(
        "input",
        renderizar
    );


    filtroPerfil.addEventListener(
        "change",
        renderizar
    );


    filtroStatus.addEventListener(
        "change",
        renderizar
    );


    /*
     * Inicialização:
     * os usuários agora vêm diretamente
     * da API/MySQL.
     */
    carregarUsuarios();

});


function formatarPerfil(
    perfil
) {

    switch (perfil) {

        case "administrador":
            return "Administrador";

        case "gestor":
            return "Gestor";

        case "tecnico":
            return "Técnico";

        default:
            return perfil;

    }

}