class StatsChart {
    static SVG_NS = "http://www.w3.org/2000/svg";

    // Geometría basada en multimedia/grafica.svg (viewBox 960 x 160),
    // con 40 unidades más a la derecha para la etiqueta del eje X
    static WIDTH = 1000;
    static HEIGHT = 160;
    static PLOT_LEFT = 32;
    static PLOT_RIGHT = 944;
    static PLOT_TOP = 16;
    static PLOT_BOTTOM = 140;
    static AXIS_X = 24;

    // La gráfica siempre se divide en 15 tramos; con más tiempo, cada uno abarca más segundos
    static INTERVALS = 15;

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.data = [];
        this.duration = 0;
        this.mode = "time";
        this.maxValue = 0;
    }

    /* Punto de entrada: recibe el array de getPerInterval(), la duración real del test
       en segundos y su modo, y pinta la gráfica entera */
    render(intervals, durationSeconds, mode = "time") {
        this.data = Array.isArray(intervals) ? intervals : [];
        this.duration = durationSeconds > 0 ? durationSeconds : this.data.length;
        this.mode = mode;
        this.maxValue = this.computeMax();
        this.svg = this.createSvg();

        this.drawGrid();
        this.drawAxes();
        this.drawHitsLine();
        this.drawMisses();
        this.drawLabels();

        this.mount();
        return this.svg;
    }

    /* Crea el <svg> raíz con viewBox y atributos de accesibilidad (role="img", <title>) */
    createSvg() {
        const svg = this.el("svg", {
            viewBox: `0 0 ${StatsChart.WIDTH} ${StatsChart.HEIGHT}`,
            "shape-rendering": "crispEdges",
            role: "img"
        });
        // El <title> como primer hijo es el nombre accesible del gráfico
        const title = this.el("title", {});
        title.textContent = this.describe();
        svg.append(title);
        return svg;
    }

    /* Atajo para crear un elemento SVG con sus atributos: el("line", { x1: 0, ... }) */
    el(tag, attributes) {
        const element = document.createElementNS(StatsChart.SVG_NS, tag);
        Object.entries(attributes).forEach(([name, value]) => {
            element.setAttribute(name, value);
        });
        return element;
    }

    /* Valor máximo del eje Y (el mayor número de aciertos en un intervalo) */
    computeMax() {
        const maxHits = Math.max(0, ...this.data.map((interval) => interval.hits));
        // Redondea hacia arriba a múltiplo de 4 para que las 3 líneas de la rejilla
        // caigan en valores enteros; mínimo 4 para que una partida vacía no divida entre 0
        return Math.max(4, Math.ceil(maxHits / 4) * 4);
    }

    /* Convierte el índice de un intervalo en coordenada X dentro del área de dibujo.
       El intervalo i ocupa el tramo entre scaleX(i) y scaleX(i + 1) */
    scaleX(index) {
        const intervals = Math.max(1, this.data.length);
        const width = StatsChart.PLOT_RIGHT - StatsChart.PLOT_LEFT;
        return StatsChart.PLOT_LEFT + (index * width) / intervals;
    }

    /* Convierte un valor en coordenada Y (en SVG la Y crece hacia abajo) */
    scaleY(value) {
        const height = StatsChart.PLOT_BOTTOM - StatsChart.PLOT_TOP;
        return StatsChart.PLOT_BOTTOM - (value / this.maxValue) * height;
    }

    /* Rejilla punteada horizontal */
    drawGrid() {
        const grid = this.el("g", {
            style: "stroke: var(--gris-claro)",
            "stroke-width": 2,
            "stroke-dasharray": "2 6",
            opacity: 0.35
        });

        // 3 líneas: a 1/4, 2/4 y 3/4 del valor máximo
        for (let step = 1; step <= 3; step++) {
            const y = this.scaleY((this.maxValue * step) / 4);
            grid.append(this.el("line", {
                x1: StatsChart.PLOT_LEFT,
                y1: y,
                x2: StatsChart.PLOT_RIGHT,
                y2: y
            }));
        }

        this.svg.append(grid);
    }

    /* Ejes y marcas de cada intervalo */
    drawAxes() {
        const axes = this.el("g", {
            style: "stroke: var(--gris-claro)",
            "stroke-width": 2
        });
        axes.append(this.el("line", {
            x1: StatsChart.AXIS_X,
            y1: StatsChart.PLOT_TOP,
            x2: StatsChart.AXIS_X,
            y2: StatsChart.PLOT_BOTTOM
        }));
        axes.append(this.el("line", {
            x1: StatsChart.AXIS_X,
            y1: StatsChart.PLOT_BOTTOM,
            x2: StatsChart.PLOT_RIGHT + 8,
            y2: StatsChart.PLOT_BOTTOM
        }));
        this.svg.append(axes);

        // Una marca al final de cada intervalo, debajo del eje X
        const ticks = this.el("g", { style: "fill: var(--gris-claro)" });
        for (let index = 1; index <= this.data.length; index++) {
            ticks.append(this.el("rect", {
                x: this.scaleX(index) - 1,
                y: StatsChart.PLOT_BOTTOM + 4,
                width: 2,
                height: 4
            }));
        }
        this.svg.append(ticks);
    }

    /* Línea principal: aciertos por intervalo, con <polyline> */
    drawHitsLine() {
        if (this.data.length === 0) return;

        // Escalonada (estilo pixel/arcade): cada intervalo es un tramo horizontal
        const points = [];
        this.data.forEach((interval, index) => {
            const y = this.scaleY(interval.hits);
            points.push(`${this.scaleX(index)},${y}`);
            points.push(`${this.scaleX(index + 1)},${y}`);
        });

        // Área bajo la curva, muy tenue
        const areaPoints = [
            `${this.scaleX(0)},${StatsChart.PLOT_BOTTOM}`,
            ...points,
            `${this.scaleX(this.data.length)},${StatsChart.PLOT_BOTTOM}`
        ];
        this.svg.append(this.el("polygon", {
            points: areaPoints.join(" "),
            style: "fill: var(--verde-brillante)",
            opacity: 0.08
        }));

        this.svg.append(this.el("polyline", {
            points: points.join(" "),
            fill: "none",
            style: "stroke: var(--verde-brillante)",
            "stroke-width": 3,
            "stroke-linejoin": "miter"
        }));

        // Punto final
        const last = this.data[this.data.length - 1];
        this.svg.append(this.el("rect", {
            x: this.scaleX(this.data.length) - 4,
            y: this.scaleY(last.hits) - 4,
            width: 8,
            height: 8,
            style: "fill: var(--verde-brillante)"
        }));
    }

    /* Marcas en los intervalos con fallos */
    drawMisses() {
        const misses = this.el("g", {
            style: "stroke: var(--blanco)",
            "stroke-width": 2
        });

        this.data.forEach((interval, index) => {
            if (interval.misses === 0) return;
            // Una "x" de 8 x 8 en el centro del tramo, justo encima de la línea
            const x = (this.scaleX(index) + this.scaleX(index + 1)) / 2;
            const y = Math.max(StatsChart.PLOT_TOP, this.scaleY(interval.hits) - 16);
            misses.append(this.el("path", {
                d: `M${x - 4},${y} l8,8 M${x + 4},${y} l-8,8`
            }));
        });

        this.svg.append(misses);
    }

    /* Leyenda: duración al final del eje X y valor máximo al final del eje Y */
    drawLabels() {
        const labels = this.el("g", {
            style: "fill: var(--gris-claro)",
            "font-size": 12
        });

        // A la derecha del final del eje X, a su altura: "15s"
        const xLabel = this.el("text", {
            x: StatsChart.PLOT_RIGHT + 16,
            y: StatsChart.PLOT_BOTTOM + 6,
            "text-anchor": "start"
        });
        xLabel.textContent = `${this.duration}s`;

        // Encima del final del eje Y: "12 chars"
        const yLabel = this.el("text", {
            x: StatsChart.AXIS_X + 8,
            y: StatsChart.PLOT_TOP - 3,
            "text-anchor": "start"
        });
        yLabel.textContent = `${this.maxValue} chars`;

        labels.append(xLabel, yLabel);
        this.svg.append(labels);
    }

    /* Texto alternativo con el resumen de la partida, para lectores de pantalla */
    describe() {
        if (this.data.length === 0) return "Gráfica de la partida: sin pulsaciones registradas";

        const maxHits = Math.max(...this.data.map((interval) => interval.hits));
        const totalMisses = this.data.reduce((total, interval) => total + interval.misses, 0);
        const errorIntervals = this.data.filter((interval) => interval.misses > 0).length;
        // En "script" la duración es libre y el intervalo puede tener decimales (47 s / 15)
        const intervalSeconds = Math.round((this.duration / this.data.length) * 10) / 10;

        return `Partida en modo ${this.mode}. ` +
            `Aciertos cada ${intervalSeconds} s durante ${this.duration} s: ` +
            `máximo ${maxHits} aciertos en un intervalo, ` +
            `${totalMisses} fallos repartidos en ${errorIntervals} de ${this.data.length} intervalos`;
    }

    /* Sustituye el contenido del contenedor por el svg nuevo */
    mount() {
        if (!this.container || !this.svg) return;
        this.container.replaceChildren(this.svg);
    }
}
