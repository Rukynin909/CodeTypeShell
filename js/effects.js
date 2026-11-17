const lineSounds = [
    new Audio("multimedia/line2.wav")
];

const successSounds = [
    new Audio("multimedia/good.wav"),
    new Audio("multimedia/goodA.wav")
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
    const sound = new Audio("multimedia/fail.wav");
    sound.currentTime = 0;
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