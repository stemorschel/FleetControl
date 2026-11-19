document.addEventListener("DOMContentLoaded", async () => {

    if (!Auth.exigirPermissao("visualizarManutencoes")) {
        return;
    }


    /*
     * INICIALIZAÇÃO
     */

    await ViaturaService.inicializar();

    await ManutencaoService.inicializar();


    /*
     * SESSÃO
     */

    const sessao =
        Auth.obterSessao();


    const usuarioLogado =
        document.getElementById("usuarioLogado");


    if (usuarioLogado && sessao) {

        usuarioLogado.textContent =
            `${sessao.nome} — ${sessao.perfil}`;

    }


    /*
     * ID DA MANUTENÇÃO
     */

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const manutencaoId =
        parametros.get("id");


    const conteudo =
        document.getElementById(
            "conteudoManutencao"
        );


    const estadoErro =
        document.getElementById(
            "estadoErro"
        );


    function mostrarErro(mensagem) {

        if (conteudo) {
            conteudo.style.display = "none";
        }

        if (estadoErro) {

            estadoErro.style.display =
                "block";

            const texto =
                estadoErro.querySelector("p");

            if (texto) {
                texto.textContent =
                    mensagem;
            }

        }

    }


    if (!manutencaoId) {

        mostrarErro(
            "Nenhuma manutenção foi informada."
        );

        return;
    }


    /*
     * BUSCAR MANUTENÇÃO
     */

    const manutencao =
        ManutencaoService.buscarPorId(
            manutencaoId
        );


    if (!manutencao) {

        mostrarErro(
            "A manutenção solicitada não foi encontrada."
        );

        return;
    }


    /*
     * BUSCAR VIATURA
     */

    const viatura =
        ViaturaService.buscarPorId(
            manutencao.viaturaId
        );


    /*
     * TIPOS
     */

    const tipos =
        ManutencaoService.listarTipos();


    const tipo =
        tipos.find(
            item =>
                item.id ===
                manutencao.tipoId
        );



    if (conteudo) {
        conteudo.style.display = "block";
    }


    /*
     * FORMATADORES
     */

    function formatarData(data) {

        if (!data) {
            return "Não informado";
        }


        const dataObj =
            new Date(data);


        if (
            isNaN(
                dataObj.getTime()
            )
        ) {
            return "Não informado";
        }


        return dataObj.toLocaleDateString(
            "pt-BR"
        );

    }


    function formatarKm(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return "Não informado";
        }


        return Number(valor)
            .toLocaleString("pt-BR")
            + " km";

    }


    function obterTextoStatus(status) {

        const textos = {

            agendada:
                "Agendada",

            em_andamento:
                "Em andamento",

            concluida:
                "Concluída",

            cancelada:
                "Cancelada"

        };


        return (
            textos[status] ||
            status
        );

    }


    function obterTextoNatureza(natureza) {

        const textos = {

            preventiva:
                "Preventiva",

            corretiva:
                "Corretiva"

        };


        return (
            textos[natureza] ||
            natureza
        );

    }


    function preencher(id, valor) {

        const elemento =
            document.getElementById(id);


        if (elemento) {
            elemento.textContent =
                valor;
        }

    }


    /*
     * PREENCHER DADOS
     */

    preencher(
        "manutencaoId",
        manutencao.id
    );


    preencher(
        "viatura",
        viatura
            ? viatura.identificacao
            : "Viatura não encontrada"
    );


    preencher(
        "placa",
        viatura
            ? viatura.placa
            : "—"
    );


    preencher(
        "tipo",
        tipo
            ? tipo.nome
            : "Tipo não encontrado"
    );


    preencher(
        "natureza",
        obterTextoNatureza(
            manutencao.natureza
        )
    );


    preencher(
        "dataAgendada",
        formatarData(
            manutencao.dataAgendada
        )
    );


    preencher(
        "dataConclusao",
        formatarData(
            manutencao.dataConclusao
        )
    );


    preencher(
        "quilometragem",
        formatarKm(
            manutencao.quilometragem
        )
    );


    preencher(
        "responsavel",
        manutencao.responsavelNome ||
            "Não informado"
    );


    preencher(
        "servico",
        manutencao.servico ||
            "Não informado"
    );


    preencher(
        "problema",
        manutencao.problema ||
            "Não informado"
    );


    preencher(
        "pecas",
        manutencao.pecas ||
            "Não informado"
    );


    preencher(
        "observacoes",
        manutencao.observacoes ||
            "Não informado"
    );


    /*
     * STATUS
     */

    const elementoStatus =
        document.getElementById(
            "statusManutencao"
        );


    if (elementoStatus) {

        elementoStatus.textContent =
            obterTextoStatus(
                manutencao.status
            );


        elementoStatus.className =
            `status-manutencao status-${manutencao.status}`;

    }


    /*
     * BOTÃO VOLTAR
     */

    const btnVoltar =
        document.getElementById(
            "btnVoltar"
        );


    if (btnVoltar) {

        btnVoltar.addEventListener(
            "click",
            () => {

                window.location.href =
                    "manutencoes.html";

            }
        );

    }


    /*
     * BOTÃO VOLTAR DO ERRO
     */

    const btnVoltarErro =
        document.getElementById(
            "btnVoltarErro"
        );


    if (btnVoltarErro) {

        btnVoltarErro.addEventListener(
            "click",
            () => {

                window.location.href =
                    "manutencoes.html";

            }
        );

    }


    /*
     * BOTÕES DE AÇÃO
     */

    const btnIniciar =
        document.getElementById(
            "btnIniciar"
        );


    const btnConcluir =
        document.getElementById(
            "btnConcluir"
        );


    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );


    /*
     * PERMISSÕES
     */

    const podeRegistrar =
        sessao &&
        Permissions.pode(
            "registrarManutencao",
            sessao.perfil
        );


    const podeCancelar =
        sessao &&
        Permissions.pode(
            "cancelarManutencao",
            sessao.perfil
        );


    /*
     * STATUS ATUAL
     */

    const statusAtual =
        String(
            manutencao.status || ""
        ).trim().toLowerCase();


    /*
     * INICIAR MANUTENÇÃO
     *
     * Somente manutenção agendada.
     */

    if (
        btnIniciar &&
        podeRegistrar &&
        statusAtual === "agendada"
    ) {

        btnIniciar.style.display =
            "inline-block";


        btnIniciar.addEventListener(
            "click",
            async () => {

                const confirmacao =
                    confirm(
                        "Deseja iniciar esta manutenção?"
                    );


                if (!confirmacao) {
                    return;
                }


                btnIniciar.disabled =
                    true;


                try {

                    const resultado =
                        await ManutencaoService.iniciar(
                            manutencao.id
                        );


                    if (
                        resultado &&
                        resultado.sucesso === false
                    ) {

                        alert(
                            resultado.mensagem
                        );

                        btnIniciar.disabled =
                            false;

                        return;
                    }


                    alert(
                        "Manutenção iniciada com sucesso."
                    );


                    window.location.reload();

                } catch (erro) {

                    console.error(
                        "Erro ao iniciar manutenção:",
                        erro
                    );


                    alert(
                        erro.message ||
                        "Não foi possível iniciar a manutenção."
                    );


                    btnIniciar.disabled =
                        false;

                }

            }
        );

    } else if (btnIniciar) {

        btnIniciar.style.display =
            "none";

    }


    /*
     * CONCLUIR MANUTENÇÃO
     *
     * Pode concluir uma manutenção
     * que esteja em andamento.
     */

    if (
        btnConcluir &&
        podeRegistrar &&
        statusAtual === "em_andamento"
    ) {

        btnConcluir.style.display =
            "inline-block";


        btnConcluir.addEventListener(
            "click",
            async () => {

                const confirmacao =
                    confirm(
                        "Deseja concluir esta manutenção?"
                    );


                if (!confirmacao) {
                    return;
                }


                btnConcluir.disabled =
                    true;


                try {

                    const resultado =
                        await ManutencaoService.concluir(
                            manutencao.id
                        );


                    if (
                        resultado &&
                        resultado.sucesso === false
                    ) {

                        alert(
                            resultado.mensagem
                        );

                        btnConcluir.disabled =
                            false;

                        return;
                    }


                    alert(
                        "Manutenção concluída com sucesso."
                    );


                    window.location.reload();

                } catch (erro) {

                    console.error(
                        "Erro ao concluir manutenção:",
                        erro
                    );


                    alert(
                        erro.message ||
                        "Não foi possível concluir a manutenção."
                    );


                    btnConcluir.disabled =
                        false;

                }

            }
        );

    } else if (btnConcluir) {

        btnConcluir.style.display =
            "none";

    }


    /*
     * CANCELAR MANUTENÇÃO
     *
     * Administrador e gestor.
     *
     * Não permite cancelar concluída
     * ou já cancelada.
     */

    if (
        btnCancelar &&
        podeCancelar &&
        statusAtual !== "concluida" &&
        statusAtual !== "cancelada"
    ) {

        btnCancelar.style.display =
            "inline-block";


        btnCancelar.addEventListener(
            "click",
            async () => {

                const confirmacao =
                    confirm(
                        "Deseja cancelar esta manutenção?"
                    );


                if (!confirmacao) {
                    return;
                }


                btnCancelar.disabled =
                    true;


                try {

                    const resultado =
                        await ManutencaoService.cancelar(
                            manutencao.id
                        );


                    if (
                        resultado &&
                        resultado.sucesso === false
                    ) {

                        alert(
                            resultado.mensagem
                        );

                        btnCancelar.disabled =
                            false;

                        return;
                    }


                    alert(
                        "Manutenção cancelada com sucesso."
                    );


                    window.location.reload();

                } catch (erro) {

                    console.error(
                        "Erro ao cancelar manutenção:",
                        erro
                    );


                    alert(
                        erro.message ||
                        "Não foi possível cancelar a manutenção."
                    );


                    btnCancelar.disabled =
                        false;

                }

            }
        );

    } else if (btnCancelar) {

        btnCancelar.style.display =
            "none";

    }

});