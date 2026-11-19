document.addEventListener("DOMContentLoaded", async () => {

    if (!Auth.exigirPermissao("dashboard")) {
        return;
    }


    /*
     * INICIALIZAÇÃO
     *
     * Aguarda a sincronização com a API/MySQL
     * antes de carregar os dados do dashboard.
     */

    await ViaturaService.inicializar();

    await ManutencaoService.inicializar();


    /*
     * SESSÃO
     */

    const sessao =
        Auth.obterSessao();


    if (!sessao) {
        return;
    }


    const usuarioNome =
        document.getElementById(
            "usuarioNome"
        );


    if (usuarioNome) {

        usuarioNome.textContent =
            sessao.nome;

    }


    const usuarioPerfil =
        document.getElementById(
            "usuarioPerfil"
        );


    if (usuarioPerfil) {

        usuarioPerfil.textContent =
            `Perfil: ${sessao.perfil}`;

    }


    /*
     * LOGOUT
     */

    const btnLogout =
        document.getElementById(
            "btnLogout"
        );


    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            () => Auth.logout()
        );

    }


    /*
     * CONTROLE DE ACESSOS
     */

    controlarAcessos(
        sessao.perfil
    );


    /*
     * CARREGA OS DADOS
     *
     * Neste momento os dados da API já foram
     * carregados pelos services.
     */

    carregarResumoFrota();

    carregarResumoPreventivas();

    carregarIndicadores();

    carregarGraficos();

    carregarAlertas();

});


/*
 * CONTROLE DOS ACESSOS
 */

function controlarAcessos(perfil) {

    const cardFrota =
        document.getElementById(
            "cardFrota"
        );


    const cardManutencoes =
        document.getElementById(
            "cardManutencoes"
        );


    const cardPreventivas =
        document.getElementById(
            "cardPreventivas"
        );


    const cardUsuarios =
        document.getElementById(
            "cardUsuarios"
        );


    const cardConfiguracoes =
        document.getElementById(
            "cardConfiguracoes"
        );


    if (
        cardFrota &&
        !Permissions.pode(
            "visualizarFrota",
            perfil
        )
    ) {

        cardFrota.style.display = "none";

    }


    if (
        cardManutencoes &&
        !Permissions.pode(
            "visualizarManutencoes",
            perfil
        )
    ) {

        cardManutencoes.style.display = "none";

    }


    if (
        cardPreventivas &&
        !Permissions.pode(
            "visualizarManutencoes",
            perfil
        )
    ) {

        cardPreventivas.style.display = "none";

    }


    if (
        cardUsuarios &&
        !Permissions.pode(
            "usuarios",
            perfil
        )
    ) {

        cardUsuarios.style.display = "none";

    }


    if (
        cardConfiguracoes &&
        !Permissions.pode(
            "configuracoes",
            perfil
        )
    ) {

        cardConfiguracoes.style.display = "none";

    }

}


/*
 * RESUMO DA FROTA
 */

function carregarResumoFrota() {

    const todasViaturas =
    ViaturaService.listar();

const viaturas =
    todasViaturas.filter(
        viatura => viatura.ativa !== false
    );

const total =
    todasViaturas.length;

const inativas =
    todasViaturas.filter(
        viatura => viatura.ativa === false
    ).length;


    const disponiveis =
        viaturas.filter(
            viatura =>
                viatura.status ===
                "disponivel"
        ).length;


    const emManutencao =
        viaturas.filter(
            viatura =>
                viatura.status ===
                "em_manutencao"
        ).length;


    const indisponiveis = inativas;

    definirValor(
        "totalViaturas",
        total
    );


    definirValor(
        "totalDisponiveis",
        disponiveis
    );


    definirValor(
        "totalEmManutencao",
        emManutencao
    );


    definirValor(
        "totalIndisponiveis",
        indisponiveis
    );

}


/*
 * RESUMO DAS PREVENTIVAS
 */

function carregarResumoPreventivas() {

    const resumo =
        PreventivaService.obterResumoFrota();


    definirValor(
        "totalPreventivasNormais",
        resumo.normal
    );


    definirValor(
        "totalPreventivasProximas",
        resumo.proxima
    );


    definirValor(
        "totalPreventivasAtrasadas",
        resumo.atrasada
    );


    definirValor(
        "totalSemPlanejamento",
        resumo.semPlanejamento
    );

}


/*
 * INDICADORES
 */

