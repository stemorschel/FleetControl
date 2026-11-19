const ConfigService = {

    obter() {

        const configuracoes =
            Storage.buscar(
                CONFIG.storage.configuracoes,
                null
            );

        if (!configuracoes) {

            const padrao = {
                nomeSistema: CONFIG.sistema.nome,
                limiteAlertaKm:
                    CONFIG.preventiva.limiteAlertaKm,
                limiteAlertaDias:
                    CONFIG.preventiva.limiteAlertaDias
            };

            Storage.salvar(
                CONFIG.storage.configuracoes,
                padrao
            );

            return padrao;
        }

        return configuracoes;
    },


    salvar(configuracoes) {

        Storage.salvar(
            CONFIG.storage.configuracoes,
            configuracoes
        );

        return configuracoes;
    },


    aplicar() {

        const configuracoes =
            this.obter();

        CONFIG.sistema.nome =
            configuracoes.nomeSistema;

        CONFIG.preventiva.limiteAlertaKm =
            Number(
                configuracoes.limiteAlertaKm
            );

        CONFIG.preventiva.limiteAlertaDias =
            Number(
                configuracoes.limiteAlertaDias
            );

        return configuracoes;
    }

};