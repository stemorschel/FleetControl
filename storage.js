const Storage = {

    salvar(chave, dados) {

        localStorage.setItem(
            chave,
            JSON.stringify(dados)
        );

    },


    buscar(chave, valorPadrao = null) {

        const dados =
            localStorage.getItem(chave);


        if (!dados) {
            return valorPadrao;
        }


        try {

            return JSON.parse(dados);

        } catch (erro) {

            console.error(
                `Erro ao ler ${chave}:`,
                erro
            );

            return valorPadrao;
        }

    },


    remover(chave) {

        localStorage.removeItem(
            chave
        );

    },


    existe(chave) {

        return (
            localStorage.getItem(chave)
            !== null
        );

    }

};