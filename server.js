require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});
const bcrypt = require("bcrypt");
const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurada em api/.env");
}

const app = express();

// CORS por lista de permissões. Em produção, configure ALLOWED_ORIGINS
// com os domínios exatos do frontend, separados por vírgula.
const ORIGENS_PERMITIDAS = (process.env.ALLOWED_ORIGINS ||
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map(origem => origem.trim())
    .filter(Boolean);

app.disable("x-powered-by");
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    const origem = req.headers.origin;
    if (origem && !ORIGENS_PERMITIDAS.includes(origem)) {
        return res.status(403).json({
            sucesso: false,
            mensagem: "Origem não autorizada."
        });
    }

    if (origem) {
        res.setHeader("Access-Control-Allow-Origin", origem);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

const PORTA = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

// Limite de tamanho para evitar corpos JSON excessivos.
app.use(express.json({ limit: "100kb" }));

// Limitação básica em memória para tentativas de login.
// Em múltiplas instâncias, substitua por um limitador compartilhado (ex.: Redis).
const tentativasLogin = new Map();
const JANELA_LOGIN_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS_LOGIN = 10;
function limitarTentativasLogin(req, res, next) {
    const agora = Date.now();
    const chave = req.ip || req.socket.remoteAddress || "desconhecido";
    let registro = tentativasLogin.get(chave);

    if (!registro || agora - registro.inicio >= JANELA_LOGIN_MS) {
        registro = { inicio: agora, quantidade: 0 };
    }
    registro.quantidade += 1;
    tentativasLogin.set(chave, registro);

    if (registro.quantidade > MAX_TENTATIVAS_LOGIN) {
        const aguardar = Math.ceil((JANELA_LOGIN_MS - (agora - registro.inicio)) / 1000);
        res.setHeader("Retry-After", String(Math.max(1, aguardar)));
        return res.status(429).json({
            sucesso: false,
            mensagem: "Muitas tentativas. Aguarde antes de tentar novamente."
        });
    }
    next();
}

app.use("/api/login", limitarTentativasLogin);

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "fleetcontrol",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use("/api", async (req, res, next) => {
    // Mantém o login e o teste de conexão públicos.
    if (
        req.path === "/login" ||
        req.path === "/teste-banco"
    ) {
        return next();
    }

    const autorizacao = req.headers.authorization;

    if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Autenticação necessária."
        });
    }

    const token = autorizacao.split(" ")[1];

    try {
        const usuarioToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const [usuariosAtivos] = await pool.query(
            "SELECT id, perfil FROM usuario WHERE id = ? AND ativo = 1 LIMIT 1",
            [usuarioToken.usuarioId]
        );

        if (usuariosAtivos.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário inativo ou não encontrado."
            });
        }

        req.usuario = {
    ...usuarioToken,
    perfil: usuariosAtivos[0].perfil
};
        next();

    } catch (erro) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Token inválido ou expirado."
        });
    }
});

function exigirPerfil(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Você não tem permissão para realizar esta ação."
            });
        }

        next();
    };
}

async function validarAlteracaoAdministrador(
    usuarioAlvo,
    perfilNovo,
    ativoNovo,
    usuarioLogadoId
) {

    const ehProprioUsuario =
        Number(usuarioAlvo.id) === Number(usuarioLogadoId);

    if (ehProprioUsuario && !ativoNovo) {
        return "Você não pode inativar o próprio usuário.";
    }

    if (ehProprioUsuario && perfilNovo !== "administrador") {
        return "Você não pode remover o perfil de administrador do próprio usuário.";
    }

    const perdeAdministrador =
        usuarioAlvo.perfil === "administrador" &&
        Number(usuarioAlvo.ativo) === 1 &&
        (!ativoNovo || perfilNovo !== "administrador");

    if (!perdeAdministrador) {
        return null;
    }

    const [outrosAdmins] = await pool.query(
        `
        SELECT id
        FROM usuario
        WHERE perfil = 'administrador'
          AND ativo = 1
          AND id <> ?
        LIMIT 1
        `,
        [usuarioAlvo.id]
    );

    if (outrosAdmins.length === 0) {
        return "O sistema deve manter pelo menos um administrador ativo.";
    }

    return null;
}


// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.json({
        mensagem:
            "API FleetControl funcionando."
    });

});


// ==========================================
// TESTE DO BANCO
// ==========================================

app.get("/api/teste-banco", async (req, res) => {

    try {

        const [resultado] =
            await pool.query(
                "SELECT 1 AS conectado"
            );

        res.json({

            sucesso: true,

            mensagem:
                "Conexão com o banco realizada com sucesso.",

            resultado

        });

    } catch (erro) {

        console.error(
            "Erro ao conectar ao banco:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Não foi possível conectar ao banco.",

        });

    }

});


