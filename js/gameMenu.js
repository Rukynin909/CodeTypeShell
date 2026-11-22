class GameMenu {
    constructor(menuSelector = "#Modo") {
        this.menu = document.querySelector(menuSelector);
        this.buttons = this.menu ? Array.from(this.menu.querySelectorAll("button")) : [];
    }

    /* Añade los eventos de hover (y foco con teclado) a cada botón del menú */
    init() {
        this.buttons.forEach((button) => {
            const icon = button.querySelector("img");
            if (!icon) return;

            const normalSrc = icon.getAttribute("src");
            const selectedSrc = normalSrc.replace(/\.svg$/, "Selected.svg");

            // Precarga la versión seleccionada para que no parpadee al hacer hover
            new Image().src = selectedSrc;

            const select = () => icon.setAttribute("src", selectedSrc);
            const unselect = () => icon.setAttribute("src", normalSrc);

            button.addEventListener("mouseenter", select);
            button.addEventListener("mouseleave", unselect);
            button.addEventListener("focus", select);
            button.addEventListener("blur", unselect);
        });
    }
}

const gameMenu = new GameMenu();
gameMenu.init();
