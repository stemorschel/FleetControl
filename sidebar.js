document.addEventListener("DOMContentLoaded", () => {
    // O Dashboard já possui seu próprio menu.
    if (window.location.pathname.endsWith("/dashboard.html")) {
        return;
    }

    const menu = document.createElement("aside");
    menu.className = "sidebar sidebar-compartilhada";

    const paginas = [
        { arquivo: "dashboard.html", nome: "Dashboard", id: "" },
        { arquivo: "frota.html", nome: "Frota", id: "cardFrota" },
        { arquivo: "manutencoes.html", nome: "Manutenções", id: "cardManutencoes" },
        { arquivo: "preventivas.html", nome: "Preventivas", id: "cardPreventivas" },
        { arquivo: "usuarios.html", nome: "Usuários", id: "cardUsuarios" },
        { arquivo: "configuracoes.html", nome: "Configurações", id: "cardConfiguracoes" }
    ];

    const paginaAtual = window.location.pathname.split("/").pop();

    menu.innerHTML = `
        <div class="sidebar-header">
            <div class="logo-mark">
                <img src="../assets/logo.png" alt="Logo FleetControl">
            </div>
            <div class="logo-info">
                <strong>FleetControl</strong>
                <span>Gestão de Frota</span>
            </div>
        </div>

        <nav class="sidebar-nav">
            <div class="nav-section-title">PRINCIPAL</div>
            ${paginas.slice(0, 4).map(p => `
                <a href="${p.arquivo}"
                   ${p.id ? `id="${p.id}"` : ""}
                   class="nav-item ${paginaAtual === p.arquivo ? "active" : ""}">
                    <span>${p.nome}</span>
                </a>
            `).join("")}

            <div class="nav-section-title nav-section-secondary">
                ADMINISTRAÇÃO
            </div>
            ${paginas.slice(4).map(p => `
                <a href="${p.arquivo}"
                   id="${p.id}"
                   class="nav-item ${paginaAtual === p.arquivo ? "active" : ""}">
                    <span>${p.nome}</span>
                </a>
            `).join("")}
        </nav>

        <div class="sidebar-footer">
            <div class="system-status">
                <span class="status-dot"></span>
                <div><strong>Sistema ativo</strong></div>
            </div>
        </div>
    `;

    document.body.prepend(menu);
    document.body.classList.add("com-sidebar-compartilhada");
});