// ==========================================
// USUÁRIOS
// ==========================================

// ==========================================
// LISTAR USUÁRIOS
// ==========================================

app.get(
    "/api/usuarios",
    exigirPerfil("administrador", "gestor", "tecnico"),
    async (req, res) => {
    try {

        const perfil = req.usuario.perfil;

const [usuarios] = perfil === "administrador"
    ? await pool.query(`
        SELECT id, nome, usuario, perfil, ativo, data_cadastro
        FROM usuario
        ORDER BY id
    `)
    : await pool.query(`
        SELECT id, nome, usuario, perfil, ativo, data_cadastro
        FROM usuario
        WHERE perfil = ?
        ORDER BY id
    `, [perfil]);

        res.json({

            sucesso: true,

            usuarios

        });

    } catch (erro) {

        console.error(
            "Erro ao buscar usuários:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao buscar usuários.",

        });

    }

});


// ==========================================
// CADASTRAR USUÁRIO
// ==========================================

app.post("/api/usuarios", exigirPerfil("administrador"), async (req, res) => {

    try {

        const {
            nome,
            usuario,
            senha,
            perfil,
            ativo
        } = req.body;


        // ==========================================
        // VALIDAR CAMPOS
        // ==========================================

        if (
            !nome ||
            !usuario ||
            !senha ||
            !perfil
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Nome, usuário, senha e perfil são obrigatórios."

            });

        }


        // ==========================================
        // NORMALIZAR DADOS
        // ==========================================

        const nomeBanco =
            String(nome).trim();

        const usuarioBanco =
            String(usuario)
                .trim()
                .toLowerCase();

        const senhaBanco =
    await bcrypt.hash(String(senha), 10);

        const perfilBanco =
            String(perfil)
                .trim()
                .toLowerCase();


        // ==========================================
        // VALIDAR PERFIL
        // ==========================================

        const perfisPermitidos = [
            "administrador",
            "gestor",
            "tecnico"
        ];


        if (
            !perfisPermitidos.includes(
                perfilBanco
            )
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Perfil de usuário inválido."

            });

        }


        // ==========================================
        // VERIFICAR USUÁRIO DUPLICADO
        // ==========================================

        const [usuarioExistente] =
            await pool.query(
                `
                SELECT id
                FROM usuario
                WHERE usuario = ?
                LIMIT 1
                `,
                [
                    usuarioBanco
                ]
            );


        if (
            usuarioExistente.length > 0
        ) {

            return res.status(409).json({

                sucesso: false,

                mensagem:
                    "Já existe um usuário cadastrado com este nome de usuário."

            });

        }


        // ==========================================
        // STATUS ATIVO
        // ==========================================

        const ativoBanco =
            ativo === undefined
                ? 1
                : ativo
                    ? 1
                    : 0;


        // ==========================================
        // INSERIR
        // ==========================================

        const [resultado] =
            await pool.query(
                `
                INSERT INTO usuario
                (
                    nome,
                    usuario,
                    senha,
                    perfil,
                    ativo,
                    data_cadastro
                )
                VALUES
                (?, ?, ?, ?, ?, NOW())
                `,
                [
                    nomeBanco,
                    usuarioBanco,
                    senhaBanco,
                    perfilBanco,
                    ativoBanco
                ]
            );


        res.status(201).json({

            sucesso: true,

            mensagem:
                "Usuário cadastrado com sucesso.",

            id:
                resultado.insertId

        });


    } catch (erro) {

        console.error(
            "Erro ao cadastrar usuário:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao cadastrar usuário.",

        });

    }

});


// ==========================================
// ATUALIZAR USUÁRIO
// ==========================================

