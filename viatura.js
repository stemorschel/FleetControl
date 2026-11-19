Auth.exigirPermissao("visualizarFrota");


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const sessao =
            Auth.obterSessao();


        if (sessao) {

            document.getElementById(
                "usuarioLogado"
            ).textContent =
                `${sessao.nome} (${sessao.perfil})`;

        }


        /*
         * INICIALIZAÇÃO
         *
         * Aguarda os dados da API/MySQL
         * antes de carregar a viatura.
         */

        await ViaturaService.inicializar();

        await ManutencaoService.inicializar();


        const parametros =
            new URLSearchParams(
                window.location.search
            );


        const id =
            parametros.get("id");


        if (!id) {

            mostrarErro();

            return;

        }


        carregarViatura(id);


        document.getElementById(
            "btnVoltar"
        ).addEventListener(
            "click",
            voltarParaFrota
        );


        document.getElementById(
            "btnVoltarErro"
        ).addEventListener(
            "click",
            voltarParaFrota
        );

    }
);


function carregarViatura(id) {

    const viatura =
        ViaturaService.buscarPorId(id);


    if (!viatura) {

        mostrarErro();

        return;

    }


    document.getElementById(
        "conteudoViatura"
    ).style.display =
        "block";


    document.getElementById(
        "identificacao"
    ).textContent =
        viatura.identificacao;


    document.getElementById(
        "placa"
    ).textContent =
        viatura.placa;


    document.getElementById(
        "marca"
    ).textContent =
        viatura.marca;


    document.getElementById(
        "modelo"
    ).textContent =
        viatura.modelo;


    document.getElementById(
        "ano"
    ).textContent =
        viatura.ano;


    document.getElementById(
        "quilometragem"
    ).textContent =
        formatarQuilometragem(
            viatura.quilometragem
        );


    document.getElementById(
        "setor"
    ).textContent =
        viatura.setor;


    document.getElementById(
        "situacao"
    ).textContent =
        viatura.ativa
            ? "Ativa"
            : "Inativa";


    document.getElementById(
        "dataCadastro"
    ).textContent =
        formatarData(
            viatura.dataCadastro
        );


    atualizarStatus(
    viatura.status,
    viatura.ativa
);


    configurarAcoes(
        viatura
    );


    carregarHistorico(
        viatura.id
    );

}


function atualizarStatus(status, ativa) {

    const elemento =
        document.getElementById("status");

    const estaInativa =
        ativa === false ||
        ativa === 0 ||
        ativa === "0";

    const statusExibido =
        estaInativa
            ? "indisponivel"
            : status;

    elemento.className = "status";

    elemento.classList.add(
        `status-${statusExibido}`
    );

    const nomes = {
        disponivel: "Disponível",
        em_manutencao: "Em manutenção",
        indisponivel: "Indisponível"
    };

    elemento.textContent =
        nomes[statusExibido] ||
        statusExibido;
}


function configurarAcoes(viatura) {

    const sessao =
        Auth.obterSessao();


    if (!sessao) {
        return;
    }


    const btnEditar =
        document.getElementById(
            "btnEditar"
        );


    const btnQuilometragem =
        document.getElementById(
            "btnQuilometragem"
        );


    const btnSituacao =
        document.getElementById(
            "btnSituacao"
        );


    if (
        !Permissions.pode(
            "editarViatura",
            sessao.perfil
        )
    ) {

        btnEditar.style.display =
            "none";

    } else {

        btnEditar.addEventListener(
            "click",
            () => {

                window.location.href =
                    `editar-viatura.html?id=${encodeURIComponent(
                        viatura.id
                    )}`;

            }
        );

    }


    if (
        !Permissions.pode(
            "atualizarQuilometragem",
            sessao.perfil
        )
    ) {

        btnQuilometragem.style.display =
            "none";

    } else {

        btnQuilometragem.addEventListener(
            "click",
            () =>
                atualizarQuilometragem(
                    viatura.id
                )
        );

    }


    if (
        !Permissions.pode(
            "editarViatura",
            sessao.perfil
        )
    ) {

        btnSituacao.style.display =
            "none";

    } else {

        btnSituacao.textContent =
            viatura.ativa
                ? "Inativar Viatura"
                : "Ativar Viatura";


        btnSituacao.addEventListener(
            "click",
            () =>
                alterarSituacao(
                    viatura.id,
                    viatura.ativa
                )
        );

    }

}