function carregarIndicadores() {

    const viaturas =
    ViaturaService.listar();


    const manutencoes =
        ManutencaoService.listar();


    /*
     * DISPONIBILIDADE
     */

    const totalViaturas =
        viaturas.length;


    const disponiveis =
    viaturas.filter(
        viatura =>
            viatura.ativa !== false &&
            viatura.status === "disponivel"
    ).length;


    const percentualDisponibilidade =
        totalViaturas > 0
            ? Math.round(
                (
                    disponiveis /
                    totalViaturas
                ) * 100
            )
            : 0;


    /*
     * PREVENTIVAS NO PRAZO
     *
     * Consideramos concluídas as preventivas
     * que, na análise atual, não estão atrasadas.
     */

    const preventivas =
        manutencoes.filter(
            manutencao =>
                manutencao.natureza ===
                "preventiva"
        );


    const preventivasConcluidas =
        preventivas.filter(
            manutencao =>
                manutencao.status ===
                "concluida"
        );


    let preventivasNoPrazo = 0;


    preventivasConcluidas.forEach(
        manutencao => {

            const viatura =
                ViaturaService.buscarPorId(
                    manutencao.viaturaId
                );


            const tipo =
                PreventivaService.obterTipo(
                    manutencao.tipoId
                );


            if (!viatura || !tipo) {
                return;
            }


            const situacao =
                PreventivaService.calcularSituacao(
                    viatura,
                    tipo
                );


            if (
                situacao.status === "normal" ||
                situacao.status === "proxima"
            ) {

                preventivasNoPrazo++;

            }

        }
    );


    const percentualPreventivas =
        preventivasConcluidas.length > 0
            ? Math.round(
                (
                    preventivasNoPrazo /
                    preventivasConcluidas.length
                ) * 100
            )
            : 0;


    /*
     * CORRETIVAS
     */

    const corretivas =
        manutencoes.filter(
            manutencao =>
                manutencao.natureza ===
                "corretiva"
        ).length;


    /*
     * EM ANDAMENTO
     */

    const emAndamento =
        manutencoes.filter(
            manutencao =>
                manutencao.status ===
                "em_andamento"
        ).length;


    /*
     * EXIBIÇÃO
     */

    definirValor(
        "percentualDisponibilidade",
        `${percentualDisponibilidade}%`
    );


    definirValor(
        "percentualPreventivas",
        `${percentualPreventivas}%`
    );


    definirValor(
        "totalCorretivas",
        corretivas
    );


    definirValor(
        "totalEmAndamento",
        emAndamento
    );

}

/*
 * GRÁFICOS DO DASHBOARD
 */

function carregarGraficos() {
    const viaturas = ViaturaService.listar();

    const manutencoes = ManutencaoService.listar();

    desenharGraficoStatus(viaturas);
    desenharGraficoManutencoes(viaturas, manutencoes);
}