app.put("/api/usuarios/:id", exigirPerfil("administrador"), async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        const {
            nome,
            usuario,
            senha,
            perfil,
            ativo
        } = req.body;


        // ==========================================
        // VALIDAR ID
        // ==========================================

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "ID do usuário inválido."

            });

        }


        // ==========================================
        // BUSCAR USUÁRIO ATUAL
        // ==========================================

        const [usuarioAtual] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    usuario,
                    senha,
                    perfil,
                    ativo
                FROM usuario
                WHERE id = ?
                LIMIT 1
                `,
                [
                    id
                ]
            );


        if (
            usuarioAtual.length === 0
        ) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Usuário não encontrado."

            });

        }


        const usuarioBanco =
            usuario !== undefined
                ? String(usuario)
                    .trim()
                    .toLowerCase()
                : usuarioAtual[0].usuario;


        const nomeBanco =
            nome !== undefined
                ? String(nome).trim()
                : usuarioAtual[0].nome;


        const perfilBanco =
            perfil !== undefined
                ? String(perfil)
                    .trim()
                    .toLowerCase()
                : usuarioAtual[0].perfil;


        const ativoBanco =
            ativo !== undefined
                ? (ativo ? 1 : 0)
                : usuarioAtual[0].ativo;


        // ==========================================
        // VALIDAR CAMPOS
        // ==========================================

        if (
            !nomeBanco ||
            !usuarioBanco ||
            !perfilBanco
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Nome, usuário e perfil são obrigatórios."

            });

        }


        // ==========================================
        // VALIDAR PERFIL
        // ==========================================

        const perfisPermitidos = [
            "administrador",
            "gestor",
            "tecnico"
        ];


        if (
            !perfisPermitidos.includes(
                perfilBanco
            )
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Perfil de usuário inválido."

            });

        }


        const erroAdministrador =
            await validarAlteracaoAdministrador(
                usuarioAtual[0],
                perfilBanco,
                ativoBanco === 1,
                req.usuario.usuarioId
            );

        if (erroAdministrador) {

            return res.status(400).json({
                sucesso: false,
                mensagem: erroAdministrador
            });

        }


        // ==========================================
        // VERIFICAR USUÁRIO DUPLICADO
        // ==========================================

        const [outroUsuario] =
            await pool.query(
                `
                SELECT id
                FROM usuario
                WHERE usuario = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    usuarioBanco,
                    id
                ]
            );


        if (
            outroUsuario.length > 0
        ) {

            return res.status(409).json({

                sucesso: false,

                mensagem:
                    "Já existe outro usuário com este nome de usuário."

            });

        }


        // ==========================================
        // SENHA
        // ==========================================

        let senhaBanco;


        if (
            senha !== undefined &&
            String(senha).trim() !== ""
        ) {

            senhaBanco =
    await bcrypt.hash(String(senha), 10);

        } else {

            senhaBanco =
                usuarioAtual[0].senha;

        }


        // ==========================================
        // ATUALIZAR
        // ==========================================

        const [resultado] =
            await pool.query(
                `
                UPDATE usuario
                SET
                    nome = ?,
                    usuario = ?,
                    senha = ?,
                    perfil = ?,
                    ativo = ?
                WHERE id = ?
                `,
                [
                    nomeBanco,
                    usuarioBanco,
                    senhaBanco,
                    perfilBanco,
                    ativoBanco,
                    id
                ]
            );


        if (
            resultado.affectedRows === 0
        ) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Usuário não encontrado."

            });

        }


        res.json({

            sucesso: true,

            mensagem:
                "Usuário atualizado com sucesso."

        });


    } catch (erro) {

        console.error(
            "Erro ao atualizar usuário:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao atualizar usuário.",

        });

    }

});


// ==========================================
// ALTERAR STATUS DO USUÁRIO
// ==========================================