async function atualizarQuilometragem(id) {

    const viatura =
        ViaturaService.buscarPorId(id);


    if (!viatura) {
        return;
    }


    const novaKm =
        prompt(
            `Quilometragem atual: ${viatura.quilometragem} km\n\nInforme a nova quilometragem:`,
            viatura.quilometragem
        );


    if (
        novaKm === null ||
        novaKm.trim() === ""
    ) {

        return;

    }


    const valor =
        Number(novaKm);


    if (
        !Number.isFinite(valor) ||
        valor < viatura.quilometragem
    ) {

        alert(
            "A nova quilometragem deve ser um número válido e não pode ser menor que a atual."
        );

        return;

    }


    const resultado =
        await ViaturaService.atualizarQuilometragem(
            id,
            valor
        );


    if (!resultado.sucesso) {

        alert(
            resultado.mensagem
        );

        return;

    }


    carregarViatura(id);

}


async function alterarSituacao(
    id,
    estaAtiva
) {

    const novaSituacao =
        estaAtiva
            ? "inativar"
            : "ativar";


    const confirmar =
        confirm(
            `Deseja realmente ${novaSituacao} esta viatura?`
        );


    if (!confirmar) {
        return;
    }


    const resultado =
    await ViaturaService.atualizarNaAPI(
        id,
        {
            ativa: !estaAtiva
        }
    );


    if (!resultado.sucesso) {

        alert(
            resultado.mensagem
        );

        return;

    }


    carregarViatura(id);

}


function carregarHistorico(viaturaId) {

    const manutencoes =
        ManutencaoService
            .listarPorViatura(
                viaturaId
            );


    const tipos =
        Storage.buscar(
            CONFIG.storage.tiposManutencao,
            []
        );


    const tabela =
        document.getElementById(
            "tabelaHistorico"
        );


    const container =
        document.getElementById(
            "tabelaHistoricoContainer"
        );


    const vazio =
        document.getElementById(
            "estadoHistoricoVazio"
        );


    tabela.innerHTML = "";


    manutencoes.sort(
        (a, b) => {

            const dataA =
                new Date(
                    a.dataConclusao ||
                    a.dataAgendada ||
                    a.dataCriacao
                );


            const dataB =
                new Date(
                    b.dataConclusao ||
                    b.dataAgendada ||
                    b.dataCriacao
                );


            return dataB - dataA;

        }
    );


    if (
        manutencoes.length === 0
    ) {

        container.style.display =
            "none";

        vazio.style.display =
            "block";

        return;

    }


    container.style.display =
        "block";

    vazio.style.display =
        "none";


    manutencoes.forEach(
        manutencao => {

            const tipo =
                tipos.find(
                    item =>
                        item.id ===
                        manutencao.tipoId
                );


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    ${
                        tipo
                            ? tipo.nome
                            : "Não informado"
                    }
                </td>

                <td>
                    ${
                        formatarNatureza(
                            manutencao.natureza
                        )
                    }
                </td>

                <td>
                    ${
                        formatarData(
                            manutencao.dataConclusao ||
                            manutencao.dataAgendada ||
                            manutencao.dataCriacao
                        )
                    }
                </td>

                <td>
                    ${
                        formatarQuilometragem(
                            manutencao.quilometragem
                        )
                    }
                </td>

                <td>

                    <span
                        class="status-manutencao status-${manutencao.status}">

                        ${
                            formatarStatus(
                                manutencao.status
                            )
                        }

                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="btn-detalhes"
                        data-id="${manutencao.id}">

                        Ver detalhes

                    </button>

                </td>

            `;


            tabela.appendChild(
                tr
            );

        }
    );


    tabela
        .querySelectorAll(
            ".btn-detalhes"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `manutencao.html?id=${encodeURIComponent(
                                botao.dataset.id
                            )}`;

                    }
                );

            }
        );

}


function mostrarErro() {

    document.getElementById(
        "estadoErro"
    ).style.display =
        "block";

}


function voltarParaFrota() {

    window.location.href =
        "frota.html";

}


function formatarStatus(status) {

    const nomes = {

        agendada:
            "Agendada",

        em_andamento:
            "Em andamento",

        concluida:
            "Concluída",

        cancelada:
            "Cancelada"

    };


    return nomes[status] ||
        status;

}


function formatarNatureza(
    natureza
) {

    const nomes = {

        preventiva:
            "Preventiva",

        corretiva:
            "Corretiva"

    };


    return nomes[natureza] ||
        natureza ||
        "—";

}


function formatarQuilometragem(km) {

    if (
        km === null ||
        km === undefined ||
        km === ""
    ) {

        return "Não informada";

    }


    return `${Number(km).toLocaleString(
        "pt-BR"
    )} km`;

}


function formatarData(data) {

    if (!data) {
        return "Não informada";
    }


    if (
        data.includes("T")
    ) {

        const dataObjeto =
            new Date(data);


        if (
            !Number.isNaN(
                dataObjeto.getTime()
            )
        ) {

            return dataObjeto.toLocaleDateString(
                "pt-BR"
            );

        }

    }


    const partes =
        data.split("-");


    if (
        partes.length === 3
    ) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }


    return data;

}