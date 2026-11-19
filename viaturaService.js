const ViaturaService = {

API_URL: CONFIG.api.baseUrl,


    listar() {

        return Storage.buscar(
            CONFIG.storage.viaturas,
            []
        );

    },


    buscarPorId(id) {

        const viaturas =
            this.listar();

        return viaturas.find(
            viatura =>
                String(viatura.id) ===
                String(id)
        ) || null;

    },


    buscarPorPlaca(placa) {

        const viaturas =
            this.listar();

        const placaNormalizada =
            String(placa || "")
                .trim()
                .toUpperCase()
                .replace("-", "");


        return viaturas.find(
            viatura => {

                const placaViatura =
                    String(
                        viatura.placa || ""
                    )
                        .trim()
                        .toUpperCase()
                        .replace("-", "");


                return (
                    placaViatura ===
                    placaNormalizada
                );

            }
        ) || null;

    },


    salvarTodas(viaturas) {

        Storage.salvar(
            CONFIG.storage.viaturas,
            viaturas
        );

    },


    async inicializar() {

        /*
         * O banco/API é a fonte principal.
         *
         * O localStorage continua sendo utilizado
         * somente como cache para manter compatibilidade
         * com as telas existentes.
         */

        const sincronizacao =
            await this.sincronizar();


        if (
            !sincronizacao.sucesso
        ) {

            /*
             * Se a API estiver indisponível,
             * preservamos os dados locais existentes.
             *
             * Isso evita que a interface fique
             * completamente vazia durante uma falha
             * temporária do servidor.
             */

            const viaturas =
                Storage.buscar(
                    CONFIG.storage.viaturas,
                    null
                );


            if (!viaturas) {

                this.salvarTodas(
                    viaturasIniciais
                );

            }

        }


        return sincronizacao;

    },


    async sincronizar() {

        try {

const resposta =
    await fetch(
        `${this.API_URL}/viaturas`,
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

                return {

                    sucesso:
                        false,

                    mensagem:
                        resultado.mensagem ||
                        "Não foi possível sincronizar as viaturas."

                };

            }


            const viaturasBanco =
                Array.isArray(
                    resultado.viaturas
                )
                    ? resultado.viaturas
                    : [];


            const viaturas =
                viaturasBanco.map(
                    viatura => {

                        const identificacaoBanco =
                            String(
                                viatura.identificacao ||
                                ""
                            )
                                .trim()
                                .toUpperCase();


                        const placaBanco =
                            String(
                                viatura.placa ||
                                ""
                            )
                                .trim()
                                .toUpperCase();


                        let status =
                            viatura.status;


                        if (
                            status ===
                            "Disponível"
                        ) {

                            status =
                                "disponivel";

                        }


                        if (
                            status ===
                            "Em manutenção"
                        ) {

                            status =
                                "em_manutencao";

                        }


                        if (
                            status ===
                            "Indisponível"
                        ) {

                            status =
                                "indisponivel";

                        }


                        return {

                            /*
                             * O id utilizado pela interface
                             * continua sendo a identificação
                             * da viatura.
                             */

                            id:
                                identificacaoBanco,


                            /*
                             * bancoId guarda o ID numérico
                             * verdadeiro do MySQL.
                             */

                            bancoId:
                                Number(
                                    viatura.id
                                ),


                            identificacao:
                                identificacaoBanco
                                    .replace(
                                        /^VTR(?=\d)/,
                                        "VTR-"
                                    ),


                            placa:
                                placaBanco.length === 7
                                    ? placaBanco.substring(
                                        0,
                                        3
                                    ) +
                                    "-" +
                                    placaBanco.substring(
                                        3
                                    )
                                    : placaBanco,


                            marca:
                                viatura.marca,


                            modelo:
                                viatura.modelo,


                            ano:
                                Number(
                                    viatura.ano
                                ),


                            quilometragem:
                                Number(
                                    viatura.quilometragem
                                ),


                            setor:
                                viatura.setor,


                            status:
                                status,


                            ativa:
    viatura.ativa === true ||
    Number(viatura.ativa) === 1,


                            dataCadastro:
                                viatura.data_cadastro

                        };

                    }
                );


            /*
             * Atualiza o cache local com o estado
             * atual do banco.
             */

            this.salvarTodas(
                viaturas
            );


            return {

                sucesso:
                    true,

                viaturas:
                    viaturas

            };

        } catch (erro) {

            console.error(
                "Erro ao sincronizar viaturas:",
                erro
            );


            return {

                sucesso:
                    false,

                mensagem:
                    "Não foi possível conectar ao servidor."

            };

        }

    },


    async buscarPorIdentificacaoAPI(
        identificacao
    ) {

        try {

            const identificacaoNormalizada =
                String(
                    identificacao
                )
                    .trim()
                    .toUpperCase()
                    .replace(
                        "-",
                        ""
                    );


            const resposta =
                await fetch(
                    `${this.API_URL}/viaturas/identificacao/${encodeURIComponent(
                        identificacaoNormalizada
                    )}`,
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

                return {

                    sucesso:
                        false,

                    mensagem:
                        resultado.mensagem ||
                        "Viatura não encontrada."

                };

            }


            const viatura =
                resultado.viatura;


            let status =
                viatura.status;


            if (
                status ===
                "Disponível"
            ) {

                status =
                    "disponivel";

            }


            if (
                status ===
                "Em manutenção"
            ) {

                status =
                    "em_manutencao";

            }


            if (
                status ===
                "Indisponível"
            ) {

                status =
                    "indisponivel";

            }


            const identificacaoBanco =
                String(
                    viatura.identificacao
                )
                    .trim()
                    .toUpperCase();


            const placaBanco =
                String(
                    viatura.placa ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            return {

                sucesso:
                    true,

                viatura: {

                    id:
                        identificacaoBanco,

                    bancoId:
                        Number(
                            viatura.id
                        ),

                    identificacao:
                        identificacaoBanco
                            .replace(
                                /^VTR(?=\d)/,
                                "VTR-"
                            ),

                    placa:
                        placaBanco.length === 7
                            ? placaBanco.substring(
                                0,
                                3
                            ) +
                            "-" +
                            placaBanco.substring(
                                3
                            )
                            : placaBanco,

                    marca:
                        viatura.marca,

                    modelo:
                        viatura.modelo,

                    ano:
                        Number(
                            viatura.ano
                        ),

                    quilometragem:
                        Number(
                            viatura.quilometragem
                        ),

                    setor:
                        viatura.setor,

                    status:
                        status,

                    ativa:
    viatura.ativa === true ||
    Number(viatura.ativa) === 1,

                    dataCadastro:
                        viatura.data_cadastro

                }

            };

        } catch (erro) {

            console.error(
                "Erro ao buscar viatura na API:",
                erro
            );


            return {

                sucesso:
                    false,

                mensagem:
                    "Não foi possível conectar ao servidor."

            };

        }

    },


    async atualizarQuilometragemNaAPI(
        id,
        novaQuilometragem
    ) {

        let viatura =
            this.buscarPorId(id);


        if (!viatura) {

            const sincronizacao =
                await this.sincronizar();


            if (
                !sincronizacao.sucesso
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        sincronizacao.mensagem

                };

            }


            viatura =
                this.buscarPorId(id);

        }


        if (
            !viatura ||
            !viatura.bancoId
        ) {

            return {

                sucesso:
                    false,

                mensagem:
                    "Não foi possível identificar a viatura no banco."

            };

        }


        const novaKm =
            Number(
                novaQuilometragem
            );


        if (
            !Number.isFinite(novaKm) ||
            novaKm < 0
        ) {

            return {

                sucesso:
                    false,

                mensagem:
                    "Informe uma quilometragem válida."

            };

        }


        if (
            novaKm <
            Number(
                viatura.quilometragem
            )
        ) {

            return {

                sucesso:
                    false,

                mensagem:
                    "A nova quilometragem não pode ser menor que a quilometragem atual."

            };

        }


        try {

            const resposta =
                await fetch(
                    `${this.API_URL}/viaturas/${viatura.bancoId}/quilometragem`,
                    {
                        method:
                            "PUT",

                        headers: {
                            ...Auth.cabecalhosAutenticados(),
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                quilometragem:
                                    novaKm
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

                    sucesso:
                        false,

                    mensagem:
                        resultado.mensagem ||
                        "Não foi possível atualizar a quilometragem."

                };

            }


            /*
             * Depois de atualizar o MySQL,
             * sincroniza novamente o cache local.
             *
             * Assim todas as telas passam a trabalhar
             * com a mesma quilometragem.
             */

            await this.sincronizar();


            return {

                sucesso:
                    true,

                mensagem:
                    "Quilometragem atualizada com sucesso."

            };

        } catch (erro) {

            console.error(
                "Erro ao atualizar quilometragem:",
                erro
            );


            return {

                sucesso:
                    false,

                mensagem:
                    "Não foi possível conectar ao servidor."

            };

        }

    },


    async adicionarNaAPI(
        dados
    ) {

        try {

            const dadosAPI = {

                identificacao:
                    String(
                        dados.identificacao ||
                        ""
                    )
                        .trim()
                        .toUpperCase()
                        .replace(
                            "-",
                            ""
                        ),

                placa:
                    String(
                        dados.placa ||
                        ""
                    )
                        .trim()
                        .toUpperCase()
                        .replace(
                            "-",
                            ""
                        ),

                marca:
                    String(
                        dados.marca ||
                        ""
                    )
                        .trim(),

                modelo:
                    String(
                        dados.modelo ||
                        ""
                    )
                        .trim(),

                ano:
                    Number(
                        dados.ano
                    ),

                quilometragem:
                    Number(
                        dados.quilometragem
                    ),

                setor:
                    String(
                        dados.setor ||
                        ""
                    )
                        .trim(),

                status:
                    dados.status ||
                    "disponivel",

                ativa:
                    dados.ativa !==
                    undefined
                        ? Boolean(
                            dados.ativa
                        )
                        : true

            };


            const resposta =
                await fetch(
                    `${this.API_URL}/viaturas`,
                    {
                        method:
                            "POST",

                        headers: {
                            ...Auth.cabecalhosAutenticados(),
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                dadosAPI
                            )

                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok ||
                !resultado.sucesso
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        resultado.mensagem ||
                        "Não foi possível cadastrar a viatura."

                };

            }


            await this.sincronizar();


            return {

                sucesso:
                    true,

                mensagem:
                    "Viatura cadastrada com sucesso.",

                viatura:
                    resultado.viatura

            };

        } catch (erro) {

            console.error(
                "Erro ao cadastrar viatura na API:",
                erro
            );


            return {

                sucesso:
                    false,

                mensagem:
                    "Não foi possível conectar ao servidor."

            };

        }

    },


    async atualizarNaAPI(
        id,
        dadosAtualizados
    ) {

        let viatura =
            this.buscarPorId(id);


        if (!viatura) {

            const sincronizacao =
                await this.sincronizar();


            if (
                !sincronizacao.sucesso
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        sincronizacao.mensagem

                };

            }


            viatura =
                this.buscarPorId(id);

        }


        if (
            !viatura ||
            !viatura.bancoId
        ) {

            return {

                sucesso:
                    false,

                mensagem:
                    "Não foi possível identificar a viatura no banco."

            };

        }


        if (
            dadosAtualizados.quilometragem !==
            undefined
        ) {

            const novaKm =
                Number(
                    dadosAtualizados.quilometragem
                );


            if (
                !Number.isFinite(novaKm) ||
                novaKm < 0
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        "Informe uma quilometragem válida."

                };

            }


            if (
                novaKm <
                Number(
                    viatura.quilometragem
                )
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        "A nova quilometragem não pode ser menor que a quilometragem atual."

                };

            }

        }


        try {

            const dadosAPI = {};


            if (
                dadosAtualizados.identificacao !==
                undefined
            ) {

                dadosAPI.identificacao =
                    dadosAtualizados.identificacao
                        .trim()
                        .toUpperCase();

            }


            if (
                dadosAtualizados.placa !==
                undefined
            ) {

                dadosAPI.placa =
                    dadosAtualizados.placa
                        .trim()
                        .toUpperCase();

            }


            if (
                dadosAtualizados.marca !==
                undefined
            ) {

                dadosAPI.marca =
                    dadosAtualizados.marca
                        .trim();

            }


            if (
                dadosAtualizados.modelo !==
                undefined
            ) {

                dadosAPI.modelo =
                    dadosAtualizados.modelo
                        .trim();

            }


            if (
                dadosAtualizados.ano !==
                undefined
            ) {

                dadosAPI.ano =
                    Number(
                        dadosAtualizados.ano
                    );

            }


            if (
                dadosAtualizados.quilometragem !==
                undefined
            ) {

                dadosAPI.quilometragem =
                    Number(
                        dadosAtualizados.quilometragem
                    );

            }


            if (
                dadosAtualizados.setor !==
                undefined
            ) {

                dadosAPI.setor =
                    dadosAtualizados.setor
                        .trim();

            }


            if (
                dadosAtualizados.status !==
                undefined
            ) {

                dadosAPI.status =
                    dadosAtualizados.status;

            }


            if (
                dadosAtualizados.ativa !==
                undefined
            ) {

                dadosAPI.ativa =
                    dadosAtualizados.ativa;

            }


            const resposta =
                await fetch(
                    `${this.API_URL}/viaturas/${viatura.bancoId}`,
                    {
                        method:
                            "PUT",

                        headers: {
                            ...Auth.cabecalhosAutenticados(),
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                dadosAPI
                            )

                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok ||
                !resultado.sucesso
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        resultado.mensagem ||
                        "Não foi possível atualizar a viatura."

                };

            }


            await this.sincronizar();


            return {

                sucesso:
                    true,

                mensagem:
                    "Viatura atualizada com sucesso."

            };

        } catch (erro) {

            console.error(
                "Erro ao atualizar viatura na API:",
                erro
            );


            return {

                sucesso:
                    false,

                mensagem:
                    "Não foi possível conectar ao servidor."

            };

        }

    },


    /*
     * Funções locais mantidas para compatibilidade
     * com partes antigas do sistema.
     *
     * As telas novas devem utilizar as funções
     * que trabalham com a API.
     */

    adicionar(
        dados
    ) {

        const viaturas =
            this.listar();


        const placaExistente =
            this.buscarPorPlaca(
                dados.placa
            );


        if (
            placaExistente
        ) {

            return {

                sucesso:
                    false,

                mensagem:
                    "Já existe uma viatura cadastrada com esta placa."

            };

        }


        const identificacaoExistente =
            viaturas.find(
                viatura =>
                    String(
                        viatura.identificacao
                    )
                        .replace(
                            "-",
                            ""
                        )
                        .toUpperCase() ===
                    String(
                        dados.identificacao
                    )
                        .replace(
                            "-",
                            ""
                        )
                        .toUpperCase()
            );


        if (
            identificacaoExistente
        ) {

            return {

                sucesso:
                    false,

                mensagem:
                    "Já existe uma viatura cadastrada com esta identificação."

            };

        }


        const novaViatura = {

            id:
                dados.identificacao,

            identificacao:
                dados.identificacao,

            placa:
                dados.placa,

            marca:
                dados.marca,

            modelo:
                dados.modelo,

            ano:
                Number(
                    dados.ano
                ),

            quilometragem:
                Number(
                    dados.quilometragem
                ),

            setor:
                dados.setor,

            status:
                dados.status ||
                "disponivel",

            ativa:
                dados.ativa !==
                undefined
                    ? Boolean(
                        dados.ativa
                    )
                    : true,

            dataCadastro:
                dados.dataCadastro ||
                new Date()
                    .toISOString()

        };


        viaturas.push(
            novaViatura
        );


        this.salvarTodas(
            viaturas
        );


        return {

            sucesso:
                true,

            viatura:
                novaViatura

        };

    },


    atualizar(
        id,
        dadosAtualizados
    ) {

        const viaturas =
            this.listar();


        const indice =
            viaturas.findIndex(
                viatura =>
                    String(
                        viatura.id
                    ) ===
                    String(id)
            );


        if (
            indice === -1
        ) {

            return {

                sucesso:
                    false,

                mensagem:
                    "Viatura não encontrada."

            };

        }


        const viaturaAtual =
            viaturas[indice];


        if (
            dadosAtualizados.quilometragem !==
            undefined
        ) {

            const novaKm =
                Number(
                    dadosAtualizados.quilometragem
                );


            if (
                !Number.isFinite(
                    novaKm
                ) ||
                novaKm < 0
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        "Informe uma quilometragem válida."

                };

            }


            if (
                novaKm <
                Number(
                    viaturaAtual.quilometragem
                )
            ) {

                return {

                    sucesso:
                        false,

                    mensagem:
                        "A nova quilometragem não pode ser menor que a quilometragem atual."

                };

            }

        }


        viaturas[indice] = {

            ...viaturaAtual,
            ...dadosAtualizados

        };


        if (
            dadosAtualizados.placa
        ) {

            viaturas[indice].placa =
                dadosAtualizados.placa
                    .trim()
                    .toUpperCase();

        }


        this.salvarTodas(
            viaturas
        );


        return {

            sucesso:
                true,

            viatura:
                viaturas[indice]

        };

    },


async atualizarQuilometragem(
    id,
    novaQuilometragem
) {

    return this.atualizarQuilometragemNaAPI(
        id,
        novaQuilometragem
    );

},


    desativar(
        id
    ) {

        return this.atualizar(
            id,
            {
                ativa:
                    false
            }
        );

    },


    ativar(
        id
    ) {

        return this.atualizar(
            id,
            {
                ativa:
                    true
            }
        );

    }

};