app.put(
    "/api/usuarios/:id/status",
    exigirPerfil("administrador"),
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const ativo =
                req.body.ativo;


            // ==========================================
            // VALIDAR ID
            // ==========================================

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "ID do usuário inválido."

                });

            }


            // ==========================================
            // VALIDAR STATUS
            // ==========================================

            if (
                ativo === undefined ||
                ativo === null
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Informe o status do usuário."

                });

            }


            const ativoBanco =
                ativo ? 1 : 0;


            // ==========================================
            // VERIFICAR USUÁRIO
            // ==========================================

            const [usuarios] =
                await pool.query(
                    `
                    SELECT id, perfil, ativo
                    FROM usuario
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        id
                    ]
                );


            if (
                usuarios.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Usuário não encontrado."

                });

            }


            const erroAdministrador =
                await validarAlteracaoAdministrador(
                    usuarios[0],
                    usuarios[0].perfil,
                    ativoBanco === 1,
                    req.usuario.usuarioId
                );

            if (erroAdministrador) {

                return res.status(400).json({
                    sucesso: false,
                    mensagem: erroAdministrador
                });

            }


            // ==========================================
            // ATUALIZAR STATUS
            // ==========================================

            await pool.query(
                `
                UPDATE usuario
                SET ativo = ?
                WHERE id = ?
                `,
                [
                    ativoBanco,
                    id
                ]
            );


            res.json({

                sucesso: true,

                mensagem:
                    ativoBanco
                        ? "Usuário ativado com sucesso."
                        : "Usuário inativado com sucesso."

            });


        } catch (erro) {

            console.error(
                "Erro ao alterar status do usuário:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao alterar status do usuário.",

            });

        }

    }
);


// ==========================================
// VIATURAS
// ==========================================

app.get("/api/viaturas", exigirPerfil("administrador", "gestor", "tecnico"), async (req, res) => {

    try {

        const [viaturas] =
            await pool.query(`
                SELECT
                    id,
                    identificacao,
                    placa,
                    marca,
                    modelo,
                    ano,
                    quilometragem,
                    setor,
                    status,
                    ativa,
                    data_cadastro
                FROM viatura
                ORDER BY id
            `);

        res.json({

            sucesso: true,

            viaturas

        });

    } catch (erro) {

        console.error(
            "Erro ao buscar viaturas:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao buscar viaturas.",

        });

    }

});


// ==========================================
// CADASTRAR VIATURA
// ==========================================

app.post("/api/viaturas", exigirPerfil("administrador", "gestor"), async (req, res) => {

    try {

        const {
            identificacao,
            placa,
            marca,
            modelo,
            ano,
            quilometragem,
            setor
        } = req.body;


        if (
            !identificacao ||
            !placa ||
            !marca ||
            !modelo ||
            !ano ||
            quilometragem === undefined ||
            quilometragem === null ||
            !setor
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Todos os campos obrigatórios devem ser preenchidos."

            });

        }


        const identificacaoBanco =
            String(identificacao)
                .trim()
                .toUpperCase()
                .replace(/-/g, "");


        const placaBanco =
            String(placa)
                .trim()
                .toUpperCase()
                .replace(/-/g, "");


        const [existente] =
            await pool.query(
                `
                SELECT id
                FROM viatura
                WHERE identificacao = ?
                   OR placa = ?
                LIMIT 1
                `,
                [
                    identificacaoBanco,
                    placaBanco
                ]
            );


        if (existente.length > 0) {

            return res.status(409).json({

                sucesso: false,

                mensagem:
                    "Já existe uma viatura cadastrada com esta identificação ou placa."

            });

        }


        const [resultado] =
            await pool.query(
                `
                INSERT INTO viatura
                (
                    identificacao,
                    placa,
                    marca,
                    modelo,
                    ano,
                    quilometragem,
                    setor,
                    status,
                    ativa,
                    data_cadastro
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `,
                [
                    identificacaoBanco,
                    placaBanco,
                    String(marca).trim(),
                    String(modelo).trim(),
                    Number(ano),
                    Number(quilometragem),
                    String(setor).trim(),
                    "Disponível",
                    1
                ]
            );


        res.status(201).json({

            sucesso: true,

            mensagem:
                "Viatura cadastrada com sucesso.",

            id:
                resultado.insertId

        });


    } catch (erro) {

        console.error(
            "Erro ao cadastrar viatura:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao cadastrar viatura.",

        });

    }

});


// ==========================================
// ATUALIZAR VIATURA
// ==========================================

	app.put("/api/viaturas/:id", exigirPerfil("administrador", "gestor"), async (req, res) => {
    try {

        const id =
            Number(req.params.id);


        const {
            identificacao,
            placa,
            marca,
            modelo,
            ano,
            quilometragem,
            setor,
            status,
            ativa
        } = req.body;


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "ID da viatura inválido."

            });

        }


        const [viaturaAtual] =
            await pool.query(
                `
                SELECT
                    quilometragem
                FROM viatura
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );


        if (
            viaturaAtual.length === 0
        ) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Viatura não encontrada."

            });

        }


        const quilometragemAtual =
            Number(
                viaturaAtual[0].quilometragem
            );


        if (
            quilometragem === undefined ||
            quilometragem === null ||
            !Number.isFinite(
                Number(quilometragem)
            ) ||
            Number(quilometragem) < 0
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe uma quilometragem válida."

            });

        }


        if (
            Number(quilometragem) <
            quilometragemAtual
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    `A quilometragem não pode diminuir. Quilometragem atual: ${quilometragemAtual} km.`

            });

        }


        if (
            !identificacao ||
            !placa ||
            !marca ||
            !modelo ||
            !ano ||
            !setor ||
            !status ||
            ativa === undefined
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Todos os campos obrigatórios devem ser preenchidos."

            });

        }


        const identificacaoBanco =
            String(identificacao)
                .trim()
                .toUpperCase()
                .replace(/-/g, "");


        const placaBanco =
            String(placa)
                .trim()
                .toUpperCase()
                .replace(/-/g, "");


        const statusMap = {

            disponivel:
                "Disponível",

            em_manutencao:
                "Em manutenção",

            indisponivel:
                "Indisponível",

            "Disponível":
                "Disponível",

            "Em manutenção":
                "Em manutenção",

            "Indisponível":
                "Indisponível"

        };


        const statusBanco =
            statusMap[status];


        if (!statusBanco) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Status da viatura inválido."

            });

        }


        const [outraViatura] =
            await pool.query(
                `
                SELECT id
                FROM viatura
                WHERE
                    (
                        identificacao = ?
                        OR placa = ?
                    )
                    AND id <> ?
                LIMIT 1
                `,
                [
                    identificacaoBanco,
                    placaBanco,
                    id
                ]
            );


        if (
            outraViatura.length > 0
        ) {

            return res.status(409).json({

                sucesso: false,

                mensagem:
                    "Já existe outra viatura com esta identificação ou placa."

            });

        }


        const [resultado] =
            await pool.query(
                `
                UPDATE viatura
                SET
                    identificacao = ?,
                    placa = ?,
                    marca = ?,
                    modelo = ?,
                    ano = ?,
                    quilometragem = ?,
                    setor = ?,
                    status = ?,
                    ativa = ?
                WHERE id = ?
                `,
                [
                    identificacaoBanco,
                    placaBanco,
                    String(marca).trim(),
                    String(modelo).trim(),
                    Number(ano),
                    Number(quilometragem),
                    String(setor).trim(),
                    statusBanco,
                    ativa ? 1 : 0,
                    id
                ]
            );


        if (
            resultado.affectedRows === 0
        ) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Viatura não encontrada."

            });

        }


        res.json({

            sucesso: true,

            mensagem:
                "Viatura atualizada com sucesso."

        });


    } catch (erro) {

        console.error(
            "Erro ao atualizar viatura:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao atualizar viatura.",

        });

    }

});


// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", async (req, res) => {

    try {

        const {
            usuario,
            senha
        } = req.body;


        if (
            !usuario ||
            !senha
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Usuário e senha são obrigatórios."

            });

        }


        const [usuarios] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    usuario,
                    senha,
                    perfil,
                    ativo
                FROM usuario
                WHERE usuario = ?
                  AND ativo = 1
                LIMIT 1
                `,
                [String(usuario).trim().toLowerCase()]
            );


        if (
            usuarios.length === 0
        ) {

            return res.status(401).json({

                sucesso: false,

                mensagem:
                    "Usuário ou senha inválidos."

            });

        }


        const usuarioEncontrado =
            usuarios[0];


        const senhaArmazenada = usuarioEncontrado.senha;

let senhaValida = false;

if (
    /^\$2[aby]\$/.test(senhaArmazenada)
) {
    senhaValida = await bcrypt.compare(
        senha,
        senhaArmazenada
    );
} else {
    senhaValida = senhaArmazenada === senha;

    if (senhaValida) {
        const senhaHash = await bcrypt.hash(senha, 10);

        await pool.query(
            "UPDATE usuario SET senha = ? WHERE id = ?",
            [senhaHash, usuarioEncontrado.id]
        );
    }
}

if (!senhaValida) {
    return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário ou senha inválidos."
    });
}


        const sessao = {

            usuarioId:
                usuarioEncontrado.id,

            nome:
                usuarioEncontrado.nome,

            usuario:
                usuarioEncontrado.usuario,

            perfil:
                usuarioEncontrado.perfil

        };

        const token = jwt.sign(
    {
        usuarioId: sessao.usuarioId,
        perfil: sessao.perfil
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
);

        res.json({

            sucesso: true,
            token: token,

            mensagem:
                "Login realizado com sucesso.",

            usuario:
                sessao

        });


    } catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro interno ao realizar login.",

        });

    }

});


// ==========================================
// BUSCAR VIATURA POR IDENTIFICAÇÃO
// ==========================================

app.get(
    "/api/viaturas/identificacao/:identificacao",
    async (req, res) => {

        try {

            const identificacao =
                req.params.identificacao
                    .trim()
                    .toUpperCase()
                    .replace(/-/g, "");


            const [viaturas] =
                await pool.query(
                    `
                    SELECT
                        id,
                        identificacao,
                        placa,
                        marca,
                        modelo,
                        ano,
                        quilometragem,
                        setor,
                        status,
                        ativa,
                        data_cadastro
                    FROM viatura
                    WHERE identificacao = ?
                    LIMIT 1
                    `,
                    [identificacao]
                );


            if (
                viaturas.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Viatura não encontrada."

                });

            }


            res.json({

                sucesso: true,

                viatura:
                    viaturas[0]

            });


        } catch (erro) {

            console.error(
                "Erro ao buscar viatura:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao buscar viatura.",

            });

        }

    }
);


// ==========================================
// ATUALIZAR QUILOMETRAGEM
// ==========================================

app.put(
    "/api/viaturas/:id/quilometragem",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const novaQuilometragem =
                Number(
                    req.body.quilometragem
                );


            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "ID da viatura inválido."

                });

            }


            if (
                !Number.isFinite(
                    novaQuilometragem
                ) ||
                novaQuilometragem < 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Informe uma quilometragem válida."

                });

            }


            const [viaturas] =
                await pool.query(
                    `
                    SELECT
                        id,
                        quilometragem
                    FROM viatura
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [id]
                );


            if (
                viaturas.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Viatura não encontrada."

                });

            }


            const quilometragemAtual =
                Number(
                    viaturas[0].quilometragem
                );


            if (
                novaQuilometragem <
                quilometragemAtual
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "A nova quilometragem não pode ser menor que a quilometragem atual."

                });

            }


            await pool.query(
                `
                UPDATE viatura
                SET quilometragem = ?
                WHERE id = ?
                `,
                [
                    novaQuilometragem,
                    id
                ]
            );


            res.json({

                sucesso: true,

                mensagem:
                    "Quilometragem atualizada com sucesso.",

                quilometragem:
                    novaQuilometragem

            });


        } catch (erro) {

            console.error(
                "Erro ao atualizar quilometragem:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao atualizar quilometragem.",

            });

        }

    }
);


