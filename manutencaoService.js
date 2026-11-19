const ManutencaoService = {

    /*
     * LISTAR MANUTENÇÕES
     */

    listar() {

        return Storage.buscar(
            CONFIG.storage.manutencoes,
            []
        );

    },


    /*
     * BUSCAR POR ID
     */

    buscarPorId(id) {

        const manutencoes =
            this.listar();

        return manutencoes.find(
            manutencao =>
                String(manutencao.id) === String(id)
        ) || null;

    },


    /*
     * LISTAR POR VIATURA
     */

    listarPorViatura(viaturaId) {

        return this.listar()
            .filter(
                manutencao =>
                    String(manutencao.viaturaId) ===
                    String(viaturaId)
            );

    },


    /*
     * LISTAR TIPOS
     */

    listarTipos() {

        return Storage.buscar(
            CONFIG.storage.tiposManutencao,
            []
        );

    },


    /*
     * SALVAR CACHE LOCAL
     */

    salvarTodas(manutencoes) {

        Storage.salvar(
            CONFIG.storage.manutencoes,
            manutencoes
        );

    },


    /*
     * SINCRONIZAR TIPOS COM A API
     */

    async sincronizarTipos() {

        try {

            const resposta =
    await fetch(
        `${CONFIG.api.baseUrl}/tipos-manutencao`,
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
                    "Não foi possível carregar os tipos."
                );

            }

            const tiposBanco =
                resultado.tipos || [];


            const tipos =
                tiposBanco.map(
                    tipoBanco => {

                        return {

                            id:
                                `TIP${String(
                                    tipoBanco.id
                                ).padStart(3, "0")}`,

                            bancoId:
                                Number(
                                    tipoBanco.id
                                ),

                            nome:
                                tipoBanco.nome,

                            intervaloKm:
                                tipoBanco.intervalo_km !== null
                                    ? Number(
                                        tipoBanco.intervalo_km
                                    )
                                    : null,

                            intervaloDias:
                                tipoBanco.intervalo_dias !== null
                                    ? Number(
                                        tipoBanco.intervalo_dias
                                    )
                                    : null,

                            ativo:
                                Boolean(
                                    tipoBanco.ativo
                                ),

                            descricao:
                                tipoBanco.descricao || ""

                        };

                    }
                );


            Storage.salvar(
                CONFIG.storage.tiposManutencao,
                tipos
            );


            return {

                sucesso: true,

                tipos

            };


        } catch (erro) {

            console.error(
                "Erro ao sincronizar tipos de manutenção:",
                erro
            );

            return {

                sucesso: false,

                mensagem:
                    "Não foi possível carregar os tipos de manutenção.",

                erro

            };

        }

    },


    /*
     * SINCRONIZAR MANUTENÇÕES COM A API
     */

    async sincronizar() {

        try {

            const resposta =
    await fetch(
        `${CONFIG.api.baseUrl}/manutencoes`,
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
                    "Não foi possível carregar as manutenções."
                );

            }


            const manutencoesBanco =
                resultado.manutencoes || [];


            const manutencoes =
                manutencoesBanco.map(
                    manutencaoBanco => {

                        /*
                         * Converte o ID da viatura do banco
                         * para a identificação usada pelo frontend.
                         */

                        const viaturaId =
                            String(
                                manutencaoBanco
                                    .viatura_identificacao
                            );


                        /*
                         * Converte o tipo numérico do banco
                         * para o padrão TIP001, TIP002...
                         */

                        const tipoId =
                            `TIP${String(
                                manutencaoBanco.tipo_id
                            ).padStart(3, "0")}`;


                        /*
                         * Converte o responsável numérico
                         * para USR001, USR002...
                         */

                        let responsavelId =
                            null;


                        if (
                            manutencaoBanco.responsavel_id !==
                            null &&
                            manutencaoBanco.responsavel_id !==
                            undefined
                        ) {

                            responsavelId =
                            `USR${String(
                            manutencaoBanco.responsavel_id
                            ).padStart(3, "0")}`;

                            }


                        return {

                            id:
                                String(
                                    manutencaoBanco.id
                                ),

                            bancoId:
                                Number(
                                    manutencaoBanco.id
                                ),

                            viaturaId,

                            tipoId,

                            natureza:
                                manutencaoBanco.natureza,

                            dataAgendada:
                                manutencaoBanco.data,

                            dataConclusao:
                                manutencaoBanco.data_conclusao,

                            quilometragem:
                                manutencaoBanco.quilometragem !== null
                                    ? Number(
                                        manutencaoBanco.quilometragem
                                    )
                                    : null,

                            responsavelId,

                            responsavelNome:
                                manutencaoBanco.responsavel_nome ||
                                null,

                            servico:
                                manutencaoBanco.servico ||
                                "",

                            problema:
                                manutencaoBanco.problema ||
                                "",

                            pecas:
                                manutencaoBanco.pecas ||
                                "",

                            observacoes:
                                manutencaoBanco.observacoes ||
                                "",

                            status:
                                this.converterStatusParaFrontend(
                                    manutencaoBanco.status
                                ),

                            dataCriacao:
                                manutencaoBanco.data_criacao

                        };

                    }
                );


            this.salvarTodas(
                manutencoes
            );


            return {

                sucesso: true,

                manutencoes

            };


        } catch (erro) {

            console.error(
                "Erro ao sincronizar manutenções:",
                erro
            );

            return {

                sucesso: false,

                mensagem:
                    "Não foi possível carregar as manutenções do servidor.",

                erro

            };

        }

    },


    /*
     * CONVERTER STATUS DO BANCO
     * PARA O PADRÃO DO FRONTEND
     */

    converterStatusParaFrontend(status) {

        const mapa = {

            "Agendada":
                "agendada",

            "Em andamento":
                "em_andamento",

            "Concluída":
                "concluida",

            "Cancelada":
                "cancelada"

        };

        return mapa[status] || status;

    },


    /*
     * INICIALIZAR
     */

    async inicializar() {

        /*
         * Mantém os dados iniciais como
         * fallback caso a API esteja indisponível.
         */

        const manutencoes =
            Storage.buscar(
                CONFIG.storage.manutencoes,
                null
            );


        if (!manutencoes) {

            this.salvarTodas(
                manutencoesIniciais
            );

        }


        const tipos =
            Storage.buscar(
                CONFIG.storage.tiposManutencao,
                null
            );


        if (!tipos) {

            Storage.salvar(
                CONFIG.storage.tiposManutencao,
                tiposManutencaoIniciais
            );

        }


        /*
         * Busca os dados reais do banco.
         */

        const resultadoTipos =
            await this.sincronizarTipos();


        const resultadoManutencoes =
            await this.sincronizar();


        return {

            sucesso:
                resultadoTipos.sucesso &&
                resultadoManutencoes.sucesso,

            tipos:
                resultadoTipos.tipos ||
                this.listarTipos(),

            manutencoes:
                resultadoManutencoes.manutencoes ||
                this.listar()

        };

    },


    /*
     * ADICIONAR
     */

    async adicionar(dados) {

        const viatura =
            ViaturaService.buscarPorId(
                dados.viaturaId
            );


        if (!viatura) {

            return {

                sucesso: false,

                mensagem:
                    "Viatura não encontrada."

            };

        }


        if (!dados.tipoId) {

            return {

                sucesso: false,

                mensagem:
                    "Informe o tipo de manutenção."

            };

        }


        if (
            dados.natureza !== "preventiva" &&
            dados.natureza !== "corretiva"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Informe uma natureza de manutenção válida."

            };

        }


        let quilometragem = null;


        if (
            dados.quilometragem !== null &&
            dados.quilometragem !== undefined &&
            dados.quilometragem !== ""
        ) {

            quilometragem =
                Number(
                    dados.quilometragem
                );


            if (
                !Number.isFinite(
                    quilometragem
                ) ||
                quilometragem < 0
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Informe uma quilometragem válida."

                };

            }


            if (
                quilometragem <
                Number(
                    viatura.quilometragem
                )
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "A quilometragem da manutenção não pode ser menor que a quilometragem atual da viatura."

                };

            }

        }


        /*
         * CONVERTER ID DA VIATURA
         */

        const viaturaBancoId =
            viatura.bancoId;


        if (!viaturaBancoId) {

            return {

                sucesso: false,

                mensagem:
                    "Não foi possível identificar a viatura no banco de dados."

            };

        }


        /*
         * CONVERTER ID DO TIPO
         */

        const tipo =
            this.listarTipos().find(
                item =>
                    String(item.id) ===
                    String(dados.tipoId)
            );


        if (
            !tipo ||
            !tipo.bancoId
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Tipo de manutenção não encontrado."

            };

        }


        /*
         * CONVERTER ID DO RESPONSÁVEL
         */

        let responsavelBancoId =
            null;


        if (dados.responsavelId) {

            const textoId =
                String(
                    dados.responsavelId
                );


            const encontrado =
                textoId.match(
                    /(\d+)$/
                );


            if (encontrado) {

                responsavelBancoId =
                    Number(
                        encontrado[1]
                    );

            }

        }


        try {

            const resposta =
               await fetch(
    `${CONFIG.api.baseUrl}/manutencoes`,
    {

                        method:
                            "POST",

                        headers: {
    ...Auth.cabecalhosAutenticados(),
    "Content-Type": "application/json"
},

                        body:
                            JSON.stringify({

                                viaturaId:
                                    viaturaBancoId,

                                tipoId:
                                    tipo.bancoId,

                                responsavelId:
                                    responsavelBancoId,

                                natureza:
                                    dados.natureza,

                                dataAgendada:
                                    dados.dataAgendada ||
                                    null,

                                quilometragem,

                                servico:
                                    (
                                        dados.servico ||
                                        ""
                                    ).trim(),

                                problema:
                                    (
                                        dados.problema ||
                                        ""
                                    ).trim(),

                                pecas:
                                    (
                                        dados.pecas ||
                                        ""
                                    ).trim(),

                                observacoes:
                                    (
                                        dados.observacoes ||
                                        ""
                                    ).trim()

                            })

                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok ||
                !resultado.sucesso
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        resultado.mensagem ||
                        "Não foi possível registrar a manutenção."

                };

            }


            await this.sincronizar();


            return {

                sucesso: true,

                id:
                    String(
                        resultado.id
                    ),

                mensagem:
                    resultado.mensagem,

                manutencao:
                    this.buscarPorId(
                        resultado.id
                    )

            };


        } catch (erro) {

            console.error(
                "Erro ao registrar manutenção:",
                erro
            );

            return {

                sucesso: false,

                mensagem:
                    "Não foi possível conectar ao servidor."

            };

        }

    },


    /*
     * ATUALIZAR STATUS
     */

    async atualizarStatus(
        id,
        status
    ) {

        const statusPermitidos = [
            "agendada",
            "em_andamento",
            "concluida",
            "cancelada"
        ];


        if (
            !statusPermitidos.includes(
                status
            )
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Status da manutenção inválido."

            };

        }


        const manutencao =
            this.buscarPorId(id);


        if (!manutencao) {

            return {

                sucesso: false,

                mensagem:
                    "Manutenção não encontrada."

            };

        }


        try {

            console.log("ID enviado à API:", manutencao.bancoId);
console.log("Status enviado à API:", status);

            const resposta =
                await fetch(
    `${CONFIG.api.baseUrl}/manutencoes/${manutencao.bancoId}/status`,
    {

                        method:
                            "PUT",

                        headers: {
    ...Auth.cabecalhosAutenticados(),
    "Content-Type": "application/json"
},

                        body:
                            JSON.stringify({
                                status
                            })

                    }
                );


            const resultado =
                await resposta.json();

            console.log(
                "Resposta HTTP:",
                resposta.status
            );

            console.log(
                "Resultado da API:",
                resultado
            );

            if (
                !resposta.ok ||
                !resultado.sucesso
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        resultado.mensagem ||
                        "Não foi possível atualizar o status."

                };

            }


            await this.sincronizar();


            /*
             * Atualiza também as viaturas,
             * pois a API pode ter alterado
             * a situação da viatura.
             */

            await ViaturaService.sincronizar();


            return {

                sucesso: true,

                manutencao:
                    this.buscarPorId(id),

                mensagem:
                    resultado.mensagem

            };


        } catch (erro) {

            console.error(
                "Erro ao atualizar status:",
                erro
            );

            return {

                sucesso: false,

                mensagem:
                    "Não foi possível conectar ao servidor."

            };

        }

    },


    /*
     * INICIAR
     */

    async iniciar(id) {

        const manutencao =
            this.buscarPorId(id);


        if (!manutencao) {

            return {

                sucesso: false,

                mensagem:
                    "Manutenção não encontrada."

            };

        }


        if (
            manutencao.status ===
            "concluida"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Esta manutenção já foi concluída."

            };

        }


        if (
            manutencao.status ===
            "cancelada"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Uma manutenção cancelada não pode ser iniciada."

            };

        }


        if (
            manutencao.status ===
            "em_andamento"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Esta manutenção já está em andamento."

            };

        }


        if (
            manutencao.status !==
            "agendada"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Somente uma manutenção agendada pode ser iniciada."

            };

        }


        return this.atualizarStatus(
            id,
            "em_andamento"
        );

    },


    /*
     * CONCLUIR
     */

    async concluir(id) {

        const manutencao =
            this.buscarPorId(id);


        if (!manutencao) {

            return {

                sucesso: false,

                mensagem:
                    "Manutenção não encontrada."

            };

        }


        if (
            manutencao.status ===
            "cancelada"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Uma manutenção cancelada não pode ser concluída."

            };

        }


        if (
            manutencao.status ===
            "concluida"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Esta manutenção já foi concluída."

            };

        }


        if (
            manutencao.status !==
            "em_andamento"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Somente uma manutenção em andamento pode ser concluída."

            };

        }


        return this.atualizarStatus(
            id,
            "concluida"
        );

    },


    /*
     * CANCELAR
     */

    async cancelar(id) {

        const manutencao =
            this.buscarPorId(id);


        if (!manutencao) {

            return {

                sucesso: false,

                mensagem:
                    "Manutenção não encontrada."

            };

        }


        if (
            manutencao.status ===
            "concluida"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Uma manutenção concluída não pode ser cancelada."

            };

        }


        if (
            manutencao.status ===
            "cancelada"
        ) {

            return {

                sucesso: false,

                mensagem:
                    "Esta manutenção já está cancelada."

            };

        }


        return this.atualizarStatus(
            id,
            "cancelada"
        );

    },


    /*
     * COMPATIBILIDADE
     *
     * Mantém o método antigo para
     * evitar quebrar outras partes
     * do sistema.
     */

    atualizarSituacaoViatura(
        viaturaId
    ) {

        return;

    }

};