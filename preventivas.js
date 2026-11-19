document.addEventListener("DOMContentLoaded", async () => {

    if (!Auth.exigirPermissao("visualizarManutencoes")) {
        return;
    }

    ConfigService.aplicar();

    await ViaturaService.inicializar();

    await ManutencaoService.inicializar();


    const sessao =
        Auth.obterSessao();


    const usuarioLogado =
        document.getElementById(
            "usuarioLogado"
        );


    if (
        usuarioLogado &&
        sessao
    ) {

        usuarioLogado.textContent =
            `${sessao.nome} — Perfil: ${sessao.perfil}`;

    }


    const btnVoltar =
        document.getElementById(
            "btnVoltar"
        );


    if (btnVoltar) {

        btnVoltar.addEventListener(
            "click",
            () => {

                window.location.href =
                    "dashboard.html";

            }
        );

    }


    const busca =
        document.getElementById(
            "busca"
        );


    const filtroSituacao =
        document.getElementById(
            "filtroSituacao"
        );


    function atualizar() {

        const lista =
            PreventivaService.listarSituacaoFrota();


        atualizarResumo(
            lista
        );


        const termo =
            busca.value
                .trim()
                .toLowerCase();


        const situacaoFiltro =
            filtroSituacao.value;


        const filtradas =
            lista.filter(
                item => {

                    const viatura =
                        item.viatura;


                    const correspondeBusca =
                        !termo ||

                        viatura.identificacao
                            .toLowerCase()
                            .includes(termo) ||

                        viatura.placa
                            .toLowerCase()
                            .includes(termo) ||

                        viatura.marca
                            .toLowerCase()
                            .includes(termo) ||

                        viatura.modelo
                            .toLowerCase()
                            .includes(termo);


                    const correspondeSituacao =
                        !situacaoFiltro ||
                        item.situacao ===
                            situacaoFiltro;


                    return (
                        correspondeBusca &&
                        correspondeSituacao
                    );

                }
            );


        renderizarTabela(
            filtradas
        );

    }


    busca.addEventListener(
        "input",
        atualizar
    );


    filtroSituacao.addEventListener(
        "change",
        atualizar
    );


    atualizar();

});


/*
 * RESUMO
 */

function atualizarResumo(
    lista
) {

    let normal = 0;

    let proxima = 0;

    let atrasada = 0;

    let semPlanejamento = 0;


    lista.forEach(
        item => {

            switch (
                item.situacao
            ) {

                case "normal":
                    normal++;
                    break;

                case "proxima":
                    proxima++;
                    break;

                case "atrasada":
                    atrasada++;
                    break;

                case "sem_planejamento":
                    semPlanejamento++;
                    break;

            }

        }
    );


    definirValor(
        "totalNormal",
        normal
    );


    definirValor(
        "totalProxima",
        proxima
    );

    definirValor(
        "totalAtrasada",
        atrasada
    );


    definirValor(
        "totalSemPlanejamento",
        semPlanejamento
    );


    definirValor(
        "totalViaturas",
        lista.length
    );

}


/*
 * TABELA
 */

function renderizarTabela(
    lista
) {

    const tabela =
        document.getElementById(
            "tabelaPreventivas"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazio"
        );


    tabela.innerHTML = "";


    if (
        lista.length === 0
    ) {

        estadoVazio.style.display =
            "block";

        return;

    }


    estadoVazio.style.display =
        "none";


    lista.forEach(
        item => {

            const viatura =
                item.viatura;


            const situacao =
                item.situacao;


            const analises =
                item.analises;


            const melhorAnalise =
                obterMelhorAnalise(
                    analises
                );


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    <strong>
                        ${viatura.identificacao}
                    </strong>
                </td>

                <td>
                    ${viatura.placa}
                </td>

                <td>
                    ${formatarQuilometragem(
                        viatura.quilometragem
                    )}
                </td>

                <td>

                    <span
                        class="status-preventiva status-${situacao}"
                    >
                        ${melhorAnalise.label}
                    </span>

                </td>

                <td>

                    <a
                        href="viatura.html?id=${encodeURIComponent(
                            viatura.id
                        )}"
                    >
                        Ver detalhes
                    </a>

                </td>

            `;


            tabela.appendChild(
                tr
            );

        }
    );

}


/*
 * ESCOLHE A SITUAÇÃO MAIS IMPORTANTE
 */

function obterMelhorAnalise(
    analises
) {

    const ordem = [
        "atrasada",
        "proxima",
        "normal",
        "sem_planejamento"
    ];


    for (
        const status of ordem
    ) {

        const encontrada =
            analises.find(
                item =>
                    item.status ===
                    status
            );


        if (encontrada) {

            return encontrada;

        }

    }


    return {

        status:
            "sem_planejamento",

        label:
            "Sem planejamento"

    };

}


/*
 * FORMATA QUILOMETRAGEM
 */

function formatarQuilometragem(
    valor
) {

    return Number(
        valor
    ).toLocaleString(
        "pt-BR"
    ) + " km";

}


/*
 * ALTERA VALOR DE UM ELEMENTO
 */

function definirValor(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor;

    }

}