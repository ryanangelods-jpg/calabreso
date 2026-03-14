const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

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

// Função de validação de senha forte
function senhaForte(senha) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(senha);
}

// Rota de cadastro
app.post("/register", (req, res) => {
    const { nome, email, senha } = req.body;

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
                        return res.status(500).json({ mensagem: "Erro ao salvar no banco de dados." });
                    }

                    return res.status(201).json({ mensagem: "Cadastro realizado com sucesso." });
                }
            );
        } catch (erro) {
            return res.status(500).json({ mensagem: "Erro ao criptografar a senha." });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});