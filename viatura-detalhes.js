document.addEventListener("DOMContentLoaded", async () => {

    /*
     * PROTEÇÃO
     */

    if (!Auth.exigirPermissao("visualizarFrota")) {
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

    const sessao = Auth.obterSessao();

    const usuarioLogado =
        document.getElementById(
            "usuarioLogado"
        );


    if (usuarioLogado && sessao) {

        usuarioLogado.textContent =
            `${sessao.nome} | Perfil: ${sessao.perfil}`;

    }


    /*
     * ID DA VIATURA
     */

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const viaturaId =
        parametros.get("id");


    /*
     * ELEMENTOS
     */

    const estadoErro =
        document.getElementById(
            "estadoErro"
        );


    const conteudoViatura =
        document.getElementById(
            "conteudoViatura"
        );


    /*
     * VOLTAR PARA A FROTA
     * (registrado antes das validações abaixo, para
     * funcionar também na tela de erro)
     */

    const btnVoltar =
        document.getElementById(
            "btnVoltar"
        );

    const btnVoltarErro =
        document.getElementById(
            "btnVoltarErro"
        );

    [btnVoltar, btnVoltarErro].forEach(
        (botao) => {

            if (botao) {

                botao.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "frota.html";

                    }
                );

            }

        }
    );


    if (!viaturaId) {

        estadoErro.style.display =
            "block";

        return;

    }


    /*
     * BUSCAR VIATURA
     */

    const viatura =
        ViaturaService.buscarPorId(
            viaturaId
        );


    if (!viatura) {

        estadoErro.style.display =
            "block";

        return;

    }


    conteudoViatura.style.display =
        "block";


    /*
     * DADOS DA VIATURA
     */

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


    /*
     * STATUS
     */

    const statusElemento =
        document.getElementById(
            "status"
        );


    const nomesStatus = {

        disponivel:
            "Disponível",

        em_manutencao:
            "Em manutenção",

        indisponivel:
            "Indisponível"

    };


    const statusExibido =
    viatura.ativa === false
        ? "indisponivel"
        : viatura.status;


statusElemento.textContent =
    nomesStatus[statusExibido] ||
    statusExibido;


statusElemento.className =
    `status status-${statusExibido}`;


    /*
     * SITUAÇÃO
     */

const situacaoElemento =
    document.getElementById(
        "situacaoCadastro"
    );


    situacaoElemento.textContent =
        viatura.ativa
            ? "Ativa"
            : "Inativa";


    /*
     * DATA DE CADASTRO
     */

    const dataCadastro =
        document.getElementById(
            "dataCadastro"
        );


    dataCadastro.textContent =
        formatarData(
            viatura.dataCadastro
        );


    /*
     * BOTÕES
     */

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


    /*
     * PERMISSÕES
     */

    if (
        !Permissions.pode(
            "editarViatura",
            sessao.perfil
        )
    ) {

        btnEditar.style.display =
            "none";

    }


    if (
        !Permissions.pode(
            "atualizarQuilometragem",
            sessao.perfil
        )
    ) {

        btnQuilometragem.style.display =
            "none";

    }


    if (
        !Permissions.pode(
            "editarViatura",
            sessao.perfil
        )
    ) {

        btnSituacao.style.display =
            "none";

    }


    /*
     * EDITAR VIATURA
     */

    btnEditar.addEventListener(
        "click",
        () => {

            window.location.href =
                `editar-viatura.html?id=${encodeURIComponent(
                    viatura.id
                )}`;

        }
    );


    /*
     * ATUALIZAR QUILOMETRAGEM
     */

btnQuilometragem.addEventListener(
    "click",
    async () => {

        const valor =
            prompt(
                `Quilometragem atual: ${formatarQuilometragem(
                    viatura.quilometragem
                )}\n\nInforme a nova quilometragem:`
            );


        if (
            valor === null
        ) {

            return;

        }


        const novaQuilometragem =
            Number(
                valor
            );


        if (
            !Number.isFinite(
                novaQuilometragem
            ) ||
            novaQuilometragem < 0
        ) {

            alert(
                "Informe uma quilometragem válida."
            );

            return;

        }


const resultado =
    await ViaturaService.atualizarQuilometragem(
        viatura.id,
        novaQuilometragem
    );


        if (
            !resultado.sucesso
        ) {

            alert(
                resultado.mensagem
            );

            return;

        }


        window.location.reload();

    }
);


    /*
     * ALTERAR SITUAÇÃO
     */



btnSituacao.addEventListener(
    "click",
    async () => {

        const mensagem =
            viatura.ativa
                ? "Deseja realmente inativar esta viatura?"
                : "Deseja realmente ativar esta viatura?";

        const confirmar = confirm(mensagem);

        if (!confirmar) {
            return;
        }

        const resultado =
            await ViaturaService.atualizarNaAPI(
                viatura.id,
                {
                    identificacao: viatura.identificacao,
                    placa: viatura.placa,
                    marca: viatura.marca,
                    modelo: viatura.modelo,
                    ano: viatura.ano,
                    quilometragem: viatura.quilometragem,
                    setor: viatura.setor,
                    status: viatura.status,
                    ativa: !viatura.ativa
                }
            );

        if (!resultado.sucesso) {
            alert(resultado.mensagem);
            return;
        }

        window.location.reload();
    }
);




    /*
     * HISTÓRICO DE MANUTENÇÕES
     */

    function carregarHistorico() {

        const tabela =
            document.getElementById(
                "tabelaHistorico"
            );


        const estadoHistoricoVazio =
            document.getElementById(
                "estadoHistoricoVazio"
            );


        const tabelaHistoricoContainer =
            document.getElementById(
                "tabelaHistoricoContainer"
            );


        const manutencoes =
            ManutencaoService
                .listarPorViatura(
                    viatura.id
                );


        const tipos =
            Storage.buscar(
                CONFIG.storage.tiposManutencao,
                []
            );


        tabela.innerHTML =
            "";


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

            tabelaHistoricoContainer.style.display =
                "none";


            estadoHistoricoVazio.style.display =
                "block";


            return;

        }


        tabelaHistoricoContainer.style.display =
            "block";


        estadoHistoricoVazio.style.display =
            "none";


        manutencoes.forEach(
            manutencao => {

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
                                manutencao.dataAgendada ||
                                manutencao.dataConclusao ||
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
                            class="status-manutencao status-${manutencao.status}"
                        >
                            ${
                                formatarStatus(
                                    manutencao.status
                                )
                            }
                        </span>

                    </td>

                    <td>

                        <a
                            href="manutencao.html?id=${encodeURIComponent(
                                manutencao.id
                            )}"
                            class="btn-detalhes"
                        >
                            Ver detalhes
                        </a>

                    </td>

                `;


                tabela.appendChild(
                    linha
                );

            }
        );

    }


    carregarHistorico();


    /*
     * PLANEJAMENTO PREVENTIVO
     */

    function carregarPreventivas() {

        const lista =
            document.getElementById(
                "listaPreventivas"
            );


        const analises =
            PreventivaService
                .analisarViatura(
                    viatura.id
                );


        lista.innerHTML =
            "";


        if (
            analises.length === 0
        ) {

            lista.innerHTML = `
                <div class="estado-vazio">
                    Nenhum tipo de manutenção preventiva está configurado.
                </div>
            `;

            return;

        }


        analises.forEach(
            item => {

                const elemento =
                    document.createElement(
                        "div"
                    );


                elemento.className =
                    "item-preventiva";


                let detalhes =
                    "";


                if (
                    item.status ===
                    "sem_planejamento"
                ) {

                    detalhes =
                        item.motivo;

                } else {

                    const partes =
                        [];


                    if (
                        item.kmRestante !==
                        null
                    ) {

                        if (
                            item.kmRestante >
                            0
                        ) {

                            partes.push(
                                `${Number(
                                    item.kmRestante
                                ).toLocaleString(
                                    "pt-BR"
                                )} km restantes`
                            );

                        } else {

                            partes.push(
                                `${Number(
                                    Math.abs(
                                        item.kmRestante
                                    )
                                ).toLocaleString(
                                    "pt-BR"
                                )} km ultrapassados`
                            );

                        }

                    }


                    if (
                        item.diasRestantes !==
                        null
                    ) {

                        if (
                            item.diasRestantes >
                            0
                        ) {

                            partes.push(
                                `${item.diasRestantes} dias restantes`
                            );

                        } else {

                            partes.push(
                                `${Math.abs(
                                    item.diasRestantes
                                )} dias ultrapassados`
                            );

                        }

                    }


                    detalhes =
                        partes.join(
                            " • "
                        );

                }


                elemento.innerHTML = `

                    <div>

                        <strong>
                            ${item.tipo.nome}
                        </strong>

                        <span>
                            ${detalhes}
                        </span>

                    </div>


                    <span
                        class="status-preventiva status-${item.status}"
                    >
                        ${item.label}
                    </span>

                `;


                lista.appendChild(
                    elemento
                );

            }
        );

    }


    carregarPreventivas();

});


function formatarQuilometragem(
    quilometragem
) {

    if (
        quilometragem === null ||
        quilometragem === undefined ||
        quilometragem === ""
    ) {

        return "Não informada";

    }


    return `${Number(
        quilometragem
    ).toLocaleString(
        "pt-BR"
    )} km`;

}


function formatarData(
    data
) {

    if (!data) {

        return "Não informada";

    }


    const dataObjeto =
        new Date(
            data
        );


    if (
        !Number.isNaN(
            dataObjeto.getTime()
        )
    ) {

        return dataObjeto.toLocaleDateString(
            "pt-BR"
        );

    }


    return data;

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


function formatarStatus(
    status
) {

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
        status ||
        "—";

}