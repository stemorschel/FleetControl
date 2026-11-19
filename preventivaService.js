const PreventivaService = {

    /*
     * LISTAR TIPOS
     *
     * Os tipos já devem ter sido sincronizados
     * pelo ManutencaoService antes do cálculo.
     */

    listarTipos() {

        return ManutencaoService.listarTipos();

    },


    /*
     * LISTAR MANUTENÇÕES
     *
     * As manutenções já devem ter sido sincronizadas
     * pelo ManutencaoService antes do cálculo.
     */

    listarManutencoes() {

        return ManutencaoService.listar();

    },


    /*
     * OBTER VIATURAS
     *
     * As viaturas já devem ter sido sincronizadas
     * pelo ViaturaService antes do cálculo.
     */

    listarViaturas() {

        return ViaturaService.listar();

    },


    /*
     * OBTER TIPO DE MANUTENÇÃO
     */

    obterTipo(tipoId) {

        const tipos =
            this.listarTipos();


        return tipos.find(
            tipo =>
                String(tipo.id) ===
                String(tipoId)
        ) || null;

    },


    /*
     * OBTER ÚLTIMA MANUTENÇÃO PREVENTIVA CONCLUÍDA
     */

    obterUltimaManutencao(
        viaturaId,
        tipoId
    ) {

        const manutencoes =
            this.listarManutencoes();


        const viaturaIdNormalizado =
            String(
                viaturaId
            );


        const tipoIdNormalizado =
            String(
                tipoId
            );


        const concluidas =
            manutencoes
                .filter(
                    manutencao => {

                        const mesmaViatura =
                            String(
                                manutencao.viaturaId
                            ) ===
                            viaturaIdNormalizado;


                        const mesmoTipo =
                            String(
                                manutencao.tipoId
                            ) ===
                            tipoIdNormalizado;


                        const preventiva =
                            manutencao.natureza ===
                            "preventiva";


                        const concluida =
                            manutencao.status ===
                            "concluida";


                        return (
                            mesmaViatura &&
                            mesmoTipo &&
                            preventiva &&
                            concluida
                        );

                    }
                )
                .sort(
                    (a, b) => {

                        const dataA =
                            new Date(
                                a.dataConclusao ||
                                a.dataAgendada ||
                                a.dataCriacao ||
                                0
                            );


                        const dataB =
                            new Date(
                                b.dataConclusao ||
                                b.dataAgendada ||
                                b.dataCriacao ||
                                0
                            );


                        return (
                            dataB.getTime() -
                            dataA.getTime()
                        );

                    }
                );


        return (
            concluidas[0] ||
            null
        );

    },


    /*
     * CALCULAR SITUAÇÃO DA MANUTENÇÃO PREVENTIVA
     */

    calcularSituacao(
        viatura,
        tipo
    ) {

        if (
            !viatura ||
            !tipo
        ) {

            return {

                status:
                    "sem_planejamento",

                label:
                    "Necessita configuração inicial",

                motivo:
                    "Dados insuficientes."

            };

        }


        const intervaloKm =
            Number(
                tipo.intervaloKm
            );


        const intervaloDias =
            Number(
                tipo.intervaloDias
            );


        const temKm =
            Number.isFinite(
                intervaloKm
            ) &&
            intervaloKm > 0;


        const temDias =
            Number.isFinite(
                intervaloDias
            ) &&
            intervaloDias > 0;


        if (
            !temKm &&
            !temDias
        ) {

            return {

                status:
                    "sem_planejamento",

                label:
                    "Sem planejamento",

                motivo:
                    "Este tipo de manutenção não possui intervalo configurado."

            };

        }


        const ultima =
            this.obterUltimaManutencao(
                viatura.id,
                tipo.id
            );


        if (!ultima) {

            return {

                status:
                    "sem_planejamento",

                label:
                    "Necessita configuração inicial",

                motivo:
                    "Ainda não existe uma manutenção preventiva concluída deste tipo para esta viatura."

            };

        }

/*
 * QUILOMETRAGEM DA ÚLTIMA MANUTENÇÃO
 */

const temQuilometragemUltima =
    ultima.quilometragem !== null &&
    ultima.quilometragem !== undefined &&
    ultima.quilometragem !== "";

const quilometragemUltima =
    temQuilometragemUltima
        ? Number(ultima.quilometragem)
        : null;


/*
 * QUILOMETRAGEM ATUAL DA VIATURA
 */

const quilometragemAtual =
    Number(viatura.quilometragem);


let kmRestante = null;


if (
    temKm &&
    quilometragemUltima !== null &&
    Number.isFinite(quilometragemUltima) &&
    Number.isFinite(quilometragemAtual)
) {

    const proximaKm =
        quilometragemUltima +
        intervaloKm;

    kmRestante =
        proximaKm -
        quilometragemAtual;

}


        /*
         * CÁLCULO POR DATA
         */

        let diasRestantes =
            null;


        if (temDias) {

            const dataBase =
                new Date(
                    ultima.dataConclusao ||
                    ultima.dataAgendada ||
                    ultima.dataCriacao
                );


            if (
                !Number.isNaN(
                    dataBase.getTime()
                )
            ) {

                const dataProxima =
                    new Date(
                        dataBase
                    );


                dataProxima.setDate(
                    dataProxima.getDate() +
                    intervaloDias
                );


                const hoje =
                    new Date();


                hoje.setHours(
                    0,
                    0,
                    0,
                    0
                );


                dataProxima.setHours(
                    0,
                    0,
                    0,
                    0
                );


                const diferenca =
                    dataProxima.getTime() -
                    hoje.getTime();


                diasRestantes =
                    Math.ceil(
                        diferenca /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    );

            }

        }


        /*
         * ATRASADA
         *
         * Se qualquer um dos critérios
         * estiver vencido, a manutenção
         * está atrasada.
         */

        const kmAtrasado =
            kmRestante !== null &&
            kmRestante <= 0;


        const diasAtrasado =
            diasRestantes !== null &&
            diasRestantes <= 0;


        if (
            kmAtrasado ||
            diasAtrasado
        ) {

            return {

                status:
                    "atrasada",

                label:
                    "Atrasada",

                motivo:
                    "O intervalo de manutenção preventiva foi ultrapassado.",

                kmRestante,

                diasRestantes

            };

        }

        /*
         * LIMITES DE ALERTA
         */

        const limiteKm =
            Number(
                CONFIG.preventiva.limiteAlertaKm
            );


        const limiteDias =
            Number(
                CONFIG.preventiva.limiteAlertaDias
            );


        const proximaPorKm =
            temKm &&
            kmRestante !== null &&
            kmRestante > 0 &&
            kmRestante <= limiteKm;


        const proximaPorTempo =
            temDias &&
            diasRestantes !== null &&
            diasRestantes > 0 &&
            diasRestantes <= limiteDias;


        /*
         * PRÓXIMA
         */

        if (
            proximaPorKm ||
            proximaPorTempo
        ) {

            return {

                status:
                    "proxima",

                label:
                    "Próxima",

                motivo:
                    "A manutenção preventiva está próxima do prazo.",

                kmRestante,

                diasRestantes

            };

        }


        /*
         * NORMAL
         */

        return {

            status:
                "normal",

            label:
                "Normal",

            motivo:
                "A manutenção preventiva está dentro do prazo.",

            kmRestante,

            diasRestantes

        };

    },


    /*
     * ANALISAR UMA VIATURA
     */

 analisarViatura(viaturaId) {

    const viatura =
        ViaturaService.buscarPorId(
            viaturaId
        );

    if (!viatura) {
        return [];
    }


        const tipos =
            this.listarTipos()
                .filter(
                    tipo =>
                        tipo.ativo !== false
                );


        return tipos.map(
            tipo => {

                const situacao =
                    this.calcularSituacao(
                        viatura,
                        tipo
                    );


                return {

                    viatura,

                    tipo,

                    status:
                        situacao.status,

                    label:
                        situacao.label,

                    motivo:
                        situacao.motivo,

                    kmRestante:
                        situacao.kmRestante !==
                        undefined
                            ? situacao.kmRestante
                            : null,

                    diasRestantes:
                        situacao.diasRestantes !==
                        undefined
                            ? situacao.diasRestantes
                            : null

                };

            }
        );

    },


    /*
     * RESUMO DA VIATURA
     */

    obterResumoViatura(
        viaturaId
    ) {

        const analises =
            this.analisarViatura(
                viaturaId
            );


        return {

            normal:
                analises.filter(
                    item =>
                        item.status ===
                        "normal"
                ).length,

            proxima:
                analises.filter(
                    item =>
                        item.status ===
                        "proxima"
                ).length,

            atrasada:
                analises.filter(
                    item =>
                        item.status ===
                        "atrasada"
                ).length,

            semPlanejamento:
                analises.filter(
                    item =>
                        item.status ===
                        "sem_planejamento"
                ).length

        };

    },


    /*
     * SITUAÇÃO DA FROTA
     */

    listarSituacaoFrota() {

        const viaturas =
            this.listarViaturas()
                .filter(
                    viatura =>
                        viatura.ativa !== false
                );


        return viaturas.map(
            viatura => {

                const analises =
                    this.analisarViatura(
                        viatura.id
                    );


                let situacao =
                    "normal";


                if (
                    analises.some(
                        item =>
                            item.status ===
                            "atrasada"
                    )
                ) {

                    situacao =
                        "atrasada";

                }  else if (
                    analises.some(
                        item =>
                            item.status ===
                            "proxima"
                    )
                ) {

                    situacao =
                        "proxima";

                } else if (
                    analises.length > 0 &&
                    analises.every(
                        item =>
                            item.status ===
                            "sem_planejamento"
                    )
                ) {

                    situacao =
                        "sem_planejamento";

                }


                return {

                    viatura,

                    situacao,

                    analises

                };

            }
        );

    },


    /*
     * RESUMO DA FROTA
     */

    obterResumoFrota() {

        const lista =
            this.listarSituacaoFrota();


        return {

            normal:
                lista.filter(
                    item =>
                        item.situacao ===
                        "normal"
                ).length,

            proxima:
                lista.filter(
                    item =>
                        item.situacao ===
                        "proxima"
                ).length,

            atrasada:
                lista.filter(
                    item =>
                        item.situacao ===
                        "atrasada"
                ).length,

            semPlanejamento:
                lista.filter(
                    item =>
                        item.situacao ===
                        "sem_planejamento"
                ).length,

            totalViaturas:
                lista.length

        };

    }

};