
function Game() {
    this.status = 'stopped';
    this.level = 1;
    this.speed = 1;

    this.playground = document.getElementById("playground");
    this.playground.setAttribute('width', window.innerWidth - 5);
    this.playground.setAttribute('height', window.innerHeight - 5);

    this.playgroundContext = this.playground.getContext("2d");

    this.lastMotionX = 0;
    this.lastMotionY = 0;

    /* Initialize window.requestAnimationFrame taking into account vendor prefixes */
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

}

Game.prototype = {
    /*
     * start
     * Starts the level
     */
    start: function() {
        /* Clear the playground */
        this.clearPlayground();

        this.playground.setAttribute('width', window.innerWidth - 5);
        this.playground.setAttribute('height', window.innerHeight - 5);

        /* Draw toy pieces */
        window.mBoundaries.init();
        this.generateTarget();
        this.generateObstacles();
        this.generateBall();

        /* Handle the screen orientation change */
        window.mScreenOrientationManager.handleOrientationChange({
            portraitPrimaryCallback: window.mGame.resume.bind(window.mGame),
            landscapePrimaryCallback: window.mGame.pause.bind(window.mGame),
            portraitSecondaryCallback: window.mGame.pause.bind(window.mGame),
            landscapeSecondaryCallback: window.mGame.pause.bind(window.mGame)
        });

        /* Activate the device motion control */
        window.mDeviceMotionControl.handleMotionEvent(window.mGame.step.bind(window.mGame));

        /* The game is running now */
        this.status = 'running';
    },
    /*
     * step
     * Push the game a step forward, called every time the ball moves
     * @param {Double} motionX
     * @param {Double} motionY
     * @param {Double} motionZ
     * @param {Integer} interval
     */
    step: function(motionX, motionY, motionZ, interval) {

        var self = this;

        /* Stop if the game is not running */
        if (this.status !== 'running') {
            return;
        }

        /* Check the motion on the z axis */
        if (motionZ > 12) {
            var jumpX = 0, jumpY = 0;

            /* Calculate direction to jump */
            if (motionX !== 0) {
                jumpX = motionX < 0 ? -1 : 1;
            }
            if (motionY !== 0) {
                jumpY = motionY < 0 ? -1 : 1;
            }

            /* Make the ball jump */
            window.mBall.jump(jumpX, jumpY, motionZ);

            return;
        }

        /* Stop if ball is not rolling */
        if (window.mBall.status !== 'rolling') {
            return;
        }

        /* Calculate the next position of the ball */
        var nextPositionX = window.mBall.position.x - 0 + motionX;
        var nextPositionY = window.mBall.position.y - 0 + motionY;

        /* Check if the ball reached the target */
        if (CollisionManager.target(nextPositionX, nextPositionY)) {
            self.stop();
            self.nextLevel();

            return;
        }

        /* Check if the ball collides with a brick or boundaries  */
        var collision = CollisionManager.obstacles(nextPositionX, nextPositionY) || CollisionManager.boundaries(nextPositionX, nextPositionY);
        if (collision) {

            if (collision === 'left' || collision === 'right') {
                if ((motionX < 0 && this.lastMotionX < 0) || (motionX > 0 && this.lastMotionX > 0)) {
                    motionX = 0;
                }
            }
            else if (collision === 'top' || collision === 'bottom') {
                if ((motionY < 0 && this.lastMotionY < 0) || (motionY > 0 && this.lastMotionY > 0)) {
                    motionY = 0;
                }
            }
            else if (collision === 'topleft' || collision === 'topright' || collision === 'bottomleft' || collision === 'bottomright') {
                return;
            }
        }

        /* Make the ball roll at the right speed */
        if (this.speed >= 0) {
            this.speed--;
            window.requestAnimationFrame(function() {
                self.step(motionX, motionY, motionZ, interval);
            });
        }
        else {
            this.speed = interval / 100;
        }

        window.mBall.roll(motionX, motionY);

        /* Save last motion */
        if (motionX !== 0) {
            this.lastMotionX = motionX;
        }
        if (motionY !== 0) {
            this.lastMotionY = motionY;
        }

    },
    /*
     * pause
     * Pause the game
     */
    pause: function() {
        this.status = 'paused';
    },
    /*
     * resume
     * Resume the game
     */
    resume: function() {
        var self = this;
        setTimeout(function() {
            self.status = 'running';
        }, 1000);
    },
    /*
     * stop
     * Stop the game
     */
    stop: function() {
        this.status = 'stopped';
    },
    /*
     * nextLevel
     * Go to the next level
     */
    nextLevel: function() {
        window.mBall.fall(window.mTarget.position.x, window.mTarget.position.y);

        var self = this;
        window.setTimeout(function() {
            self.level++;
//            self.start();
            window.location = '';
        }, 3000);
    },
    /*
     * clearPlayground
     * Remove toy pieces from the playground
     */
    clearPlayground: function() {
        this.playgroundContext.clearRect(0, 0, this.playground.width, this.playground.height);
    },
    /*
     * generateObstacles
     * Draw obstacles in random positions
     */
    generateObstacles: function() {
        window.mObstacles.items = [];

        var numberOfVerticalWalls = 1 + (Math.random() * 2 * window.mBoundaries.width / 480);
        var numberOfHorizontalWalls = 1 + (Math.random() * 2 * window.mBoundaries.height / 320);

        /* vertical positioned obstacles */
        for (var i = 0; i < numberOfVerticalWalls; i++) {
            var width = 20;
            var height = (Math.random() - 0 + 1) * 100 * window.mBoundaries.height / 320;

            var topMax = window.mBoundaries.height - height + window.mBoundaries.top - window.mTarget.size;
            var topMin = window.mBoundaries.top - 0 + window.mTarget.size;
            var top = (Math.random() * (topMax - topMin)) - 0 + topMin;

            var leftMax = window.mBoundaries.width - width + window.mBoundaries.left - window.mBall.size;
            var leftMin = window.mBoundaries.left - 0 + window.mBall.size;
            var left = (Math.random() * (leftMax - leftMin)) - 0 + leftMin;

            window.mObstacles.items.push({
                top: top,
                left: left,
                width: width,
                height: height
            });
        }

        /* horizontal positioned obstacles */
        for (var i = 0; i < numberOfHorizontalWalls; i++) {
            var width = (Math.random() - 0 + 1) * 100 * window.mBoundaries.width / 480;
            var height = 20;

            var topMax = window.mBoundaries.height - height + window.mBoundaries.top - window.mTarget.size;
            var topMin = window.mBoundaries.top - 0 + window.mTarget.size;
            var top = (Math.random() * (topMax - topMin)) - 0 + topMin;

            var leftMax = window.mBoundaries.width - width + window.mBoundaries.left - window.mBall.size;
            var leftMin = window.mBoundaries.left - 0 + window.mBall.size;
            var left = (Math.random() * (leftMax - leftMin)) - 0 + leftMin;

            window.mObstacles.items.push({
                top: top,
                left: left,
                width: width,
                height: height
            });
        }

        window.mObstacles.draw();
    },
    /*
     * generateTarget
     * Draw the hole in a random position
     */
    generateTarget: function() {
        var xPos, yPos;

        var leftMax = window.mBoundaries.left - 0 + (window.mBoundaries.width / 2) - window.mTarget.size;
        var leftMin = window.mBoundaries.left - 0 + window.mTarget.size;

        var topMax = window.mBoundaries.top - 0 + (window.mBoundaries.height / 2) - window.mTarget.size;
        var topMin = window.mBoundaries.top - 0 + window.mTarget.size;

        do {
            xPos = (Math.random() * (leftMax - leftMin)) - 0 + leftMin;
            yPos = (Math.random() * (topMax - topMin)) - 0 + topMin;
        }
        while (CollisionManager.obstacles(xPos, yPos) || CollisionManager.boundaries(xPos, yPos));

        window.mTarget.position.x = xPos;
        window.mTarget.position.y = yPos;
        window.mTarget.draw();
    },
    /*
     * generateBall
     * Draw the ball in a random position
     */
    generateBall: function() {
        window.mBall.size = window.mBall.originalSize;

        var xPos, yPos;

        var leftMax = window.mBoundaries.left - 0 + window.mBoundaries.width - window.mBall.size;
        var leftMin = window.mBoundaries.left - 0 + (window.mBoundaries.width / 2);

        var topMax = window.mBoundaries.top - 0 + window.mBoundaries.height - window.mBall.size;
        var topMin = window.mBoundaries.top - 0 + (window.mBoundaries.height / 2);

        do {
            xPos = (Math.random() * (leftMax - leftMin)) - 0 + leftMin;
            yPos = (Math.random() * (topMax - topMin)) - 0 + topMin;
        }
        while (CollisionManager.obstacles(xPos, yPos) || CollisionManager.boundaries(xPos, yPos)
                || CollisionManager.target(xPos, yPos));

        window.mBall.position.x = xPos;
        window.mBall.position.y = yPos;
        window.mBall.draw();
    }
};
