/*
 * Panels
 * Version 1.0
 * Joel Arias
 *
 */

class Panel {
    constructor(elem) {
        this.elem = elem;
        this.onActivate = null;
        this.onActivated = null;
        this.onQueue = null;
        this.onQueued = null;
        this.hasAsyncActivate = false;
        this.hasAsyncQueue = false;
    }

    _show() {
        this.elem.classList.add('active');
    }

    _hide() {
        this.elem.classList.remove('active')
    }

    async activate() {
        //run options before
        if(this.onActivate) {
            console.log('activate');
            await this._run(this.onActivate, 'OnActivate');
            this._show();
        } else {
            this._show();
        }
        //run options after
        if(this.onActivated) {
            this._run(this.onActivated, 'OnActivated');
        }
    }
    async queue() {
        //run options before
        if(this.onQueue) {
            console.log('onQueue');
            await this._run(this.onQueue, 'OnQueue');
            this._hide();
        } else {
            this._hide();
        }
        //run options after
        if(this.onQueued) {
            this._run(this.onQueued, 'OnQueued');
        }
    }

    isActive() {
        if(this.elem.classList.contains('active')) {
            return true;
        }
        return false;
    }

    hasAsyncOnActivate() {
        return this.hasAsyncActivate;
    }

    hasAsyncOnQueue() {
        return this.hasAsyncQueue;
    }

    setOptions(options) {

        if(options.onActivate){
            this.onActivate = options.onActivate;
            this.hasAsyncActivate = true;
        }
        this.onActivated = options.onActivated ? options.onActivated : null;

        if(options.onQueue){
            this.onQueue = options.onQueue;
            this.hasAsyncQueue = true;
        }
        this.onQueued = options.onQueued ? options.onQueued : null;

    }

    async _run(action, type) {
        try {
            await action();
        }
        catch(error) {
            console.error(`Action ${type} Failed.`, error);
            return false;
        }
    }

    _resetScroll(offsetTop = 0) {
        this.elem.scrollTop = offsetTop;
    }
}