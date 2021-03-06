function Boundaries(settings) {
    this.margin = settings.margin;

    /* Initialize the boundaries */
    this.init();
}

Boundaries.prototype = {
    /*
     * init
     * Initialize the boundaries
     */
    init: function() {
        this.top = this.margin;
        this.left = this.margin;
        this.width = window.mGame.playground.width - (2 * this.margin);
        this.height = window.mGame.playground.height - (2 * this.margin);
        
        this.draw();
    },
    /*
     * draw
     * Draw the boundaries
     */
    draw: function() {
        window.mGame.playgroundContext.strokeStyle = '#000000';
        window.mGame.playgroundContext.beginPath();
        window.mGame.playgroundContext.rect(this.left, this.top, this.width, this.height);
        window.mGame.playgroundContext.closePath();
        window.mGame.playgroundContext.stroke();
    }
};