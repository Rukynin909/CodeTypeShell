class TypingGame {
    constructor() {
        this.lines = [];
        this.lineIndex = 0;
        this.charIndex = 0;
        this.displayCharacters = null;
        this.scoreTracker = new ScoreTracker();
        this.timerId = null;
        this.gameOver = false;
        this.endTimeoutId = null;
        this.language = "java";
        this.gameRecord = new GameRecord();
        this.statsChart = new StatsChart("stats-chart");
        this.scriptIndex = -1;
        this.textAreaListenersReady = false;
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

    /* Conecta los botones de #Tiempo: el elegido queda destacado y cambia la duración */
    setupTimeMenu() {
        const timeMenu = document.getElementById("Tiempo");
        if (!timeMenu) return;
        const buttons = Array.from(timeMenu.querySelectorAll("button"));

        buttons.forEach((button) => {
            const seconds = parseInt(button.textContent, 10);
            button.setAttribute(
                "aria-pressed",
                seconds === this.scoreTracker.getStartTime()
            );
            button.addEventListener("click", () => this.selectTime(seconds, buttons));
        });
        this.selectTime(this.scoreTracker.getStartTime(), buttons);
        this.resetTimer();
    }

    /* Conecta los botones de #Modo con la lógica del juego (lo visual lo hace GameMenu) */
    setUpMode(){
        const modeMenu = document.getElementById("Modo");
        if (!modeMenu) return;
        const modeButtons = Array.from(modeMenu.querySelectorAll("button"));
        modeButtons.forEach((button) => {
            // El nombre del modo es el texto del botón: "time", "script", "freestyle"
            const mode = button.textContent.trim();
            button.addEventListener("click", () => this.selectMode(mode));
        });
    }

    /* Guarda la duración elegida en ScoreTracker y reinicia la partida con ella */
    selectTime(seconds, buttons) {
        if (!(seconds > 0)) return;
        this.scoreTracker.setStartTime(seconds);
        buttons.forEach((button) =>
            button.setAttribute(
                "aria-pressed",
                parseInt(button.textContent, 10) === this.scoreTracker.getStartTime()
            )
        );
        // restart() vuelve a poner el reloj con getStartTime()
        this.restart();
    }

    /* Guarda el modo elegido en ScoreTracker y reinicia la partida con él */
    selectMode(mode){
        // Volver a pulsar el modo activo no reinicia la partida
        if (mode === this.scoreTracker.getMode()) return;
        if (!this.scoreTracker.changeMode(mode)) return;
        this.updateTimeMenu();
        this.restart();
    }

    /* Muestra el selector de tiempo solo en el modo "time" */
    updateTimeMenu() {
        const timeMenu = document.getElementById("Tiempo");
        if (!timeMenu) return;
        timeMenu.classList.toggle("hidden-menu", this.scoreTracker.getMode() !== "time");
    }

    /* Marca el lenguaje elegido, actualiza el botón y cierra el diálogo */
    selectLanguage(option, options, button, dialog) {
        this.language = option.textContent.trim();
        options.forEach((item) =>
            item.setAttribute("aria-selected", item === option)
        );
        button.textContent = this.language;
        dialog.close();
        // restart() ya carga el JSON del lenguaje nuevo
        this.restart();
    }

    /* Carga las lineas de codigo al textArea desde el Json */
    async loadCode() {
        const response = await fetch("js/"+this.language+".json");
        if (!response.ok) {
            throw new Error(`No se pudo cargar java.json: ${response.status}`);
        }

        const codeData = await response.json();
        // Elige uno de los scripts del lenguaje al azar, distinto del anterior si hay más de uno
        const scripts = codeData.scripts;
        let index = Math.floor(Math.random() * scripts.length);
        if (scripts.length > 1 && index === this.scriptIndex) {
            index = (index + 1 + Math.floor(Math.random() * (scripts.length - 1))) % scripts.length;
        }
        this.scriptIndex = index;
        const script = scripts[index];
        this.lines = script.lineas.map(
            (line) => codeData.indentacion.repeat(line.nivel) + line.piezas.join(" ")
        );

        const textArea = document.getElementById("text-to-type");
        if (!textArea) {
            throw new Error("No se encontró el textarea #text-to-type");
        }

        const codeText = this.lines.join("\n");
        textArea.value = codeText;
        textArea.style.color = "var(--gris-claro)";
        // Los listeners se añaden solo la primera vez: loadCode se llama en cada restart
        if (!this.textAreaListenersReady) {
            textArea.addEventListener("focus", () => this.updateCaret());
            textArea.addEventListener("click", () => this.updateCaret());
            // Sin readonly (Chrome no pinta el cursor en un textarea readonly):
            // se cancela cualquier cambio del texto (teclear, pegar, cortar, deshacer…)
            textArea.addEventListener("beforeinput", (event) => event.preventDefault());
            this.textAreaListenersReady = true;
        }
        this.updateCaret();
    }

    /* Juzga la última pulsación de teclado y llama a paintChar pasándole el juicio*/
    judgePress(key) {
        if (this.gameOver) return;
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
    letraAcierto(key) {
        success();
        this.scoreTracker.checkCorrect();
        this.gameRecord.addHit(key);
    }

    /* Sucesos al fallar una letra */
    letraFallo(pressed, expected) {
        fail();
        this.scoreTracker.checkIncorrect();
        this.gameRecord.addMiss(pressed, expected);
    }

    /* Sucesos al completar una línea y saltar a la siguiente */
    saltoLinea() {
        lineComplete();
        this.scoreTracker.checkLine();
        this.gameRecord.addEnter();
        this.updateScore();
        if(this.lineIndex == this.lines.length){
            this.scriptComplete();
        }
    }

    /* Muestra la puntuación actual en el marcador */
    updateScore() {
        const scoreCounter = document.getElementById("score-counter");
        if (!scoreCounter) return;
        const score = this.scoreTracker.getScore();
        // Estilo arcade: rellena con ceros a la izquierda (000420)
        scoreCounter.textContent = score < 0 ? score : String(score).padStart(6, "0");
    }

    /* Arranca el reloj en la primera pulsación según el modo:
       "time" cuenta hacia atrás hasta 0, "script" cuenta hacia arriba y "freestyle" no tiene reloj */
    startTimer() {
        const mode = this.scoreTracker.getMode();
        if (mode === "freestyle") return;
        if (this.timerId) return;

        const timeCounter = document.getElementById("time-counter");
        if (!timeCounter) return;

        if (mode === "script") {
            let elapsed = 0;
            this.timerId = setInterval(() => {
                elapsed++;
                timeCounter.textContent = elapsed;
            }, 1000);
            return;
        }

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
            if(timeLeft == 0){
                this.endGame();
            }
        }, 1000);
    }

    /* Termina la partida: bloquea y hace parpadear la zona de escritura
       medio segundo, y después la oculta y muestra las stats */
    endGame(){
        this.gameOver = true;
        const typingArea = document.getElementById("typing-area");
        if (!typingArea) return;

        typingArea.classList.add("locking");
        this.endTimeoutId = setTimeout(() => {
            this.endTimeoutId = null;
            typingArea.classList.remove("locking");
            typingArea.classList.add("finished");
        }, 900);

        this.gameRecord.setScore(this.scoreTracker.getScore());
        this.showStats();
    }

    /* Rellena el panel de stats con los datos del registro de la partida */
    showStats() {
        // Puntuación final a 6 cifras, rellenando con ceros a la izquierda (001304)
        const score = document.getElementById("stat-score");
        if (score) {
            score.textContent = String(this.gameRecord.getScore()).padStart(6, "0");
        }

        // Duración real según el modo: fija en "time", lo que se tardó en "script"
        const duration = this.gameRecord.getDuration();
        const cpm = document.getElementById("stat-cpm");
        if (cpm) {
            cpm.textContent = this.gameRecord.getCPM(duration);
        }

        const accuracy = document.getElementById("stat-accuracy");
        if (accuracy) {
            accuracy.textContent = `${this.gameRecord.getAccuracy()}%`;
        }

        const errors = document.getElementById("stat-errors");
        if (errors) {
            errors.textContent = this.gameRecord.getMisses();
        }

        // Lenguaje con el que se hizo el test
        const language = document.getElementById("stat-language");
        if (language) {
            language.textContent = this.language;
        }

        // Duración del test, con la etiqueta del modo: "Time:30s" o "Script:47s"
        const time = document.getElementById("stat-time");
        if (time) {
            const label = this.gameRecord.getMode() === "script" ? "Script" : "Time";
            time.textContent = `${label}:${duration}s`;
        }

        // Gráfica de aciertos y fallos, siempre en 15 intervalos de la duración real
        this.statsChart.render(
            this.gameRecord.getPerInterval(duration, StatsChart.INTERVALS),
            duration,
            this.gameRecord.getMode()
        );
    }

    firstNonSpaceIndex(lineIndex) {
        const characters = Array.from(this.lines[lineIndex]);
        const index = characters.findIndex((character) => character !== " ");
        return index === -1 ? characters.length : index;
    }

    /* Reinicia la partida y carga otro script al azar del lenguaje actual */
    async restart() {
        const textArea = document.getElementById("text-to-type");
        if (!textArea) {
            throw new Error("No se encontró el textarea #text-to-type");
        }

        // Bloquea el teclado mientras se carga el script nuevo
        this.gameOver = true;
        // Si se pulsa reset durante el parpadeo, cancela el fin de partida pendiente
        clearTimeout(this.endTimeoutId);
        this.endTimeoutId = null;
        // Vuelve a mostrar el contenido antes de enfocar el textarea
        const typingArea = document.getElementById("typing-area");
        if (typingArea) typingArea.classList.remove("locking", "finished");

        this.lineIndex = 0;
        this.charIndex = 0;
        this.displayCharacters = null;

        const prompt = document.getElementById("typing-prompt");
        if (prompt) prompt.remove();

        this.scoreTracker.restart();
        this.gameRecord.reset();
        this.gameRecord.setMode(
            this.scoreTracker.getMode(),
            this.scoreTracker.getStartTime()
        );
        this.updateScore();
        this.resetTimer();

        try {
            await this.loadCode();
        } catch (error) {
            // Si falla la carga, se repite el script que ya estaba
            console.error("No se pudo cargar un script nuevo:", error);
            textArea.value = this.lines.join("\n");
            textArea.style.color = "var(--gris-claro)";
        }

        this.gameOver = false;
        textArea.focus();
        this.updateCaret();
    }

    //Si se completa un script se visualiza uno nuevo
    async scriptComplete(){
        if(this.scoreTracker.getMode() == "script"){
            this.endGame();
            return;
        }
        const previousLines = this.lines;
        this.lines = [];
        this.lineIndex = 0;
        this.charIndex = 0;
        this.displayCharacters = null;
        const prompt = document.getElementById("typing-prompt");
        if (prompt) prompt.remove();

        const textArea = document.getElementById("text-to-type");
        try {
            await this.loadCode();
        } catch (error) {
            // Si falla la carga, se repite el script que ya estaba
            console.error("No se pudo cargar un script nuevo:", error);
            this.lines = previousLines;
            textArea.value = this.lines.join("\n");
            textArea.style.color = "var(--gris-claro)";
        }
        this.updateCaret();
    }

    /* Para el reloj y lo devuelve a su valor inicial según el modo */
    resetTimer() {
        clearInterval(this.timerId);
        this.timerId = null;

        const timeCounter = document.getElementById("time-counter");
        if (!timeCounter) return;
        const mode = this.scoreTracker.getMode();
        if (mode === "script") {
            timeCounter.textContent = 0;
        } else if (mode === "freestyle") {
            timeCounter.textContent = "~";
        } else {
            timeCounter.textContent = this.scoreTracker.getStartTime();
        }
        timeCounter.classList.remove("low-time");
    }

    /* Coloca el cursor nativo del textarea en el carácter que toca escribir */
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
            textArea.style.color = "transparent";
        }

        /* Borra el último carácter pintado*/
        const characterElement =
            this.displayCharacters[this.lineIndex][this.charIndex];
        let highlightedCharacter;
        const expectedCharacter = characterElement.textContent;
        if (correct) {
            highlightedCharacter = document.createElement("mark");
            this.letraAcierto(pressedCharacter);
        } else {
            highlightedCharacter = document.createElement("em");
            highlightedCharacter.textContent = pressedCharacter;
            if (pressedCharacter === " ") {
                highlightedCharacter.classList.add("incorrect-space");
            }
            this.letraFallo(pressedCharacter, expectedCharacter);
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
        if (this.gameOver || !this.displayCharacters) return;

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
        this.gameRecord.addBackspace();
        this.updateCaret();
    }
}

const game = new TypingGame();
game.setupLanguageMenu();
game.setupTimeMenu();
game.setUpMode();
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
