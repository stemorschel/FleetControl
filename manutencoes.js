document.addEventListener("DOMContentLoaded", async () => {

    /*
     * PROTEÇÃO
     */

    if (
        !Auth.exigirPermissao(
            "visualizarManutencoes"
        )
    ) {
        return;
    }


    /*
     * INICIALIZAÇÃO
     *
     * A API precisa carregar os dados
     * antes da tela ser renderizada.
     */

    await ViaturaService.inicializar();

    await ManutencaoService.inicializar();


    /*
     * SESSÃO
     */

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


    /*
     * ELEMENTOS
     */

    const tabela =
        document.getElementById(
            "tabelaManutencoes"
        );


    const estadoVazio =
        document.getElementById(
            "estadoVazio"
        );


    const busca =
        document.getElementById(
            "busca"
        );


    const filtroViatura =
        document.getElementById(
            "filtroViatura"
        );


    const filtroStatus =
        document.getElementById(
            "filtroStatus"
        );


    const filtroNatureza =
        document.getElementById(
            "filtroNatureza"
        );


    /*
     * FORMATADORES
     */

    function formatarData(data) {

        if (!data) {
            return "—";
        }

        const dataObj =
            new Date(data);

        if (
            isNaN(
                dataObj.getTime()
            )
        ) {
            return "—";
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
            return "—";
        }

        return Number(valor)
            .toLocaleString("pt-BR")
            + " km";

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

        return (
            nomes[status] ||
            status ||
            "—"
        );

    }


    function formatarNatureza(natureza) {

        const nomes = {

            preventiva:
                "Preventiva",

            corretiva:
                "Corretiva"

        };

        return (
            nomes[natureza] ||
            natureza ||
            "—"
        );

    }


    /*
     * CARREGAR FILTRO DE VIATURAS
     */

    function carregarFiltroViaturas() {

        const viaturas =
            ViaturaService
                .listar()
                .filter(
                    viatura =>
                        viatura.ativa !== false
                );


        filtroViatura.innerHTML =
            `
                <option value="">
                    Todas
                </option>
            `;


        viaturas.forEach(
            viatura => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    viatura.id;


                option.textContent =
                    `${viatura.identificacao} — ${viatura.placa}`;


                filtroViatura.appendChild(
                    option
                );

            }
        );

    }


    /*
     * RENDERIZAR
     */

    function renderizar() {

        const manutencoes =
            ManutencaoService.listar();


        const viaturas =
            ViaturaService.listar();


        const tipos =
            ManutencaoService.listarTipos();


        const termo =
            busca.value
                .trim()
                .toLowerCase();


        const viaturaSelecionada =
            filtroViatura.value;


        const statusSelecionado =
            filtroStatus.value;


        const naturezaSelecionada =
            filtroNatureza.value;


        const filtradas =
            manutencoes.filter(
                manutencao => {

                    const viatura =
                        viaturas.find(
                            item =>
                                item.id ===
                                manutencao.viaturaId
                        );


                    const tipo =
                        tipos.find(
                            item =>
                                item.id ===
                                manutencao.tipoId
                        );


                    const textoBusca = [

                        viatura
                            ? viatura.identificacao
                            : "",

                        viatura
                            ? viatura.placa
                            : "",

                        viatura
                            ? viatura.marca
                            : "",

                        viatura
                            ? viatura.modelo
                            : "",

                        tipo
                            ? tipo.nome
                            : "",

                        manutencao.servico || "",

                        manutencao.problema || ""

                    ]
                        .join(" ")
                        .toLowerCase();


                    const correspondeBusca =
                        !termo ||
                        textoBusca.includes(
                            termo
                        );


                    const correspondeViatura =
                        !viaturaSelecionada ||
                        manutencao.viaturaId ===
                        viaturaSelecionada;


                    const correspondeStatus =
                        !statusSelecionado ||
                        manutencao.status ===
                        statusSelecionado;


                    const correspondeNatureza =
                        !naturezaSelecionada ||
                        manutencao.natureza ===
                        naturezaSelecionada;


                    return (

                        correspondeBusca &&

                        correspondeViatura &&

                        correspondeStatus &&

                        correspondeNatureza

                    );

                }
            );


        tabela.innerHTML =
            "";


        if (
            filtradas.length === 0
        ) {

            estadoVazio.hidden =
                false;

            return;

        }


        estadoVazio.hidden =
            true;


        filtradas.forEach(
            manutencao => {

                const viatura =
                    viaturas.find(
                        item =>
                            item.id ===
                            manutencao.viaturaId
                    );


                const tipo =
                    tipos.find(
                        item =>
                            item.id ===
                            manutencao.tipoId
                    );


                const linha =
                    document.createElement(
                        "tr"
                    );


                linha.innerHTML = `

                    <td>
                        ${
                            viatura
                                ? viatura.identificacao
                                : "—"
                        }
                    </td>

                    <td>
                        ${
                            viatura
                                ? viatura.placa
                                : "—"
                        }
                    </td>

                    <td>
                        ${
                            tipo
                                ? tipo.nome
                                : "—"
                        }
                    </td>

                    <td>
                        <span
                            class="natureza-${manutencao.natureza}"
                        >
                            ${
                                formatarNatureza(
                                    manutencao.natureza
                                )
                            }
                        </span>
                    </td>

                    <td>
                        ${
                            formatarData(
                                manutencao.dataAgendada
                            )
                        }
                    </td>

                    <td>
                        <span
                            class="
                                status-manutencao
                                status-${manutencao.status}
                            "
                        >
                            ${
                                formatarStatus(
                                    manutencao.status
                                )
                            }
                        </span>
                    </td>

                    <td>
                        ${
                            formatarKm(
                                manutencao.quilometragem
                            )
                        }
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-detalhes"
                            data-id="${manutencao.id}"
                        >
                            Ver detalhes
                        </button>

                    </td>

                `;


                tabela.appendChild(
                    linha
                );

            }
        );


        /*
         * BOTÕES DE DETALHES
         */

        document
            .querySelectorAll(
                ".btn-detalhes"
            )
            .forEach(
                botao => {

                    botao.addEventListener(
                        "click",
                        () => {

                            const id =
                                botao.dataset.id;


                            window.location.href =
                                `manutencao.html?id=${encodeURIComponent(id)}`;

                        }
                    );

                }
            );

    }


    /*
     * FILTROS
     */

    busca.addEventListener(
        "input",
        renderizar
    );


    filtroViatura.addEventListener(
        "change",
        renderizar
    );


    filtroStatus.addEventListener(
        "change",
        renderizar
    );


    filtroNatureza.addEventListener(
        "change",
        renderizar
    );


    /*
     * INICIAR
     */

    carregarFiltroViaturas();

    renderizar();

});