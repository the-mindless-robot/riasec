/*
 * Panel Router
 * Version 1.0
 * Joel Arias
 *
 */

//TODO: build hooks to assign action on trigger
// id panelChange, onForward, onBackward, onNext, onPrev, onJump, onSkip  etc.

class PanelRouter {
    constructor(containerId, panelClass = 'panel') {
        //elements
        this.container = document.getElementById(containerId);
        this.panelClass = panelClass;
        this.panels = this._childrenMatches(this.container, '.'+ panelClass);
        this.loader = document.getElementById('loader');

        this.prevBtnsSelector = `.prev.${panelClass}`;
        this.prevBtns = document.querySelectorAll(this.prevBtnsSelector);

        this.nextBtnsSelector = `.next.${panelClass}`;
        this.nextBtns = document.querySelectorAll(this.nextBtnsSelector);

        this.jumpBtnsSelector = `.jump.${panelClass}`;
        this.jumpBtns = document.querySelectorAll(this.jumpBtnsSelector);

        this.skipBtnsSelector = `.skip.${panelClass}`;
        this.skipBtns = document.querySelectorAll(this.skipBtnsSelector);

        //defaults
        this.panelsList = {};
        this.startingPanel = 0;
        this.endingPanel = this.panels.length;
        this.activePanel = null;
        this.previousPanel = null;
        this.slugToIndex = {};
        this.indexToSlug = {};
        this.updateURLs = false;

        //setup
        this._initPanels();
        this._setPanelNavigation();
        this._initWindow();
        console.debug('new panel router created');
    }

    updateRouter() {
        this._clearPanelNavigation();
        this.panels = this._childrenMatches(this.container, '.'+ this.panelClass);
        this.endingPanel = this.panels.length;
        this.prevBtns = document.querySelectorAll(this.prevBtnsSelector);
        this.nextBtns = document.querySelectorAll(this.nextBtnsSelector);
        this.skipBtns = document.querySelectorAll(this.skipBtnsSelector);
        this.jumpBtns = document.querySelectorAll(this.jumpBtnsSelector);

        this._initPanels();
        this._setPanelNavigation();

        console.debug('router updated');
    }

    _initPanels() {
        for (const [i, panel] of this.panels.entries()) {

            panel.dataset.index = i;
            let panelSlug = panel.dataset.slug ? panel.dataset.slug.toLowerCase() : "panel" + (i + 1);

            this.panelsList[i] = new Panel(panel);
            this.slugToIndex[panelSlug] = i;
            this.indexToSlug[i] = panelSlug;
        }

        console.debug('panels init');
        console.debug('PANELS:', this.panelsList);
        console.debug('slugToIndex:', this.slugToIndex);
        console.debug('IndexToSlug:', this.indexToSlug);

    }

    /*!
    * Get all direct descendant elements that match a selector
    * Dependency: the matches() polyfill: https://vanillajstoolkit.com/polyfills/matches/
    * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
    * @param  {Node}   elem     The element to get direct descendants for
    * @param  {String} selector The selector to match against
    * @return {Array}           The matching direct descendants
    */
    _childrenMatches(elem, selector) {
        return Array.prototype.filter.call(elem.children, function (child) {
            return child.matches(selector);
        });
    }

    _setPanelNavigation() {

        for (const btn of this.prevBtns) {
            btn.addEventListener('click', (event) => {
                this._back();
            });
        }
        for (const btn of this.nextBtns) {
            btn.addEventListener('click', (event) => {
                this._forward();
            });
        }
        for (const btn of this.jumpBtns) {
            btn.addEventListener('click', (event) => {
                let nextIndex = Number(event.target.dataset.jump) - 1;
                // console.log('nextIndex', nextIndex, 'active', this.activePanel);
                this._jumpTo(nextIndex);
            });
        }
        // activates only destination panel
        for (const btn of this.skipBtns) {
            btn.addEventListener('click', (event) => {
                let nextIndex = Number(event.target.dataset.skip) - 1;
                // console.log('index', nextIndex, 'active', this.activePanel);
                this._skipTo(nextIndex);
            });
        }

        console.debug('nav init');
        console.debug('PREV', this.prevBtns, 'NEXT', this.nextBtns);
        console.debug('JUMP', this.jumpBtns, 'SKIP', this.skipBtns);
    }

    _clearPanelNavigation() {
        //removes all current event listeners
        for (const btn of this.prevBtns) {
            this._resetBtn(btn);
        }
        for (const btn of this.nextBtns) {
            this._resetBtn(btn);
        }
        for (const btn of this.jumpBtns) {
            this._resetBtn(btn);
        }
        for (const btn of this.skipBtns) {
            this._resetBtn(btn);
        }
        console.debug('all btns reset');
    }

    _resetBtn(btn) {
        const btnClone = btn.cloneNode(true);
        btn.parentNode.replaceChild(btnClone, btn);
        return;
    }

    _back(updateUrl = true) {
        console.debug('active panel', this.activePanel);
        const nextIndex = this.activePanel - 1;
        this._slideOutPanel(this.activePanel);
        if (updateUrl)
            this._updateUrl(nextIndex);
    }

    _forward(updateUrl = true) {
        console.debug('active panel', this.activePanel);
        const nextIndex = this.activePanel + 1;
        this._slideInPanel(nextIndex);
        if (updateUrl)
            this._updateUrl(nextIndex);
    }

    // TODO: integrate into forward/back funcions
    // preserves order
    // activates all panels in between current and destination panel
    _jumpTo(nextIndex, updateUrl = true) {
        if (nextIndex > this.activePanel) {
            this._slideInAllPanels(nextIndex);
        }
        if (nextIndex < this.activePanel) {
            this._slideOutAllPanels(nextIndex);
        }
        if (updateUrl)
            this._updateUrl(nextIndex);
    }

