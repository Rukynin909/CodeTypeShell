class TypingGame {
    constructor() {
        this.lines = [];
        this.lineIndex = 0;
        this.charIndex = 0;
        this.displayCharacters = null;
        this.caretElement = null;
        this.scoreTracker = new ScoreTracker();
        this.timerId = null;
        this.language = "java";
    }

    /* Conecta el botón de lenguaje con su diálogo desplegable */
    setupLanguageMenu() {
        const button = document.getElementById("lenguage-button");
        const dialog = document.getElementById("dialogo");
        const list = document.getElementById("lista");
        if (!button || !dialog || !list) return;

        const options = Array.from(list.querySelectorAll("li"));
        options.forEach((option) => {
            option.setAttribute("role", "option");
            option.tabIndex = 0;
            option.setAttribute(
                "aria-selected",
                option.textContent.trim() === this.language
            );
        });

        button.setAttribute("aria-haspopup", "listbox");
        button.addEventListener("click", () => {
            // showModal lo saca a la capa superior: así no lo recorta el overflow del recuadro
            dialog.showModal();
            const rect = button.getBoundingClientRect();
            dialog.style.left = `${rect.left}px`;
            dialog.style.top = `${rect.bottom + 6}px`;
            const selected = options.find(
                (option) => option.getAttribute("aria-selected") === "true"
            );
            (selected || options[0]).focus();
        });

        // Clic fuera de la lista (en el fondo del modal) cierra el diálogo
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) dialog.close();
        });

        list.addEventListener("click", (event) => {
            const option = event.target.closest("li");
            if (option) this.selectLanguage(option, options, button, dialog);
        });

        list.addEventListener("keydown", (event) => {
            const index = options.indexOf(document.activeElement);
            if (event.key === "ArrowDown") {
                event.preventDefault();
                options[(index + 1) % options.length].focus();
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                options[(index - 1 + options.length) % options.length].focus();
            } else if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                // Evita que la tecla llegue al juego una vez cerrado el diálogo
                event.stopPropagation();
                if (index !== -1) {
                    this.selectLanguage(options[index], options, button, dialog);
                }
            }
        });
    }

    /* Marca el lenguaje elegido, actualiza el botón y cierra el diálogo */
    selectLanguage(option, options, button, dialog) {
        this.language = option.textContent.trim();
        options.forEach((item) =>
            item.setAttribute("aria-selected", item === option)
        );
        button.textContent = this.language;
        dialog.close();
        this.loadCode();
        this.restart();
    }

    /* Carga las lineas de codigo al textArea desde el Json */
    async loadCode() {
        const response = await fetch("js/"+this.language+".json");
        if (!response.ok) {
            throw new Error(`No se pudo cargar java.json: ${response.status}`);
        }

        const codeData = await response.json();
        this.lines = codeData.lineas.map(
            (line) => codeData.indentacion.repeat(line.nivel) + line.piezas.join(" ")
        );

        const textArea = document.getElementById("text-to-type");
        if (!textArea) {
            throw new Error("No se encontró el textarea #text-to-type");
        }

        const codeText = this.lines.join("\n");
        textArea.value = codeText;
        textArea.style.color = "var(--gris-claro)";
        textArea.addEventListener("focus", () => this.updateCaret());
        textArea.addEventListener("click", () => this.updateCaret());
        this.updateCaret();
    }

    /* Juzga la última pulsación de teclado y llama a paintChar pasándole el juicio*/
    judgePress(key) {
        this.startTimer();
        const line = this.lines[this.lineIndex];
        if (line === undefined) return;

        if (key === "\n") {
            if (this.charIndex === Array.from(line).length) {
                this.lineIndex++;
                this.charIndex = this.lineIndex < this.lines.length
                    ? this.firstNonSpaceIndex(this.lineIndex)
                    : 0;
                this.saltoLinea();
                this.updateCaret();
            }
            return;
        }

        const expectedCharacter = Array.from(line)[this.charIndex];
        if (expectedCharacter === undefined) return;

        if (expectedCharacter === key) {
            this.paintChar(true, key);
            return;
        }

        if (key === " ") return;

        this.paintChar(false, key);
    }

    /* Sucesos al acertar una letra */
    letraAcierto() {
        success();
        this.scoreTracker.checkCorrect();
    }

    /* Sucesos al fallar una letra */
    letraFallo() {
        fail();
        this.scoreTracker.checkIncorrect();
    }

    /* Sucesos al completar una línea y saltar a la siguiente */
    saltoLinea() {
        lineComplete();
        this.scoreTracker.checkLine();
        this.updateScore();
    }

    /* Muestra la puntuación actual en el marcador */
    updateScore() {
        const scoreCounter = document.getElementById("score-counter");
        if (!scoreCounter) return;
        const score = this.scoreTracker.getScore();
        // Estilo arcade: rellena con ceros a la izquierda (000420)
        scoreCounter.textContent = score < 0 ? score : String(score).padStart(6, "0");
    }

    /* En modo "time", resta 1 al contador del reloj cada segundo hasta llegar a 0 */
    startTimer() {
        if (this.scoreTracker.mode !== "time") return;
        if (this.timerId) return;

        const timeCounter = document.getElementById("time-counter");
        if (!timeCounter) return;

        let timeLeft = parseInt(timeCounter.textContent, 10);
        if (!(timeLeft > 0)) return;
        this.timerId = setInterval(() => {
            timeLeft--;
            timeCounter.textContent = timeLeft;
            timeCounter.classList.toggle("low-time", timeLeft <= 5);
            if (timeLeft <= 0) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        }, 1000);
    }

    firstNonSpaceIndex(lineIndex) {
        const characters = Array.from(this.lines[lineIndex]);
        const index = characters.findIndex((character) => character !== " ");
        return index === -1 ? characters.length : index;
    }

    restart() {
        const textArea = document.getElementById("text-to-type");
        if (!textArea) {
            throw new Error("No se encontró el textarea #text-to-type");
        }

        this.lineIndex = 0;
        this.charIndex = 0;
        this.displayCharacters = null;
        this.caretElement = null;

        const prompt = document.getElementById("typing-prompt");
        if (prompt) prompt.remove();

        if (this.lines.length > 0) {
            textArea.value = this.lines.join("\n");
        }
        textArea.style.color = "var(--gris-claro)";
        textArea.focus();
        this.updateCaret();

        this.scoreTracker.restart();
        this.updateScore();
        this.resetTimer();
    }

    /* Para el reloj y lo devuelve al tiempo inicial */
    resetTimer() {
        clearInterval(this.timerId);
        this.timerId = null;

        const timeCounter = document.getElementById("time-counter");
        if (!timeCounter) return;
        timeCounter.textContent = this.scoreTracker.getStartTime();
        timeCounter.classList.remove("low-time");
    }

    updateCaret() {
        const textArea = document.getElementById("text-to-type");
        if (!textArea) {
            throw new Error("No se encontró el textarea #text-to-type");
        }

        let offset = this.lines.slice(0, this.lineIndex).join("\n").length;
        if (this.lineIndex < this.lines.length) {
            if (this.lineIndex > 0) offset++;
            offset += Array.from(this.lines[this.lineIndex])
                .slice(0, this.charIndex)
                .join("")
                .length;
        }
        textArea.setSelectionRange(offset, offset);

        if (!this.caretElement || !this.displayCharacters) return;

        const prompt = document.getElementById("typing-prompt");
        const promptRect = prompt.getBoundingClientRect();
        const lineIndex = Math.min(this.lineIndex, this.displayCharacters.length - 1);
        const characters = this.displayCharacters[lineIndex];
        const characterIndex =
            this.lineIndex < this.displayCharacters.length
                ? this.charIndex
                : characters.length;

        let characterRect;
        let left;
        if (characterIndex < characters.length) {
            characterRect = characters[characterIndex].getBoundingClientRect();
            left = characterRect.left;
        } else if (characters.length > 0) {
            characterRect = characters[characters.length - 1].getBoundingClientRect();
            left = characterRect.right;
        } else {
            let previousCharacter;
            for (let index = lineIndex - 1; index >= 0; index--) {
                const previousLine = this.displayCharacters[index];
                if (previousLine.length > 0) {
                    previousCharacter = previousLine[previousLine.length - 1];
                    break;
                }
            }
            const style = getComputedStyle(prompt);
            left = promptRect.left + parseFloat(style.paddingLeft);
            const previousRect = previousCharacter &&
                previousCharacter.getBoundingClientRect();
            characterRect = {
                top: previousRect
                    ? previousRect.bottom
                    : promptRect.top + parseFloat(style.paddingTop),
                height: parseFloat(style.lineHeight)
            };
        }

        this.caretElement.style.left = `${left - promptRect.left}px`;
        this.caretElement.style.top = `${characterRect.top - promptRect.top}px`;
        this.caretElement.style.height = `${characterRect.height}px`;
    }

    /* Pinta el carácter actual según si es correcto o no */
    paintChar(correct, pressedCharacter) {
        const textArea = document.getElementById("text-to-type");
        if (!textArea) {
            throw new Error("No se encontró el textarea #text-to-type");
        }

        let prompt = document.getElementById("typing-prompt");
        if (!this.displayCharacters) {
            if (!prompt) {
                prompt = document.createElement("pre");
                prompt.id = "typing-prompt";
                prompt.setAttribute("aria-hidden", "true");
                textArea.parentElement.insertBefore(prompt, textArea);
            }

            this.displayCharacters = this.lines.map(() => []);
            const fragment = document.createDocumentFragment();

            this.lines.forEach((line, lineIndex) => {
                Array.from(line).forEach((character) => {
                    const characterElement = document.createElement("span");
                    characterElement.textContent = character;
                    this.displayCharacters[lineIndex].push(characterElement);
                    fragment.append(characterElement);
                });

                if (lineIndex < this.lines.length - 1) {
                    fragment.append(document.createTextNode("\n"));
                }
            });

            prompt.replaceChildren(fragment);
            this.caretElement = document.createElement("span");
            this.caretElement.id = "typing-caret";
            this.caretElement.setAttribute("aria-hidden", "true");
            prompt.append(this.caretElement);
            textArea.style.color = "transparent";
        }

        /* Borra el último carácter pintado*/
        const characterElement =
            this.displayCharacters[this.lineIndex][this.charIndex];
        let highlightedCharacter;
        if (correct) {
            highlightedCharacter = document.createElement("mark");
            this.letraAcierto();
        } else {
            highlightedCharacter = document.createElement("em");
            highlightedCharacter.textContent = pressedCharacter;
            if (pressedCharacter === " ") {
                highlightedCharacter.classList.add("incorrect-space");
            }
            this.letraFallo();
        }
        highlightedCharacter.textContent = correct
            ? characterElement.textContent
            : pressedCharacter;
        characterElement.replaceWith(highlightedCharacter);
        this.displayCharacters[this.lineIndex][this.charIndex] =
            highlightedCharacter;
        this.charIndex++;
        this.updateCaret();
    }

    eraseLast() {
        if (!this.displayCharacters) return;

        if (this.lineIndex >= this.lines.length) {
            this.lineIndex = this.lines.length - 1;
            this.charIndex = this.displayCharacters[this.lineIndex].length;
        } else if (this.charIndex === this.firstNonSpaceIndex(this.lineIndex)) {
            if (this.lineIndex === 0) return;
            this.lineIndex--;
            this.charIndex = this.displayCharacters[this.lineIndex].length;
        }

        this.charIndex--;
        const characterElement =
            this.displayCharacters[this.lineIndex][this.charIndex];
        const unpaintedCharacter = document.createElement("span");
        unpaintedCharacter.textContent =
            Array.from(this.lines[this.lineIndex])[this.charIndex];
        characterElement.replaceWith(unpaintedCharacter);
        this.displayCharacters[this.lineIndex][this.charIndex] =
            unpaintedCharacter;
        this.updateCaret();
    }
}

const game = new TypingGame();
game.setupLanguageMenu();
game.loadCode().catch((error) => {
    console.error("No se pudo iniciar el juego:", error);
});
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    // Con el diálogo de lenguajes abierto, las teclas no cuentan para el juego
    if (document.getElementById("dialogo")?.open) return;
    if (event.key === "Backspace") {
        event.preventDefault();
        game.eraseLast();
        return;
    }
    if (event.key === "Enter") {
        if (document.activeElement !== document.getElementById("text-to-type")) {
            return;
        }
        event.preventDefault();
        game.judgePress("\n");
        return;
    }
    if (event.key === " ") {
        event.preventDefault();
        game.judgePress(event.key);
        return;
    }
    if (event.key.length !== 1) return;
    const textArea = document.getElementById("text-to-type");
    textArea.focus();
    game.judgePress(event.key);
});

const restartButton = document.getElementById("restart-button");
restartButton.addEventListener("click", () => {
    game.restart();
}
);
