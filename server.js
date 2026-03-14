const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

// Banco de dados
const db = new sqlite3.Database("./calabreso.db", (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Banco de dados conectado com sucesso.");
    }
});

// Criar tabela
db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL
    )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Validação de senha forte
function senhaForte(senha) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(senha);
}

// Cadastro
app.post("/register", (req, res) => {
    const { nome, email, senha } = req.body;

    console.log("Dados recebidos:", { nome, email });

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Preencha todos os campos." });
    }

    if (!senhaForte(senha)) {
        return res.status(400).json({
            mensagem: "A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial."
        });
    }

    db.get("SELECT id FROM usuarios WHERE email = ?", [email], async (err, row) => {
        if (err) {
            console.error("Erro ao verificar email:", err);
            return res.status(500).json({ mensagem: "Erro ao verificar email." });
        }

        if (row) {
            return res.status(400).json({ mensagem: "Este email já foi utilizado." });
        }

        try {
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            db.run(
                "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
                [nome, email, senhaCriptografada],
                function (err) {
                    if (err) {
                        console.error("Erro ao salvar no banco:", err);
                        return res.status(500).json({ mensagem: "Erro ao salvar no banco de dados." });
                    }

                    console.log("Usuário salvo com sucesso:", nome, email);

                    return res.status(201).json({
                        mensagem: "Cadastro realizado com sucesso."
                    });
                }
            );

        } catch (erro) {
            console.error("Erro ao criptografar senha:", erro);
            return res.status(500).json({
                mensagem: "Erro ao criptografar a senha."
            });
        }
    });
});

// JSON dos usuários
app.get("/usuarios", (req, res) => {
    db.all("SELECT id, nome, email FROM usuarios ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: err.message });
        }

        res.json(rows);
    });
});

// Página bonita admin
app.get("/admin", (req, res) => {
    db.all("SELECT id, nome, email FROM usuarios ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).send("<h1>Erro ao carregar usuários.</h1>");
        }

        const total = rows.length;

        const cards = rows.length > 0
            ? rows.map(usuario => `
                <div class="user-card">
                    <div class="user-top">
                        <div class="avatar">${usuario.nome.charAt(0).toUpperCase()}</div>
                        <div>
                            <h3>${usuario.nome}</h3>
                            <p>${usuario.email}</p>
                        </div>
                    </div>
                    <div class="user-id">ID: ${usuario.id}</div>
                </div>
            `).join("")
            : `<div class="vazio">Nenhum calabreso cadastrado ainda.</div>`;

        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Painel dos Calabresos</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet">
                <style>
                    *{
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: "Lexend", sans-serif;
                    }

                    body{
                        min-height: 100vh;
                        background:
                            linear-gradient(rgba(58,19,16,0.72), rgba(58,19,16,0.82)),
                            url('/assets/erasebg-transformed.png') no-repeat top right / 180px,
                            linear-gradient(135deg, rgb(128, 44, 38), rgb(58, 19, 16));
                        color: white;
                        padding: 24px;
                    }

                    .container{
                        max-width: 1100px;
                        margin: 0 auto;
                    }

                    .topo{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 16px;
                        flex-wrap: wrap;
                        margin-bottom: 28px;
                    }

                    .titulo h1{
                        font-size: 2.2rem;
                        color: rgb(255, 214, 161);
                        margin-bottom: 8px;
                    }

                    .titulo p{
                        color: rgb(255, 232, 205);
                    }

                    .badge{
                        background-color: rgba(255,255,255,0.14);
                        border: 1px solid rgba(255,255,255,0.2);
                        padding: 14px 18px;
                        border-radius: 16px;
                        backdrop-filter: blur(10px);
                        min-width: 180px;
                        text-align: center;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.18);
                    }

                    .badge span{
                        display: block;
                        font-size: 0.9rem;
                        color: rgb(255, 230, 210);
                        margin-bottom: 5px;
                    }

                    .badge strong{
                        font-size: 1.8rem;
                        color: rgb(255, 214, 161);
                    }

                    .painel{
                        background-color: rgba(255,255,255,0.08);
                        border: 1px solid rgba(255,255,255,0.18);
                        border-radius: 24px;
                        padding: 22px;
                        backdrop-filter: blur(12px);
                        box-shadow: 0 12px 30px rgba(0,0,0,0.22);
                    }

                    .painel-header{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: wrap;
                        margin-bottom: 20px;
                    }

                    .painel-header h2{
                        color: rgb(255, 214, 161);
                        font-size: 1.4rem;
                    }

                    .acoes{
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }

                    .btn{
                        text-decoration: none;
                        color: white;
                        background-color: rgba(255,255,255,0.12);
                        border: 1px solid rgba(255,255,255,0.2);
                        padding: 10px 14px;
                        border-radius: 14px;
                        transition: 0.3s;
                    }

                    .btn:hover{
                        background-color: rgba(255,255,255,0.22);
                    }

                    .grid{
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 16px;
                    }

                    .user-card{
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.16);
                        border-radius: 20px;
                        padding: 16px;
                        box-shadow: 0 8px 18px rgba(0,0,0,0.16);
                        transition: transform 0.25s ease, box-shadow 0.25s ease;
                    }

                    .user-card:hover{
                        transform: translateY(-4px);
                        box-shadow: 0 14px 26px rgba(0,0,0,0.24);
                    }

                    .user-top{
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 14px;
                    }

                    .avatar{
                        width: 52px;
                        height: 52px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, rgb(235, 54, 9), rgb(255, 166, 0));
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 1.2rem;
                        color: white;
                        flex-shrink: 0;
                    }

                    .user-card h3{
                        font-size: 1.05rem;
                        color: white;
                        margin-bottom: 4px;
                        word-break: break-word;
                    }

                    .user-card p{
                        font-size: 0.92rem;
                        color: rgb(255, 230, 210);
                        word-break: break-word;
                    }

                    .user-id{
                        display: inline-block;
                        margin-top: 4px;
                        padding: 8px 12px;
                        border-radius: 999px;
                        background-color: rgba(0,0,0,0.18);
                        color: rgb(255, 214, 161);
                        font-size: 0.88rem;
                    }

                    .vazio{
                        text-align: center;
                        padding: 40px 20px;
                        border-radius: 18px;
                        background-color: rgba(255,255,255,0.08);
                        color: rgb(255, 232, 205);
                        font-size: 1rem;
                    }

                    @media (max-width: 768px){
                        body{
                            padding: 16px;
                            background-size: 120px;
                        }

                        .titulo h1{
                            font-size: 1.7rem;
                        }

                        .painel{
                            padding: 16px;
                            border-radius: 18px;
                        }

                        .badge{
                            width: 100%;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="topo">
                        <div class="titulo">
                            <h1>Painel dos Calabresos</h1>
                            <p>Visualize todos os usuários cadastrados no seu site.</p>
                        </div>

                        <div class="badge">
                            <span>Total de calabresos</span>
                            <strong>${total}</strong>
                        </div>
                    </div>

                    <div class="painel">
                        <div class="painel-header">
                            <h2>Usuários cadastrados</h2>

                            <div class="acoes">
                                <a class="btn" href="/">Voltar ao site</a>
                                <a class="btn" href="/usuarios" target="_blank">Ver JSON</a>
                            </div>
                        </div>

                        <div class="grid">
                            ${cards}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});