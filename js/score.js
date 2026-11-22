class ScoreTracker {
    static POINTS_PER_LINE = 100;
    constructor() {
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.mode = "time"
        this.modifier = 1;
        this.score = 0;
        this.startTime = 30;
    }

    getStartTime(){
        return this.startTime;
    }

    /* Cambia la duración del test (en segundos) */
    setStartTime(seconds){
        this.startTime = seconds;
    }

    startTracking(){
        if(this.mode == "time"){
            this.correctCount = 0;
            this.incorrectCount = 0;
            this.score = 0;
        }
    }

    checkCorrect(){
        this.correctCount++;
    }

    checkIncorrect(){
        this.modifier = this.modifier - 0.1;
        this.incorrectCount++;
    }

    checkLine(){
        this.score += Math.round(ScoreTracker.POINTS_PER_LINE * this.correctCount * this.modifier);
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.modifier = 1;
        return this.getScore();
    }

    getScore(){
        return this.score;
    }

    restart(){
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.modifier = 1;
        this.score = 0;
    }

}