// ==========================================
// TIPOS DE MANUTENÇÃO
// ==========================================

app.get(
    "/api/tipos-manutencao",
    async (req, res) => {

        try {

            const [tipos] =
                await pool.query(`
                    SELECT
                        id,
                        nome,
                        intervalo_km,
                        intervalo_dias,
                        ativo,
                        descricao
                    FROM tipo_manutencao
                    ORDER BY id
                `);


            res.json({

                sucesso: true,

                tipos

            });


        } catch (erro) {

            console.error(
                "Erro ao buscar tipos de manutenção:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao buscar tipos de manutenção.",
            });

        }

    }
);


// ==========================================
// LISTAR MANUTENÇÕES
// ==========================================

app.get(
    "/api/manutencoes",
    async (req, res) => {

        try {

            const [manutencoes] =
                await pool.query(`
                    SELECT
                        m.id,
                        m.viatura_id,
                        v.identificacao AS viatura_identificacao,
                        v.placa AS viatura_placa,

                        m.tipo_id,
                        tm.nome AS tipo_nome,
                        tm.intervalo_km,
                        tm.intervalo_dias,

                        m.responsavel_id,
                        u.nome AS responsavel_nome,

                        m.natureza,
                        m.data,
                        m.data_conclusao,
                        m.quilometragem,
                        m.servico,
                        m.problema,
                        m.pecas,
                        m.status,
                        m.observacoes,
                        m.data_criacao

                    FROM manutencao m

                    INNER JOIN viatura v
                        ON v.id = m.viatura_id

                    INNER JOIN tipo_manutencao tm
                        ON tm.id = m.tipo_id

                    LEFT JOIN usuario u
                        ON u.id = m.responsavel_id

                    ORDER BY m.id
                `);


            res.json({

                sucesso: true,

                manutencoes

            });


        } catch (erro) {

            console.error(
                "Erro ao buscar manutenções:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao buscar manutenções.",
            });

        }

    }
);


// ==========================================
// CADASTRAR MANUTENÇÃO
// ==========================================

