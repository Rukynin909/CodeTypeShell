class GameMenu {
    constructor(menuSelector = "#Modo") {
        this.menu = document.querySelector(menuSelector);
        this.buttons = this.menu ? Array.from(this.menu.querySelectorAll("button")) : [];
    }

    /* Añade los eventos de hover (y foco con teclado) y de selección a cada botón del menú */
    init() {
        this.buttons.forEach((button) => {
            const icon = button.querySelector("img");
            if (!icon) return;

            const normalSrc = icon.getAttribute("src");
            const selectedSrc = normalSrc.replace(/\.svg$/, "Selected.svg");
            // Se guardan para que selectMode pueda cambiar el icono de cualquier botón
            button.dataset.normalSrc = normalSrc;
            button.dataset.selectedSrc = selectedSrc;

            // Precarga la versión seleccionada para que no parpadee al hacer hover
            new Image().src = selectedSrc;

            const select = () => icon.setAttribute("src", selectedSrc);
            // El botón del modo activo conserva su icono seleccionado
            const unselect = () => {
                if (button.getAttribute("aria-pressed") !== "true") {
                    icon.setAttribute("src", normalSrc);
                }
            };

            button.addEventListener("mouseenter", select);
            button.addEventListener("mouseleave", unselect);
            button.addEventListener("focus", select);
            button.addEventListener("blur", unselect);
            button.addEventListener("click", () => this.selectMode(button));
        });

        // Modo por defecto: el marcado con aria-pressed="true" en el HTML, o el primero (time)
        const initial = this.buttons.find(
            (button) => button.getAttribute("aria-pressed") === "true"
        );
        if (initial || this.buttons[0]) this.selectMode(initial || this.buttons[0]);
    }

    /* Marca el botón elegido como modo activo (solo visual: la lógica está en TypingGame.selectMode) */
    selectMode(selected) {
        this.buttons.forEach((button) => {
            const isSelected = button === selected;
            button.setAttribute("aria-pressed", isSelected);
            const icon = button.querySelector("img");
            if (!icon) return;
            // El botón con foco mantiene el icono de hover aunque no sea el activo
            const keepHover = !isSelected && (button === document.activeElement || button.matches(":hover"));
            if (!keepHover) {
                icon.setAttribute(
                    "src",
                    isSelected ? button.dataset.selectedSrc : button.dataset.normalSrc
                );
            }
        });
    }
}

const gameMenu = new GameMenu();
gameMenu.init();