function prepararCanvas(id, alturaPersonalizada = null) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;

    const pai = canvas.parentElement;
    const largura = id === "graficoStatusFrota"
        ? Math.min(230, pai.clientWidth - 32)
        : Math.max(pai.clientWidth - 40, 260);

    const altura = alturaPersonalizada ||
        (id === "graficoStatusFrota" ? 230 : 280);

    const escala = window.devicePixelRatio || 1;

    canvas.width = largura * escala;
    canvas.height = altura * escala;
    canvas.style.width = `${largura}px`;
    canvas.style.height = `${altura}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.clearRect(0, 0, largura, altura);

    return { ctx, largura, altura };
}

function desenharGraficoStatus(viaturas) {
    const grafico = prepararCanvas("graficoStatusFrota");
    const legenda = document.getElementById("legendaStatusFrota");

    if (!grafico || !legenda) return;

    const grupos = [
    {
        nome: "Disponíveis",
        cor: "#25845b",
        valor: viaturas.filter(
            v => v.ativa !== false &&
                 v.status === "disponivel"
        ).length
    },
    {
        nome: "Em manutenção",
        cor: "#e3a32b",
        valor: viaturas.filter(
            v => v.ativa !== false &&
                 v.status === "em_manutencao"
        ).length
    },
    {
        nome: "Indisponíveis",
        cor: "#d65353",
        valor: viaturas.filter(
            v => v.ativa === false
        ).length
    }
];

    const total = grupos.reduce((soma, item) => soma + item.valor, 0);
    const { ctx, largura, altura } = grafico;

    const cx = largura / 2;
    const cy = altura / 2;
    const raio = 72;
    const espessura = 23;

    ctx.beginPath();
    ctx.arc(cx, cy, raio, 0, Math.PI * 2);
    ctx.strokeStyle = "#edf1f5";
    ctx.lineWidth = espessura;
    ctx.stroke();

    if (total > 0) {
        let angulo = -Math.PI / 2;

        grupos.forEach(item => {
            if (!item.valor) return;

            const fim = angulo + (item.valor / total) * Math.PI * 2;

            ctx.beginPath();
            ctx.arc(cx, cy, raio, angulo, fim);
            ctx.strokeStyle = item.cor;
            ctx.lineWidth = espessura;
            ctx.lineCap = "butt";
            ctx.stroke();

            angulo = fim;
        });

        ctx.fillStyle = "#243447";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(total), cx, cy - 7);

        ctx.fillStyle = "#7b8794";
        ctx.font = "11px Arial";
        ctx.fillText("VIATURAS", cx, cy + 19);
    } else {
        ctx.fillStyle = "#7b8794";
        ctx.font = "13px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Sem dados", cx, cy);
    }

    legenda.innerHTML = grupos.map(item => `
        <div class="chart-legend-item">
            <span class="chart-legend-label">
                <i style="background:${item.cor}"></i>
                ${item.nome}
            </span>
            <strong>${item.valor}</strong>
        </div>
    `).join("");
}

function desenharGraficoManutencoes(viaturas, manutencoes) {
    const dados = viaturas.map(viatura => ({
        nome: viatura.identificacao || viatura.id,
        total: manutencoes.filter(
            m => String(m.viaturaId) === String(viatura.id)
        ).length
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);

    const altura = Math.max(250, dados.length * 43 + 35);
    const grafico = prepararCanvas(
        "graficoManutencoesViatura",
        altura
    );

    if (!grafico) return;

    const { ctx, largura } = grafico;

    if (!dados.length) {
        ctx.fillStyle = "#7b8794";
        ctx.font = "13px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Nenhuma viatura cadastrada", largura / 2, altura / 2);
        return;
    }

    const margemEsquerda = 90;
    const margemDireita = 30;
    const areaLargura = largura - margemEsquerda - margemDireita;
    const inicioY = 18;
    const espacamento = 43;
    const alturaBarra = 19;
    const maximo = Math.max(...dados.map(item => item.total), 1);

    dados.forEach((item, indice) => {
        const y = inicioY + indice * espacamento;
        const barraLargura = (item.total / maximo) * areaLargura;

        ctx.fillStyle = "#52616b";
        ctx.font = "12px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const nome = String(item.nome);
        ctx.fillText(
            nome.length > 12 ? nome.slice(0, 11) + "…" : nome,
            margemEsquerda - 10,
            y + alturaBarra / 2
        );

        ctx.fillStyle = "#edf1f5";
        ctx.beginPath();
        ctx.roundRect(
            margemEsquerda,
            y,
            areaLargura,
            alturaBarra,
            6
        );
        ctx.fill();

        if (item.total > 0) {
            ctx.fillStyle = "#3975a0";
            ctx.beginPath();
            ctx.roundRect(
                margemEsquerda,
                y,
                Math.max(barraLargura, 4),
                alturaBarra,
                6
            );
            ctx.fill();
        }

        ctx.fillStyle = "#243447";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
            String(item.total),
            margemEsquerda + areaLargura + 9,
            y + alturaBarra / 2
        );
    });
}

window.addEventListener("resize", () => {
    if (document.getElementById("graficoStatusFrota")) {
        carregarGraficos();
    }
});

/*
 * ALERTAS
 */

function carregarAlertas() {

    const container =
        document.getElementById(
            "listaAlertas"
        );


    if (!container) {
        return;
    }


    const situacoes =
        PreventivaService.listarSituacaoFrota();


    const alertas = [];


    situacoes.forEach(
        item => {

            const viatura =
                item.viatura;


            item.analises.forEach(
                analise => {

                    if (
                        analise.status ===
                        "atrasada"
                    ) {

                        alertas.push({

                            tipo: "atrasada",

                            identificacao:
                                viatura.identificacao,

                            mensagem:
                                `${analise.tipo.nome} está atrasada.`

                        });

                    }

                    else if (
                        analise.status ===
                        "proxima"
                    ) {

                        alertas.push({

                            tipo: "proxima",

                            identificacao:
                                viatura.identificacao,

                            mensagem:
                                `${analise.tipo.nome} está próxima do prazo.`

                        });

                    }

                }
            );

        }
    );


    if (alertas.length === 0) {

        container.innerHTML = `
            <div class="alerta-vazio">
                Nenhum alerta de manutenção no momento.
            </div>
        `;

        return;

    }


    container.innerHTML =
        alertas
            .slice(0, 8)
            .map(
                alerta => `

                    <div class="alerta-item ${alerta.tipo}">

                        <div class="alerta-conteudo">

                            <strong>
                                ${alerta.identificacao}
                            </strong>

                            <span>
                                ${alerta.mensagem}
                            </span>

                        </div>

                    </div>

                `
            )
            .join("");

}


/*
 * FUNÇÃO AUXILIAR
 */

function definirValor(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            valor;

    }

}