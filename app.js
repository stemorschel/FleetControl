document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (!loginForm) {

            return;

        }


        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const usuario =
                    document
                        .getElementById(
                            "usuario"
                        )
                        .value
                        .trim();


                const senha =
                    document
                        .getElementById(
                            "senha"
                        )
                        .value;


                const mensagem =
                    document.getElementById(
                        "loginMensagem"
                    );


                const botao =
                    loginForm.querySelector(
                        "button[type='submit']"
                    );


                botao.disabled = true;

                botao.textContent =
                    "Entrando...";


                const resultado =
                    await Auth.login(
                        usuario,
                        senha
                    );


                if (!resultado.sucesso) {

                    mensagem.textContent =
                        resultado.mensagem;

                    mensagem.className =
                        "login-mensagem erro";

                    botao.disabled = false;

                    botao.textContent =
                        "Entrar";

                    return;

                }


                mensagem.textContent =
                    "Login realizado com sucesso.";


                mensagem.className =
                    "login-mensagem sucesso";


                setTimeout(
                    () => {

                        window.location.href =
                            "pages/dashboard.html";

                    },
                    400
                );

            }
        );

    }
);