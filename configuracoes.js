document.addEventListener("DOMContentLoaded", () => {

    if (!Auth.exigirPermissao("configuracoes")) {
        return;
    }


    const sessao =
        Auth.obterSessao();


    const usuarioNome =
        document.getElementById(
            "usuarioNome"
        );

    const usuarioPerfil =
        document.getElementById(
            "usuarioPerfil"
        );


    if (sessao) {

        usuarioNome.textContent =
            sessao.nome;

        usuarioPerfil.textContent =
            `Perfil: ${sessao.perfil}`;

    }


    ConfigService.aplicar();


    const configuracoes =
        ConfigService.obter();


    document.getElementById(
        "nomeSistema"
    ).value =
        configuracoes.nomeSistema;


    document.getElementById(
        "limiteAlertaKm"
    ).value =
        configuracoes.limiteAlertaKm;


    document.getElementById(
        "limiteAlertaDias"
    ).value =
        configuracoes.limiteAlertaDias;


    document.getElementById(
        "btnVoltar"
    ).addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );


    document.getElementById(
        "configuracoesForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const nomeSistema =
                document.getElementById(
                    "nomeSistema"
                ).value.trim();


            const limiteAlertaKm =
                Number(
                    document.getElementById(
                        "limiteAlertaKm"
                    ).value
                );


            const limiteAlertaDias =
                Number(
                    document.getElementById(
                        "limiteAlertaDias"
                    ).value
                );


            const mensagem =
                document.getElementById(
                    "mensagemConfiguracoes"
                );


            if (
                nomeSistema === "" ||
                limiteAlertaKm < 0 ||
                limiteAlertaDias < 0
            ) {

                mensagem.textContent =
                    "Informe valores válidos.";

                mensagem.className =
                    "mensagem-formulario erro";

                return;

            }


            ConfigService.salvar({

                nomeSistema:
                    nomeSistema,

                limiteAlertaKm:
                    limiteAlertaKm,

                limiteAlertaDias:
                    limiteAlertaDias

            });


            ConfigService.aplicar();


            mensagem.textContent =
                "Configurações salvas com sucesso.";

            mensagem.className =
                "mensagem-formulario sucesso";

        }
    );

});