app.post(
    "/api/manutencoes",
    async (req, res) => {

        try {

            const {
                viaturaId,
                tipoId,
                responsavelId,
                natureza,
                dataAgendada,
                quilometragem,
                servico,
                problema,
                pecas,
                observacoes
            } = req.body;


            const viaturaBancoId =
                Number(viaturaId);


            const tipoBancoId =
                Number(tipoId);


            const responsavelBancoId =
                responsavelId
                    ? Number(responsavelId)
                    : null;


            const km =
                Number(
                    quilometragem
                );


            if (
                !Number.isInteger(
                    viaturaBancoId
                ) ||
                viaturaBancoId <= 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Viatura inválida."

                });

            }


            if (
                !Number.isInteger(
                    tipoBancoId
                ) ||
                tipoBancoId <= 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Tipo de manutenção inválido."

                });

            }


            if (
                natureza !== "preventiva" &&
                natureza !== "corretiva"
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Natureza de manutenção inválida."

                });

            }


            if (
                !Number.isFinite(km) ||
                km < 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Informe uma quilometragem válida."

                });

            }


            const [viaturas] =
                await pool.query(
                    `
                    SELECT
                        id,
                        quilometragem,
                        ativa
                    FROM viatura
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        viaturaBancoId
                    ]
                );

            if (
                viaturas.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Viatura não encontrada."

                });

            }

            if (
                Number(viaturas[0].ativa) !== 1
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Não é possível cadastrar uma manutenção para uma viatura inativa."

                });

            }


            const quilometragemAtual =
                Number(
                    viaturas[0].quilometragem
                );


            if (
                km <
                quilometragemAtual
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "A quilometragem da manutenção não pode ser menor que a quilometragem atual da viatura."

                });

            }


            const [tipos] =
                await pool.query(
                    `
                    SELECT id
                    FROM tipo_manutencao
                    WHERE id = ?
                      AND ativo = 1
                    LIMIT 1
                    `,
                    [
                        tipoBancoId
                    ]
                );


            if (
                tipos.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Tipo de manutenção não encontrado ou inativo."

                });

            }


            if (
                responsavelBancoId !== null
            ) {

                const [usuarios] = await pool.query(
    `
    SELECT id, perfil
    FROM usuario
    WHERE id = ?
      AND ativo = 1
    LIMIT 1
    `,
    [responsavelBancoId]
);


                if (
                    usuarios.length === 0
                ) {

                    return res.status(404).json({

                        sucesso: false,

                        mensagem:
                            "Responsável não encontrado ou inativo."

                    });

                }

                if (
    req.usuario.perfil !== "administrador" &&
    usuarios[0].perfil !== req.usuario.perfil
) {
    return res.status(403).json({
        sucesso: false,
        mensagem:
            "Você só pode selecionar responsáveis do seu próprio perfil."
    });
}

            }


            const dataBanco =
                dataAgendada
                    ? `${dataAgendada} 00:00:00`
                    : new Date();


            const [resultado] =
                await pool.query(
                    `
                    INSERT INTO manutencao
                    (
                        viatura_id,
                        tipo_id,
                        responsavel_id,
                        natureza,
                        data,
                        data_conclusao,
                        quilometragem,
                        servico,
                        problema,
                        pecas,
                        status,
                        observacoes,
                        data_criacao
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        NULL,
                        ?,
                        ?,
                        ?,
                        ?,
                        'Agendada',
                        ?,
                        NOW()
                    )
                    `,
                    [
                        viaturaBancoId,
                        tipoBancoId,
                        responsavelBancoId,
                        natureza,
                        dataBanco,
                        km,
                        String(
                            servico || ""
                        ).trim(),
                        String(
                            problema || ""
                        ).trim(),
                        String(
                            pecas || ""
                        ).trim(),
                        String(
                            observacoes || ""
                        ).trim()
                    ]
                );


            res.status(201).json({

                sucesso: true,

                mensagem:
                    "Manutenção registrada com sucesso.",

                id:
                    resultado.insertId

            });


        } catch (erro) {

            console.error(
                "Erro ao cadastrar manutenção:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao cadastrar manutenção.",

            });

        }

    }
);


// ==========================================
// ATUALIZAR STATUS DA MANUTENÇÃO
// ==========================================

app.put(
    "/api/manutencoes/:id/status",
    async (req, res) => {

        const conexao =
            await pool.getConnection();

        try {

            const id =
                Number(req.params.id);


            const status =
                req.body.status;


            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "ID da manutenção inválido."

                });

            }


            const statusMap = {

                agendada:
                    "Agendada",

                em_andamento:
                    "Em andamento",

                concluida:
                    "Concluída",

                cancelada:
                    "Cancelada"

            };


            const statusBanco =
                statusMap[status];


            if (
                !statusBanco
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Status da manutenção inválido."

                });

            }

            if (
    statusBanco === "Cancelada" &&
    !["administrador", "gestor"].includes(
        req.usuario?.perfil
    )
) {
    return res.status(403).json({
        sucesso: false,
        mensagem:
            "Você não tem permissão para cancelar esta manutenção."
    });
}

            await conexao.beginTransaction();


            const [manutencoes] =
                await conexao.query(
                    `
                    SELECT
                        id,
                        viatura_id,
                        status,
                        quilometragem
                    FROM manutencao
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [
                        id
                    ]
                );


            if (
                manutencoes.length === 0
            ) {

                await conexao.rollback();

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Manutenção não encontrada."

                });

            }


            const manutencao =
                manutencoes[0];

                const transicoesPermitidas = {
    "Agendada": ["Em andamento", "Cancelada"],
    "Em andamento": ["Concluída", "Cancelada"],
    "Concluída": [],
    "Cancelada": []
};

