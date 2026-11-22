/* Volumen de cada tipo de sonido (0 = silencio, 1 = volumen original) */
const VOLUMES = {
    line: 0.35,
    success: 0.5,
    fail: 0.5
};

function createSound(src, volume) {
    const sound = new Audio(src);
    sound.volume = volume;
    return sound;
}

const lineSounds = [
    createSound("multimedia/line2.wav", VOLUMES.line)
];

const successSounds = [
    createSound("multimedia/good.wav", VOLUMES.success),
    createSound("multimedia/goodA.wav", VOLUMES.success)
];

function lineComplete() {
    const sound = lineSounds[Math.floor(Math.random() * lineSounds.length)];
    sound.currentTime = 0;
    return sound.play();
}

function success() {
    const sound = successSounds[Math.floor(Math.random() * successSounds.length)];
    sound.currentTime = 0;
    return sound.play();
}

function fail(){
    const sound = createSound("multimedia/fail.wav", VOLUMES.fail);
    return sound.play();
}

function shakeScreen() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const body = document.body;
    body.classList.remove("screen-shake");
    void body.offsetWidth;
    body.classList.add("screen-shake");
}

document.body.addEventListener("animationend", (event) => {
    if (event.animationName === "screen-shake") {
        document.body.classList.remove("screen-shake");
    }
});