    // does not preserve order
    // activates only destination panel
    _skipTo(nextIndex, updateUrl = true) {
        if (nextIndex > this.activePanel) {
            this._slideInPanel(nextIndex);
        }
        if (nextIndex < this.activePanel) {
            this._slideOutAllPanels(nextIndex);
        }
        if (updateUrl)
            this._updateUrl(nextIndex);
    }

    // listen for forward and back buttons
    _initWindow() {
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.hasOwnProperty('slug')) {
                const newIndex = this.slugToIndex[event.state.slug];
                // console.log('document location:', document.location);
                // console.log('goto:', newIndex, this.activePanel);
                let relativePosition = Number(newIndex) - Number(this.activePanel);
                // back/forward already updates URL
                // only need to update content so use "false"
                if (relativePosition === -1) {
                    this._back(false);
                }
                if (relativePosition < -1) {
                    this._jumpTo(newIndex, false);
                }
                if (relativePosition === 1) {
                    this._forward(false)
                }
                if (relativePosition > 1) {
                    this._jumpTo(newIndex, false);
                }
            }
        });
    }

    _slideInPanel(newIndex) {
        if (this._isValidIndex(newIndex)) {
            this._showPanel(newIndex);
        } else {
            console.debug('out of bounds');
        }
    }

    _slideInAllPanels(newIndex) {
        if (this._isValidIndex(newIndex)) {
            for (let i = this.activePanel; i <= newIndex; i++) {
                this._slideInPanel(i);
            }
        } else {
            console.debug('out of bounds');
        }
    }

    _slideOutPanel(currentIndex) {
        if (this._isValidIndex(currentIndex - 1)) {
            this._hidePanel(currentIndex);
        } else {
            console.debug('out of bounds')
        }
    }

    _slideOutAllPanels(newIndex) {
        if (this._isValidIndex(newIndex)) {
            for (let i = this.activePanel; i > newIndex; i--) {
                this._slideOutPanel(i);
            }
        } else {
            console.debug('out of bounds');
        }
    }

    _isValidIndex(index) {
        if (index >= 0 && index < this.endingPanel) {
            return true;
        }
        return false;
    }

    async _showPanel(index) {
        console.log('loading panel');
        let panel = this.getPanelInstance(index);
        let async = panel.hasAsyncOnQueue();

        const prevPanel = this.getPanelInstance(this.activePanel);
        this.previousPanel = this.activePanel;
        this.activePanel = index;

        if (async) {
            this._showLoader();
            this._disableNav();
        }

        await panel.activate();

        if (async) {
            // console.log('remove loader');
            this._hideLoader();
            this._enableNav();
        }

        //reset scroll
        if(prevPanel) {
            // wait for animatin to complete
            setTimeout(()=>prevPanel._resetScroll(), 400);
        }

    }

    async _hidePanel(index) {
        let panel = this.getPanelInstance(index);
        let async = panel.hasAsyncOnQueue();

        if (async) {
            this._showLoader();
            this._disableNav();
        }

        await panel.queue();

        if (async) {
            this._hideLoader();
            this._enableNav();
        }

        this.activePanel = this._nextActivePanel(index);
        this.previousPanel = index;
    }

    _showLoader() {
        console.log('loading!');
        this.loader.style.display = "block";
    }

    _hideLoader() {
        this.loader.style.display = "none";
    }

    _disableNav() {
        this._disable(this.prevBtns);
        this._disable(this.nextBtns);
        this._disable(this.skipBtns);
        this._disable(this.jumpBtns);
    }

    _enableNav() {
        this._enable(this.prevBtns);
        this._enable(this.nextBtns);
        this._enable(this.skipBtns);
        this._enable(this.jumpBtns);
    }

    _disable(buttons) {
        for (const btn of buttons) {
            btn.disabled = true;
        }
    }

    _enable(buttons) {
        for (const btn of buttons) {
            btn.disabled = false;
        }
    }

    _updateUrl(index) {
        if (this.updateURLs) {
            console.debug('index', index);
            console.debug('slug', this.indexToSlug[index]);
            console.debug('validIndex', this._isValidIndex(index));
            const slug = this.indexToSlug[index] && this._isValidIndex(index) ? this.indexToSlug[index] : false;
            if (slug) {
                document.title = slug;
                window.history.pushState({ slug }, `panel${slug}`, `/${slug}`);
                // console.log('hist', window.history);
            }
        }

    }

    _nextActivePanel(currentIndex) {
        for (let i = currentIndex - 1; i >= this.startingPanel; i--) {
            if (this.panelsList[i].isActive()) {
                return i;
            }
        }
    }

    start(index) {
        console.log('starting router');
        if (index) {
            this.activePanel = 0;
            this._slideInAllPanels(index);
            this._updateUrl(index);
        } else {
            this._showPanel(0);
            this._updateUrl(0);
        }

    }

    setPanelOptions(index, options) {
        console.debug('setting options');
        this.panelsList[index].setOptions(options);
    }

    setAllPanelOptions(options) {
        for (let i = 0; i < this.endingPanel; i++) {
            this.setPanelOptions(i, options);
        }
    }

    getPanelInstance(index) {
        console.log(`get panel i:${index}`, this.panelsList[index])
        return this.panelsList[index];
    }

    getPrevBtns() {
        return this.prevBtns;
    }

    getNextBtns() {
        return this.nextBtns;
    }

    getNumPanels() {
        return this.endingPanel;
    }

    getPanelsList() {
        console.log('PANELS:', this.panelsList);
    }

}

//matches polyfill IE9
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}