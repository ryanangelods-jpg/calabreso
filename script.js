const nomeInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const btnRegistrar = document.getElementById("btnRegistrar");
const toggleSenha = document.getElementById("toggleSenha");
const video = document.getElementById("bgVideo");
const btnSom = document.getElementById("ativarSom");

function mostrarSenha() {
    senhaInput.type = "text";
}

function esconderSenha() {
    senhaInput.type = "password";
}

toggleSenha.addEventListener("mousedown", mostrarSenha);
toggleSenha.addEventListener("mouseup", esconderSenha);
toggleSenha.addEventListener("mouseleave", esconderSenha);

toggleSenha.addEventListener("touchstart", (e) => {
    e.preventDefault();
    mostrarSenha();
}, { passive: false });

toggleSenha.addEventListener("touchend", esconderSenha);

if (video && btnSom) {
    video.muted = true;

    btnSom.addEventListener("click", async () => {
        try {
            video.muted = !video.muted;
            video.volume = 1;
            await video.play();
            btnSom.textContent = video.muted ? "Ativar som" : "Desativar som";
        } catch (erro) {
            alert("O navegador bloqueou o som.");
        }
    });
}

function senhaForte(senha) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(senha);
}

btnRegistrar.addEventListener("click", async () => {
    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!nome || !email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    if (!senhaForte(senha)) {
        alert("A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.");
        return;
    }

    try {
        const resposta = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        alert("Agora você é um Calabreso! 😎");

        nomeInput.value = "";
        emailInput.value = "";
        senhaInput.value = "";
    } catch (erro) {
        console.error(erro);
        alert("Erro ao conectar com o servidor.");
    }
});