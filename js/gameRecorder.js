class GameRecord {
    static BACKSPACE = "Backspace";
    static ENTER = "Enter";

    constructor() {
        this.score = 0;
        this.keystrokes = [];
        this.startTime = null;
    }

    /* Milisegundos desde la primera pulsación registrada (la primera vale 0) */
    timestamp() {
        const now = performance.now();
        if (this.startTime === null) this.startTime = now;
        return Math.round(now - this.startTime);
    }

    /* Guarda una pulsación: tecla pulsada, tecla esperada (null si no aplica) y tiempo */
    addKeystroke(pressed, expected) {
        this.keystrokes.push({
            pressed,
            expected,
            time: this.timestamp()
        });
    }

    /* Acierto: la tecla pulsada coincide con la esperada */
    addHit(key) {
        this.addKeystroke(key, key);
    }

    /* Fallo: se pulsó una tecla distinta de la esperada */
    addMiss(pressed, expected) {
        this.addKeystroke(pressed, expected);
    }

    /* Retroceso: no tiene tecla esperada */
    addBackspace() {
        this.addKeystroke(GameRecord.BACKSPACE, null);
    }

    /* Intro (salto de línea): no tiene tecla esperada */
    addEnter() {
        this.addKeystroke(GameRecord.ENTER, null);
    }

    setScore(score) {
        this.score = score;
    }

    getScore() {
        return this.score;
    }

    /* Copia de la lista de pulsaciones, para que no se modifique desde fuera */
    getKeystrokes() {
        return this.keystrokes.map((keystroke) => ({ ...keystroke }));
    }

    /* Pulsaciones de caracteres (aciertos y fallos), sin retrocesos ni intros */
    getCharacterKeystrokes() {
        return this.keystrokes.filter((keystroke) => keystroke.expected !== null);
    }

    getHits() {
        return this.getCharacterKeystrokes()
            .filter((keystroke) => keystroke.pressed === keystroke.expected).length;
    }

    getMisses() {
        return this.getCharacterKeystrokes()
            .filter((keystroke) => keystroke.pressed !== keystroke.expected).length;
    }

    getBackspaces() {
        return this.keystrokes
            .filter((keystroke) => keystroke.pressed === GameRecord.BACKSPACE).length;
    }

    getEnters() {
        return this.keystrokes
            .filter((keystroke) => keystroke.pressed === GameRecord.ENTER).length;
    }

    /* Porcentaje de aciertos sobre aciertos + fallos (0-100, redondeado) */
    getAccuracy() {
        const total = this.getHits() + this.getMisses();
        if (total === 0) return 0;
        return Math.round((this.getHits() / total) * 100);
    }

    /* Aciertos por minuto en una partida de la duración dada (en segundos) */
    getCPM(durationSeconds) {
        if (!(durationSeconds > 0)) return 0;
        return Math.round(this.getHits() / (durationSeconds / 60));
    }

    /* Aciertos y fallos en cada segundo de la partida, para la gráfica.
       Devuelve un array con un objeto { second, hits, misses } por segundo */
    getPerSecond(durationSeconds) {
        const seconds = Array.from({ length: durationSeconds }, (_, index) => ({
            second: index + 1,
            hits: 0,
            misses: 0
        }));

        this.getCharacterKeystrokes().forEach((keystroke) => {
            const index = Math.min(Math.floor(keystroke.time / 1000), durationSeconds - 1);
            if (index < 0) return;
            if (keystroke.pressed === keystroke.expected) {
                seconds[index].hits++;
            } else {
                seconds[index].misses++;
            }
        });

        return seconds;
    }

    /* Aciertos y fallos repartidos en un número fijo de intervalos iguales, para la gráfica.
       Con 60 s y 15 intervalos, cada intervalo agrupa 4 s.
       Devuelve un objeto { start, end, hits, misses } por intervalo (start/end en segundos) */
    getPerInterval(durationSeconds, intervals) {
        if (!(durationSeconds > 0) || !(intervals > 0)) return [];
        const intervalSeconds = durationSeconds / intervals;

        const result = Array.from({ length: intervals }, (_, index) => ({
            start: index * intervalSeconds,
            end: (index + 1) * intervalSeconds,
            hits: 0,
            misses: 0
        }));

        this.getCharacterKeystrokes().forEach((keystroke) => {
            const index = Math.min(
                Math.floor(keystroke.time / 1000 / intervalSeconds),
                intervals - 1
            );
            if (index < 0) return;
            if (keystroke.pressed === keystroke.expected) {
                result[index].hits++;
            } else {
                result[index].misses++;
            }
        });

        return result;
    }

    /* Vacía el registro para una partida nueva */
    reset() {
        this.score = 0;
        this.keystrokes = [];
        this.startTime = null;
    }
}