if (
    !transicoesPermitidas[manutencao.status] ||
    !transicoesPermitidas[manutencao.status].includes(statusBanco)
) {
    await conexao.rollback();

    return res.status(400).json({
        sucesso: false,
        mensagem: "Transição de status não permitida."
    });
}

            let quilometragemConclusao = null;


            if (
                statusBanco === "Concluída" &&
                manutencao.status !== "Concluída"
            ) {

                const temQuilometragem =
                    manutencao.quilometragem !== null &&
                    manutencao.quilometragem !== undefined &&
                    manutencao.quilometragem !== "";

                const kmManutencao =
                    temQuilometragem
                        ? Number(manutencao.quilometragem)
                        : NaN;

                if (
                    !Number.isFinite(kmManutencao) ||
                    kmManutencao < 0
                ) {

                    await conexao.rollback();

                    return res.status(400).json({

                        sucesso: false,

                        mensagem:
                            "A manutenção não possui uma quilometragem válida."

                    });

                }


                const [viaturas] =
                    await conexao.query(
                        `
                        SELECT
                            id,
                            quilometragem
                        FROM viatura
                        WHERE id = ?
                        FOR UPDATE
                        `,
                        [
                            manutencao.viatura_id
                        ]
                    );


                if (viaturas.length === 0) {

                    await conexao.rollback();

                    return res.status(404).json({

                        sucesso: false,

                        mensagem:
                            "Viatura não encontrada."

                    });

                }


                const kmAtual =
                    Number(viaturas[0].quilometragem);


                if (
                    !Number.isFinite(kmAtual) ||
                    kmManutencao < kmAtual
                ) {

                    await conexao.rollback();

                    return res.status(400).json({

                        sucesso: false,

                        mensagem:
                            "A quilometragem da manutenção não pode ser menor que a quilometragem atual da viatura."

                    });

                }


                quilometragemConclusao =
                    kmManutencao;

            }


            if (
                manutencao.status ===
                    "Cancelada" &&
                statusBanco ===
                    "Em andamento"
            ) {

                await conexao.rollback();

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Uma manutenção cancelada não pode ser iniciada."

                });

            }


            let dataConclusao =
                null;


            if (
                statusBanco ===
                "Concluída"
            ) {

                dataConclusao =
                    new Date();

            }


            await conexao.query(
                `
                UPDATE manutencao
                SET
                    status = ?,
                    data_conclusao = ?
                WHERE id = ?
                `,
                [
                    statusBanco,
                    dataConclusao,
                    id
                ]
            );


            if (quilometragemConclusao !== null) {

                await conexao.query(
                    `
                    UPDATE viatura
                    SET quilometragem = ?
                    WHERE id = ?
                    `,
                    [
                        quilometragemConclusao,
                        manutencao.viatura_id
                    ]
                );

            }


            const [manutencoesAtivas] =
                await conexao.query(
                    `
                    SELECT id
                    FROM manutencao
                    WHERE viatura_id = ?
                      AND status = 'Em andamento'
                    LIMIT 1
                    `,
                    [
                        manutencao.viatura_id
                    ]
                );


            if (
                statusBanco ===
                "Em andamento"
            ) {

                await conexao.query(
                    `
                    UPDATE viatura
                    SET status = 'Em manutenção'
                    WHERE id = ?
                    `,
                    [
                        manutencao.viatura_id
                    ]
                );

            } else if (
                manutencoesAtivas.length === 0
            ) {

                await conexao.query(
                    `
                    UPDATE viatura
                    SET status = 'Disponível'
                    WHERE id = ?
                      AND status = 'Em manutenção'
                    `,
                    [
                        manutencao.viatura_id
                    ]
                );

            }


            await conexao.commit();


            res.json({

                sucesso: true,

                mensagem:
                    "Status da manutenção atualizado com sucesso."

            });


        } catch (erro) {

            try {
                await conexao.rollback();
            } catch (erroRollback) {
                console.error(
                    "Erro ao desfazer transação:",
                    erroRollback
                );
            }


            console.error(
                "Erro ao atualizar status da manutenção:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro ao atualizar status da manutenção.",
            });


        } finally {

            conexao.release();

        }

    }
);


// ==========================================
// ADMINISTRADOR PADRÃO
// ==========================================

const ADMIN_PADRAO = {
    nome: process.env.ADMIN_NAME || "Administrador",
    usuario: process.env.ADMIN_EMAIL?.trim(),
    senha: process.env.ADMIN_PASSWORD
};

async function garantirAdministradorPadrao() {

    try {

        if (!ADMIN_PADRAO.usuario || !ADMIN_PADRAO.senha) {
            console.warn(
                "Administrador inicial não criado: configure ADMIN_EMAIL e ADMIN_PASSWORD em api/.env."
            );
            return;
        }

        if (ADMIN_PADRAO.senha.length < 12) {
            console.warn(
                "Administrador inicial não criado: ADMIN_PASSWORD deve ter pelo menos 12 caracteres."
            );
            return;
        }

        const [existentes] =
            await pool.query(
                "SELECT id FROM usuario WHERE usuario = ? LIMIT 1",
                [ADMIN_PADRAO.usuario]
            );

        if (existentes.length > 0) {
            return;
        }

        const senhaHash =
            await bcrypt.hash(ADMIN_PADRAO.senha, 10);

        await pool.query(
            `
            INSERT INTO usuario
            (nome, usuario, senha, perfil, ativo, data_cadastro)
            VALUES (?, ?, ?, 'administrador', 1, NOW())
            `,
            [
                ADMIN_PADRAO.nome,
                ADMIN_PADRAO.usuario,
                senhaHash
            ]
        );

        console.log(
            `Administrador padrão criado: ${ADMIN_PADRAO.usuario}`
        );

    } catch (erro) {

        console.error(
            "Não foi possível garantir o administrador padrão:",
            erro.message
        );

    }

}


// ==========================================
// INICIAR SERVIDOR
// ==========================================

garantirAdministradorPadrao().finally(() => {

    app.listen(
        PORTA,
        HOST,
        () => {
            console.log(`API FleetControl rodando em http://${HOST}:${PORTA}`);
        }
    );

});