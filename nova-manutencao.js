Auth.exigirPermissao(
    "registrarManutencao"
);


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const sessao =
            Auth.obterSessao();


        if (sessao) {

            const usuarioLogado =
                document.getElementById(
                    "usuarioLogado"
                );


            if (usuarioLogado) {

                usuarioLogado.textContent =
                    `${sessao.nome} (${sessao.perfil})`;

            }

        }


        /*
         * INICIALIZAÇÃO
         *
         * A API precisa terminar de carregar
         * os dados antes de preencher os campos.
         */

        await ViaturaService.inicializar();

        await ManutencaoService.inicializar();


        carregarViaturas();

        carregarTipos();

        await carregarResponsaveis();


        const viaturaId =
            document.getElementById(
                "viaturaId"
            );


        if (viaturaId) {

            viaturaId.addEventListener(
                "change",
                atualizarQuilometragem
            );

        }


        const form =
            document.getElementById(
                "formManutencao"
            );


        if (form) {

            form.addEventListener(
                "submit",
                registrarManutencao
            );

        }


        const btnCancelar =
            document.getElementById(
                "btnCancelar"
            );


        if (btnCancelar) {

            btnCancelar.addEventListener(
                "click",
                voltarParaLista
            );

        }


        const btnVoltar =
            document.getElementById(
                "btnVoltar"
            );


        if (btnVoltar) {

            btnVoltar.addEventListener(
                "click",
                voltarParaLista
            );

        }

    }
);


/*
 * CARREGAR VIATURAS
 */

function carregarViaturas() {

    const select =
        document.getElementById(
            "viaturaId"
        );


    if (!select) {
        return;
    }


    const viaturas =
        ViaturaService
            .listar()
            .filter(
                viatura =>
                    viatura.ativa !== false
            );


    select.innerHTML =
        '<option value="">Selecione a viatura</option>';


    viaturas.forEach(
        viatura => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                viatura.id;


            option.textContent =
                `${viatura.identificacao} - ${viatura.placa}`;


            select.appendChild(
                option
            );

        }
    );

}


/*
 * CARREGAR TIPOS
 */

function carregarTipos() {

    const select =
        document.getElementById(
            "tipoId"
        );


    if (!select) {
        return;
    }


    const tipos =
        ManutencaoService
            .listarTipos()
            .filter(
                tipo =>
                    tipo.ativo
            );


    select.innerHTML =
        '<option value="">Selecione o tipo</option>';


    tipos.forEach(
        tipo => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                tipo.id;


            option.textContent =
                tipo.nome;


            select.appendChild(
                option
            );

        }
    );

}


/*
 * CARREGAR RESPONSÁVEIS
 *
 * Os usuários agora são carregados
 * diretamente da API/MySQL.
 */

async function carregarResponsaveis() {

    const select =
        document.getElementById(
            "responsavelId"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">Carregando responsáveis...</option>';


    try {

        const resposta =
    await fetch(
        `${CONFIG.api.baseUrl}/usuarios`,
        {
            headers: Auth.cabecalhosAutenticados()
        }
    );


        const resultado =
            await resposta.json();


        if (
            !resposta.ok ||
            !resultado.sucesso
        ) {

            throw new Error(
                resultado.mensagem ||
                "Não foi possível carregar os usuários."
            );

        }


        const usuarios =
            resultado.usuarios || [];


        select.innerHTML =
            '<option value="">Selecione o responsável</option>';


        usuarios
            .filter(
                usuario =>
                    Boolean(
                        Number(
                            usuario.ativo
                        )
                    )
            )
            .forEach(
                usuario => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    /*
                     * A API utiliza o ID numérico
                     * do banco para o responsável.
                     *
                     * O service de manutenção converte
                     * depois para o formato esperado
                     * pelo frontend.
                     */

                    option.value =
                        `USR${String(
                            usuario.id
                        ).padStart(
                            3,
                            "0"
                        )}`;


                    option.textContent =
                        usuario.nome;


                    select.appendChild(
                        option
                    );

                }
            );


        if (
            usuarios.length === 0
        ) {

            select.innerHTML =
                '<option value="">Nenhum usuário ativo encontrado</option>';

        }

    } catch (erro) {

        console.error(
            "Erro ao carregar responsáveis:",
            erro
        );


        select.innerHTML =
            '<option value="">Erro ao carregar responsáveis</option>';

    }

}


/*
 * ATUALIZAR QUILOMETRAGEM
 */

function atualizarQuilometragem() {

    const viaturaId =
        document.getElementById(
            "viaturaId"
        ).value;


    const campoKm =
        document.getElementById(
            "quilometragem"
        );


    if (!campoKm) {
        return;
    }


    if (!viaturaId) {

        campoKm.value =
            "";

        return;

    }


    const viatura =
        ViaturaService.buscarPorId(
            viaturaId
        );


    if (viatura) {

        campoKm.value =
            viatura.quilometragem;

    }

}


/*
 * REGISTRAR MANUTENÇÃO
 */

async function registrarManutencao(
    event
) {

    event.preventDefault();


    const viaturaId =
        document.getElementById(
            "viaturaId"
        ).value;


    const tipoId =
        document.getElementById(
            "tipoId"
        ).value;


    const natureza =
        document.getElementById(
            "natureza"
        ).value;


    const dataAgendada =
        document.getElementById(
            "dataAgendada"
        ).value;


    const quilometragem =
        document.getElementById(
            "quilometragem"
        ).value;


    const responsavelId =
        document.getElementById(
            "responsavelId"
        ).value;


    const servico =
        document.getElementById(
            "servico"
        ).value;


    const problema =
        document.getElementById(
            "problema"
        ).value;


    const pecas =
        document.getElementById(
            "pecas"
        ).value;


    const observacoes =
        document.getElementById(
            "observacoes"
        ).value;


    const mensagem =
        document.getElementById(
            "mensagem"
        );


    /*
     * A função adicionar é assíncrona
     * porque envia os dados para a API.
     */

    try {

        const resultado =
            await ManutencaoService.adicionar({

                viaturaId,

                tipoId,

                natureza,

                dataAgendada,

                quilometragem,

                responsavelId,

                servico,

                problema,

                pecas,

                observacoes,

                status:
                    "agendada"

            });


        if (!resultado.sucesso) {

            if (mensagem) {

                mensagem.textContent =
                    resultado.mensagem;

                mensagem.className =
                    "mensagem-formulario erro";

            }

            return;

        }


        if (mensagem) {

            mensagem.textContent =
                "Manutenção registrada com sucesso.";

            mensagem.className =
                "mensagem-formulario sucesso";

        }


        setTimeout(
            () => {

                window.location.href =
                    "manutencoes.html";

            },
            500
        );


    } catch (erro) {

        console.error(
            "Erro ao registrar manutenção:",
            erro
        );


        if (mensagem) {

            mensagem.textContent =
                erro.message ||
                "Não foi possível registrar a manutenção.";

            mensagem.className =
                "mensagem-formulario erro";

        }

    }

}


/*
 * VOLTAR PARA LISTA
 */

function voltarParaLista() {

    window.location.href =
        "manutencoes.html";

}