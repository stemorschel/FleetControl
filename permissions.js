const PERMISSIONS = {

    dashboard: [
        "administrador",
        "gestor",
        "tecnico"
    ],

    visualizarFrota: [
        "administrador",
        "gestor",
        "tecnico"
    ],

    criarViatura: [
        "administrador",
        "gestor"
    ],

    editarViatura: [
        "administrador",
        "gestor"
    ],

    atualizarQuilometragem: [
        "administrador",
        "gestor",
        "tecnico"
    ],

    visualizarManutencoes: [
        "administrador",
        "gestor",
        "tecnico"
    ],

    registrarManutencao: [
        "administrador",
        "gestor",
        "tecnico"
    ],

    cancelarManutencao: [
        "administrador",
        "gestor"
    ],

    usuarios: [
        "administrador"
    ],

    configuracoes: [
        "administrador"
    ]
};


const Permissions = {

    pode(acao, perfil) {

        if (!PERMISSIONS[acao]) {
            return false;
        }

        return PERMISSIONS[acao].includes(
            perfil
        );
    }

};