/**
 * Owl Carousel v2.3.4
 * Copyright 2013-2018 David Deutsch
 * Licensed under: SEE LICENSE IN https://github.com/OwlCarousel2/OwlCarousel2/blob/master/LICENSE
 */
/**
 * Owl carousel
 * @version 2.3.4
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 * @todo Lazy Load Icon
 * @todo prevent animationend bubling
 * @todo itemsScaleUp
 * @todo Test Zepto
 * @todo stagePadding calculate wrong active classes
 */
;(function($, window, document, undefined) {
    /**
     * Creates a carousel.
     * @class The Owl Carousel.
     * @public
     * @param {HTMLElement|jQuery} element - The element to create the carousel for.
     * @param {Object} [options] - The options
     */
    function Owl(element, options) {
        /**
         * Current settings for the carousel.
         * @public
         */
        this.settings = null

        /**
         * Current options set by the caller including defaults.
         * @public
         */
        this.options = $.extend({}, Owl.Defaults, options)

        /**
         * Plugin element.
         * @public
         */
        this.$element = $(element)

        /**
         * Proxied event handlers.
         * @protected
         */
        this._handlers = {}

        /**
         * References to the running plugins of this carousel.
         * @protected
         */
        this._plugins = {}

        /**
         * Currently suppressed events to prevent them from being retriggered.
         * @protected
         */
        this._supress = {}

        /**
         * Absolute current position.
         * @protected
         */
        this._current = null

        /**
         * Animation speed in milliseconds.
         * @protected
         */
        this._speed = null

        /**
         * Coordinates of all items in pixel.
         * @todo The name of this member is missleading.
         * @protected
         */
        this._coordinates = []

        /**
         * Current breakpoint.
         * @todo Real media queries would be nice.
         * @protected
         */
        this._breakpoint = null

        /**
         * Current width of the plugin element.
         */
        this._width = null

        /**
         * All real items.
         * @protected
         */
        this._items = []

        /**
         * All cloned items.
         * @protected
         */
        this._clones = []

        /**
         * Merge values of all items.
         * @todo Maybe this could be part of a plugin.
         * @protected
         */
        this._mergers = []

        /**
         * Widths of all items.
         */
        this._widths = []

        /**
         * Invalidated parts within the update process.
         * @protected
         */
        this._invalidated = {}

        /**
         * Ordered list of workers for the update process.
         * @protected
         */
        this._pipe = []

        /**
         * Current state information for the drag operation.
         * @todo #261
         * @protected
         */
        this._drag = {
            time: null,
            target: null,
            pointer: null,
            stage: {
                start: null,
                current: null,
            },
            direction: null,
        }

        /**
         * Current state information and their tags.
         * @type {Object}
         * @protected
         */
        this._states = {
            current: {},
            tags: {
                initializing: ['busy'],
                animating: ['busy'],
                dragging: ['interacting'],
            },
        }

        $.each(
            ['onResize', 'onThrottledResize'],
            $.proxy(function(i, handler) {
                this._handlers[handler] = $.proxy(this[handler], this)
            }, this)
        )

        $.each(
            Owl.Plugins,
            $.proxy(function(key, plugin) {
                this._plugins[
                    key.charAt(0).toLowerCase() + key.slice(1)
                ] = new plugin(this)
            }, this)
        )

        $.each(
            Owl.Workers,
            $.proxy(function(priority, worker) {
                this._pipe.push({
                    filter: worker.filter,
                    run: $.proxy(worker.run, this),
                })
            }, this)
        )

        this.setup()
        this.initialize()
    }

    /**
     * Default options for the carousel.
     * @public
     */
    Owl.Defaults = {
        items: 3,
        loop: false,
        center: false,
        rewind: false,
        checkVisibility: true,

        mouseDrag: true,
        touchDrag: true,
        pullDrag: true,
        freeDrag: false,

        margin: 0,
        stagePadding: 0,

        merge: false,
        mergeFit: true,
        autoWidth: false,

        startPosition: 0,
        rtl: false,

        smartSpeed: 250,
        fluidSpeed: false,
        dragEndSpeed: false,

        responsive: {},
        responsiveRefreshRate: 200,
        responsiveBaseElement: window,

        fallbackEasing: 'swing',
        slideTransition: '',

        info: false,

        nestedItemSelector: false,
        itemElement: 'div',
        stageElement: 'div',

        refreshClass: 'owl-refresh',
        loadedClass: 'owl-loaded',
        loadingClass: 'owl-loading',
        rtlClass: 'owl-rtl',
        responsiveClass: 'owl-responsive',
        dragClass: 'owl-drag',
        itemClass: 'owl-item',
        stageClass: 'owl-stage',
        stageOuterClass: 'owl-stage-outer',
        grabClass: 'owl-grab',
    }

    /**
     * Enumeration for width.
     * @public
     * @readonly
     * @enum {String}
     */
    Owl.Width = {
        Default: 'default',
        Inner: 'inner',
        Outer: 'outer',
    }

    /**
     * Enumeration for types.
     * @public
     * @readonly
     * @enum {String}
     */
    Owl.Type = {
        Event: 'event',
        State: 'state',
    }

    /**
     * Contains all registered plugins.
     * @public
     */
    Owl.Plugins = {}

    /**
     * List of workers involved in the update process.
     */
    Owl.Workers = [
        {
            filter: ['width', 'settings'],
            run: function() {
                this._width = this.$element.width()
            },
        },
        {
            filter: ['width', 'items', 'settings'],
            run: function(cache) {
                cache.current =
                    this._items && this._items[this.relative(this._current)]
            },
        },
        {
            filter: ['items', 'settings'],
            run: function() {
                this.$stage.children('.cloned').remove()
            },
        },
        {
            filter: ['width', 'items', 'settings'],
            run: function(cache) {
                var margin = this.settings.margin || '',
                    grid = !this.settings.autoWidth,
                    rtl = this.settings.rtl,
                    css = {
                        width: 'auto',
                        'margin-left': rtl ? margin : '',
                        'margin-right': rtl ? '' : margin,
                    }

                !grid && this.$stage.children().css(css)

                cache.css = css
            },
        },
        {
            filter: ['width', 'items', 'settings'],
            run: function(cache) {
                var width =
                        (this.width() / this.settings.items).toFixed(3) -
                        this.settings.margin,
                    merge = null,
                    iterator = this._items.length,
                    grid = !this.settings.autoWidth,
                    widths = []

                cache.items = {
                    merge: false,
                    width: width,
                }

                while (iterator--) {
                    merge = this._mergers[iterator]
                    merge =
                        (this.settings.mergeFit &&
                            Math.min(merge, this.settings.items)) ||
                        merge

                    cache.items.merge = merge > 1 || cache.items.merge

                    widths[iterator] = !grid
                        ? this._items[iterator].width()
                        : width * merge
                }

                this._widths = widths
            },
        },
        {
            filter: ['items', 'settings'],
            run: function() {
                var clones = [],
                    items = this._items,
                    settings = this.settings,
                    // TODO: Should be computed from number of min width items in stage
                    view = Math.max(settings.items * 2, 4),
                    size = Math.ceil(items.length / 2) * 2,
                    repeat =
                        settings.loop && items.length
                            ? settings.rewind
                                ? view
                                : Math.max(view, size)
                            : 0,
                    append = '',
                    prepend = ''

                repeat /= 2

                while (repeat > 0) {
                    // Switch to only using appended clones
                    clones.push(this.normalize(clones.length / 2, true))
                    append =
                        append + items[clones[clones.length - 1]][0].outerHTML
                    clones.push(
                        this.normalize(
                            items.length - 1 - (clones.length - 1) / 2,
                            true
                        )
                    )
                    prepend =
                        items[clones[clones.length - 1]][0].outerHTML + prepend
                    repeat -= 1
                }

                this._clones = clones

                $(append)
                    .addClass('cloned')
                    .appendTo(this.$stage)
                $(prepend)
                    .addClass('cloned')
                    .prependTo(this.$stage)
            },
        },
        {
            filter: ['width', 'items', 'settings'],
            run: function() {
                var rtl = this.settings.rtl ? 1 : -1,
                    size = this._clones.length + this._items.length,
                    iterator = -1,
                    previous = 0,
                    current = 0,
                    coordinates = []

                while (++iterator < size) {
                    previous = coordinates[iterator - 1] || 0
                    current =
                        this._widths[this.relative(iterator)] +
                        this.settings.margin
                    coordinates.push(previous + current * rtl)
                }

                this._coordinates = coordinates
            },
        },
        {
            filter: ['width', 'items', 'settings'],
            run: function() {
                var padding = this.settings.stagePadding,
                    coordinates = this._coordinates,
                    css = {
                        width:
                            Math.ceil(
                                Math.abs(coordinates[coordinates.length - 1])
                            ) +
                            padding * 2,
                        'padding-left': padding || '',
                        'padding-right': padding || '',
                    }

                this.$stage.css(css)
            },
        },
        {
            filter: ['width', 'items', 'settings'],
            run: function(cache) {
                var iterator = this._coordinates.length,
                    grid = !this.settings.autoWidth,
                    items = this.$stage.children()

                if (grid && cache.items.merge) {
                    while (iterator--) {
                        cache.css.width = this._widths[this.relative(iterator)]
                        items.eq(iterator).css(cache.css)
                    }
                } else if (grid) {
                    cache.css.width = cache.items.width
                    items.css(cache.css)
                }
            },
        },
        {
            filter: ['items'],
            run: function() {
                this._coordinates.length < 1 && this.$stage.removeAttr('style')
            },
        },
        {
            filter: ['width', 'items', 'settings'],
            run: function(cache) {
                cache.current = cache.current
                    ? this.$stage.children().index(cache.current)
                    : 0
                cache.current = Math.max(
                    this.minimum(),
                    Math.min(this.maximum(), cache.current)
                )
                this.reset(cache.current)
            },
        },
        {
            filter: ['position'],
            run: function() {
                this.animate(this.coordinates(this._current))
            },
        },
        {
            filter: ['width', 'position', 'items', 'settings'],
            run: function() {
                var rtl = this.settings.rtl ? 1 : -1,
                    padding = this.settings.stagePadding * 2,
                    begin = this.coordinates(this.current()) + padding,
                    end = begin + this.width() * rtl,
                    inner,
                    outer,
                    matches = [],
                    i,
                    n

                for (i = 0, n = this._coordinates.length; i < n; i++) {
                    inner = this._coordinates[i - 1] || 0
                    outer = Math.abs(this._coordinates[i]) + padding * rtl

                    if (
                        (this.op(inner, '<=', begin) &&
                            this.op(inner, '>', end)) ||
                        (this.op(outer, '<', begin) && this.op(outer, '>', end))
                    ) {
                        matches.push(i)
                    }
                }

                this.$stage.children('.active').removeClass('active')
                this.$stage
                    .children(':eq(' + matches.join('), :eq(') + ')')
                    .addClass('active')

                this.$stage.children('.center').removeClass('center')
                if (this.settings.center) {
                    this.$stage
                        .children()
                        .eq(this.current())
                        .addClass('center')
                }
            },
        },
    ]

    /**
     * Create the stage DOM element
     */
    Owl.prototype.initializeStage = function() {
        this.$stage = this.$element.find('.' + this.settings.stageClass)

        // if the stage is already in the DOM, grab it and skip stage initialization
        if (this.$stage.length) {
            return
        }

        this.$element.addClass(this.options.loadingClass)

        // create stage
        this.$stage = $('<' + this.settings.stageElement + '>', {
            class: this.settings.stageClass,
        }).wrap(
            $('<div/>', {
                class: this.settings.stageOuterClass,
            })
        )

        // append stage
        this.$element.append(this.$stage.parent())
    }

    /**
     * Create item DOM elements
     */
    Owl.prototype.initializeItems = function() {
        var $items = this.$element.find('.owl-item')

        // if the items are already in the DOM, grab them and skip item initialization
        if ($items.length) {
            this._items = $items.get().map(function(item) {
                return $(item)
            })

            this._mergers = this._items.map(function() {
                return 1
            })

            this.refresh()

            return
        }

        // append content
        this.replace(this.$element.children().not(this.$stage.parent()))

        // check visibility
        if (this.isVisible()) {
            // update view
            this.refresh()
        } else {
            // invalidate width
            this.invalidate('width')
        }

        this.$element
            .removeClass(this.options.loadingClass)
            .addClass(this.options.loadedClass)
    }

    /**
     * Initializes the carousel.
     * @protected
     */
    Owl.prototype.initialize = function() {
        this.enter('initializing')
        this.trigger('initialize')

        this.$element.toggleClass(this.settings.rtlClass, this.settings.rtl)

        if (this.settings.autoWidth && !this.is('pre-loading')) {
            var imgs, nestedSelector, width
            imgs = this.$element.find('img')
            nestedSelector = this.settings.nestedItemSelector
                ? '.' + this.settings.nestedItemSelector
                : undefined
            width = this.$element.children(nestedSelector).width()

            if (imgs.length && width <= 0) {
                this.preloadAutoWidthImages(imgs)
            }
        }

        this.initializeStage()
        this.initializeItems()

        // register event handlers
        this.registerEventHandlers()

        this.leave('initializing')
        this.trigger('initialized')
    }

    /**
     * @returns {Boolean} visibility of $element
     *                    if you know the carousel will always be visible you can set `checkVisibility` to `false` to
     *                    prevent the expensive browser layout forced reflow the $element.is(':visible') does
     */
    Owl.prototype.isVisible = function() {
        return this.settings.checkVisibility
            ? this.$element.is(':visible')
            : true
    }

    /**
     * Setups the current settings.
     * @todo Remove responsive classes. Why should adaptive designs be brought into IE8?
     * @todo Support for media queries by using `matchMedia` would be nice.
     * @public
     */
    Owl.prototype.setup = function() {
        var viewport = this.viewport(),
            overwrites = this.options.responsive,
            match = -1,
            settings = null

        if (!overwrites) {
            settings = $.extend({}, this.options)
        } else {
            $.each(overwrites, function(breakpoint) {
                if (breakpoint <= viewport && breakpoint > match) {
                    match = Number(breakpoint)
                }
            })

            settings = $.extend({}, this.options, overwrites[match])
            if (typeof settings.stagePadding === 'function') {
                settings.stagePadding = settings.stagePadding()
            }
            delete settings.responsive

            // responsive class
            if (settings.responsiveClass) {
                this.$element.attr(
                    'class',
                    this.$element
                        .attr('class')
                        .replace(
                            new RegExp(
                                '(' +
                                    this.options.responsiveClass +
                                    '-)\\S+\\s',
                                'g'
                            ),
                            '$1' + match
                        )
                )
            }
        }

        this.trigger('change', {
            property: { name: 'settings', value: settings },
        })
        this._breakpoint = match
        this.settings = settings
        this.invalidate('settings')
        this.trigger('changed', {
            property: { name: 'settings', value: this.settings },
        })
    }

    /**
     * Updates option logic if necessery.
     * @protected
     */
    Owl.prototype.optionsLogic = function() {
        if (this.settings.autoWidth) {
            this.settings.stagePadding = false
            this.settings.merge = false
        }
    }

    /**
     * Prepares an item before add.
     * @todo Rename event parameter `content` to `item`.
     * @protected
     * @returns {jQuery|HTMLElement} - The item container.
     */
    Owl.prototype.prepare = function(item) {
        var event = this.trigger('prepare', { content: item })

        if (!event.data) {
            event.data = $('<' + this.settings.itemElement + '/>')
                .addClass(this.options.itemClass)
                .append(item)
        }

        this.trigger('prepared', { content: event.data })

        return event.data
    }

    /**
     * Updates the view.
     * @public
     */
    Owl.prototype.update = function() {
        var i = 0,
            n = this._pipe.length,
            filter = $.proxy(function(p) {
                return this[p]
            }, this._invalidated),
            cache = {}

        while (i < n) {
            if (
                this._invalidated.all ||
                $.grep(this._pipe[i].filter, filter).length > 0
            ) {
                this._pipe[i].run(cache)
            }
            i++
        }

        this._invalidated = {}

        !this.is('valid') && this.enter('valid')
    }

    /**
     * Gets the width of the view.
     * @public
     * @param {Owl.Width} [dimension=Owl.Width.Default] - The dimension to return.
     * @returns {Number} - The width of the view in pixel.
     */
    Owl.prototype.width = function(dimension) {
        dimension = dimension || Owl.Width.Default
        switch (dimension) {
            case Owl.Width.Inner:
            case Owl.Width.Outer:
                return this._width
            default:
                return (
                    this._width -
                    this.settings.stagePadding * 2 +
                    this.settings.margin
                )
        }
    }

    /**
     * Refreshes the carousel primarily for adaptive purposes.
     * @public
     */
    Owl.prototype.refresh = function() {
        this.enter('refreshing')
        this.trigger('refresh')

        this.setup()

        this.optionsLogic()

        this.$element.addClass(this.options.refreshClass)

        this.update()

        this.$element.removeClass(this.options.refreshClass)

        this.leave('refreshing')
        this.trigger('refreshed')
    }

    /**
     * Checks window `resize` event.
     * @protected
     */
    Owl.prototype.onThrottledResize = function() {
        window.clearTimeout(this.resizeTimer)
        this.resizeTimer = window.setTimeout(
            this._handlers.onResize,
            this.settings.responsiveRefreshRate
        )
    }

    /**
     * Checks window `resize` event.
     * @protected
     */
    Owl.prototype.onResize = function() {
        if (!this._items.length) {
            return false
        }

        if (this._width === this.$element.width()) {
            return false
        }

        if (!this.isVisible()) {
            return false
        }

        this.enter('resizing')

        if (this.trigger('resize').isDefaultPrevented()) {
            this.leave('resizing')
            return false
        }

        this.invalidate('width')

        this.refresh()

        this.leave('resizing')
        this.trigger('resized')
    }

    /**
     * Registers event handlers.
     * @todo Check `msPointerEnabled`
     * @todo #261
     * @protected
     */
    Owl.prototype.registerEventHandlers = function() {
        if ($.support.transition) {
            this.$stage.on(
                $.support.transition.end + '.owl.core',
                $.proxy(this.onTransitionEnd, this)
            )
        }

        if (this.settings.responsive !== false) {
            this.on(window, 'resize', this._handlers.onThrottledResize)
        }

        if (this.settings.mouseDrag) {
            this.$element.addClass(this.options.dragClass)
            this.$stage.on(
                'mousedown.owl.core',
                $.proxy(this.onDragStart, this)
            )
            this.$stage.on(
                'dragstart.owl.core selectstart.owl.core',
                function() {
                    return false
                }
            )
        }

        if (this.settings.touchDrag) {
            this.$stage.on(
                'touchstart.owl.core',
                $.proxy(this.onDragStart, this)
            )
            this.$stage.on(
                'touchcancel.owl.core',
                $.proxy(this.onDragEnd, this)
            )
        }
    }

    /**
     * Handles `touchstart` and `mousedown` events.
     * @todo Horizontal swipe threshold as option
     * @todo #261
     * @protected
     * @param {Event} event - The event arguments.
     */
    Owl.prototype.onDragStart = function(event) {
        var stage = null

        if (event.which === 3) {
            return
        }

        if ($.support.transform) {
            stage = this.$stage
                .css('transform')
                .replace(/.*\(|\)| /g, '')
                .split(',')
            stage = {
                x: stage[stage.length === 16 ? 12 : 4],
                y: stage[stage.length === 16 ? 13 : 5],
            }
        } else {
            stage = this.$stage.position()
            stage = {
                x: this.settings.rtl
                    ? stage.left +
                      this.$stage.width() -
                      this.width() +
                      this.settings.margin
                    : stage.left,
                y: stage.top,
            }
        }

        if (this.is('animating')) {
            $.support.transform ? this.animate(stage.x) : this.$stage.stop()
            this.invalidate('position')
        }

        this.$element.toggleClass(
            this.options.grabClass,
            event.type === 'mousedown'
        )

        this.speed(0)

        this._drag.time = new Date().getTime()
        this._drag.target = $(event.target)
        this._drag.stage.start = stage
        this._drag.stage.current = stage
        this._drag.pointer = this.pointer(event)

        $(document).on(
            'mouseup.owl.core touchend.owl.core',
            $.proxy(this.onDragEnd, this)
        )

        $(document).one(
            'mousemove.owl.core touchmove.owl.core',
            $.proxy(function(event) {
                var delta = this.difference(
                    this._drag.pointer,
                    this.pointer(event)
                )

                $(document).on(
                    'mousemove.owl.core touchmove.owl.core',
                    $.proxy(this.onDragMove, this)
                )

                if (Math.abs(delta.x) < Math.abs(delta.y) && this.is('valid')) {
                    return
                }

                event.preventDefault()

                this.enter('dragging')
                this.trigger('drag')
            }, this)
        )
    }

    /**
     * Handles the `touchmove` and `mousemove` events.
     * @todo #261
     * @protected
     * @param {Event} event - The event arguments.
     */
    Owl.prototype.onDragMove = function(event) {
        var minimum = null,
            maximum = null,
            pull = null,
            delta = this.difference(this._drag.pointer, this.pointer(event)),
            stage = this.difference(this._drag.stage.start, delta)

        if (!this.is('dragging')) {
            return
        }

        event.preventDefault()

        if (this.settings.loop) {
            minimum = this.coordinates(this.minimum())
            maximum = this.coordinates(this.maximum() + 1) - minimum
            stage.x =
                ((((stage.x - minimum) % maximum) + maximum) % maximum) +
                minimum
        } else {
            minimum = this.settings.rtl
                ? this.coordinates(this.maximum())
                : this.coordinates(this.minimum())
            maximum = this.settings.rtl
                ? this.coordinates(this.minimum())
                : this.coordinates(this.maximum())
            pull = this.settings.pullDrag ? (-1 * delta.x) / 5 : 0
            stage.x = Math.max(
                Math.min(stage.x, minimum + pull),
                maximum + pull
            )
        }

        this._drag.stage.current = stage

        this.animate(stage.x)
    }

    /**
     * Handles the `touchend` and `mouseup` events.
     * @todo #261
     * @todo Threshold for click event
     * @protected
     * @param {Event} event - The event arguments.
     */
    Owl.prototype.onDragEnd = function(event) {
        var delta = this.difference(this._drag.pointer, this.pointer(event)),
            stage = this._drag.stage.current,
            direction = (delta.x > 0) ^ this.settings.rtl ? 'left' : 'right'

        $(document).off('.owl.core')

        this.$element.removeClass(this.options.grabClass)

        if ((delta.x !== 0 && this.is('dragging')) || !this.is('valid')) {
            this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed)
            this.current(
                this.closest(
                    stage.x,
                    delta.x !== 0 ? direction : this._drag.direction
                )
            )
            this.invalidate('position')
            this.update()

            this._drag.direction = direction

            if (
                Math.abs(delta.x) > 3 ||
                new Date().getTime() - this._drag.time > 300
            ) {
                this._drag.target.one('click.owl.core', function() {
                    return false
                })
            }
        }

        if (!this.is('dragging')) {
            return
        }

        this.leave('dragging')
        this.trigger('dragged')
    }

    /**
     * Gets absolute position of the closest item for a coordinate.
     * @todo Setting `freeDrag` makes `closest` not reusable. See #165.
     * @protected
     * @param {Number} coordinate - The coordinate in pixel.
     * @param {String} direction - The direction to check for the closest item. Ether `left` or `right`.
     * @return {Number} - The absolute position of the closest item.
     */
    Owl.prototype.closest = function(coordinate, direction) {
        var position = -1,
            pull = 30,
            width = this.width(),
            coordinates = this.coordinates()

        if (!this.settings.freeDrag) {
            // check closest item
            $.each(
                coordinates,
                $.proxy(function(index, value) {
                    // on a left pull, check on current index
                    if (
                        direction === 'left' &&
                        coordinate > value - pull &&
                        coordinate < value + pull
                    ) {
                        position = index
                        // on a right pull, check on previous index
                        // to do so, subtract width from value and set position = index + 1
                    } else if (
                        direction === 'right' &&
                        coordinate > value - width - pull &&
                        coordinate < value - width + pull
                    ) {
                        position = index + 1
                    } else if (
                        this.op(coordinate, '<', value) &&
                        this.op(
                            coordinate,
                            '>',
                            coordinates[index + 1] !== undefined
                                ? coordinates[index + 1]
                                : value - width
                        )
                    ) {
                        position = direction === 'left' ? index + 1 : index
                    }
                    return position === -1
                }, this)
            )
        }

        if (!this.settings.loop) {
            // non loop boundries
            if (this.op(coordinate, '>', coordinates[this.minimum()])) {
                position = coordinate = this.minimum()
            } else if (this.op(coordinate, '<', coordinates[this.maximum()])) {
                position = coordinate = this.maximum()
            }
        }

        return position
    }

    /**
     * Animates the stage.
     * @todo #270
     * @public
     * @param {Number} coordinate - The coordinate in pixels.
     */
    Owl.prototype.animate = function(coordinate) {
        var animate = this.speed() > 0

        this.is('animating') && this.onTransitionEnd()

        if (animate) {
            this.enter('animating')
            this.trigger('translate')
        }

        if ($.support.transform3d && $.support.transition) {
            this.$stage.css({
                transform: 'translate3d(' + coordinate + 'px,0px,0px)',
                transition:
                    this.speed() / 1000 +
                    's' +
                    (this.settings.slideTransition
                        ? ' ' + this.settings.slideTransition
                        : ''),
            })
        } else if (animate) {
            this.$stage.animate(
                {
                    left: coordinate + 'px',
                },
                this.speed(),
                this.settings.fallbackEasing,
                $.proxy(this.onTransitionEnd, this)
            )
        } else {
            this.$stage.css({
                left: coordinate + 'px',
            })
        }
    }

    /**
     * Checks whether the carousel is in a specific state or not.
     * @param {String} state - The state to check.
     * @returns {Boolean} - The flag which indicates if the carousel is busy.
     */
    Owl.prototype.is = function(state) {
        return this._states.current[state] && this._states.current[state] > 0
    }

    /**
     * Sets the absolute position of the current item.
     * @public
     * @param {Number} [position] - The new absolute position or nothing to leave it unchanged.
     * @returns {Number} - The absolute position of the current item.
     */
    Owl.prototype.current = function(position) {
        if (position === undefined) {
            return this._current
        }

        if (this._items.length === 0) {
            return undefined
        }

        position = this.normalize(position)

        if (this._current !== position) {
            var event = this.trigger('change', {
                property: { name: 'position', value: position },
            })

            if (event.data !== undefined) {
                position = this.normalize(event.data)
            }

            this._current = position

            this.invalidate('position')

            this.trigger('changed', {
                property: { name: 'position', value: this._current },
            })
        }

        return this._current
    }

    /**
     * Invalidates the given part of the update routine.
     * @param {String} [part] - The part to invalidate.
     * @returns {Array.<String>} - The invalidated parts.
     */
    Owl.prototype.invalidate = function(part) {
        if ($.type(part) === 'string') {
            this._invalidated[part] = true
            this.is('valid') && this.leave('valid')
        }
        return $.map(this._invalidated, function(v, i) {
            return i
        })
    }

    /**
     * Resets the absolute position of the current item.
     * @public
     * @param {Number} position - The absolute position of the new item.
     */
    Owl.prototype.reset = function(position) {
        position = this.normalize(position)

        if (position === undefined) {
            return
        }

        this._speed = 0
        this._current = position

        this.suppress(['translate', 'translated'])

        this.animate(this.coordinates(position))

        this.release(['translate', 'translated'])
    }

    /**
     * Normalizes an absolute or a relative position of an item.
     * @public
     * @param {Number} position - The absolute or relative position to normalize.
     * @param {Boolean} [relative=false] - Whether the given position is relative or not.
     * @returns {Number} - The normalized position.
     */
    Owl.prototype.normalize = function(position, relative) {
        var n = this._items.length,
            m = relative ? 0 : this._clones.length

        if (!this.isNumeric(position) || n < 1) {
            position = undefined
        } else if (position < 0 || position >= n + m) {
            position = ((((position - m / 2) % n) + n) % n) + m / 2
        }

        return position
    }

    /**
     * Converts an absolute position of an item into a relative one.
     * @public
     * @param {Number} position - The absolute position to convert.
     * @returns {Number} - The converted position.
     */
    Owl.prototype.relative = function(position) {
        position -= this._clones.length / 2
        return this.normalize(position, true)
    }

    /**
     * Gets the maximum position for the current item.
     * @public
     * @param {Boolean} [relative=false] - Whether to return an absolute position or a relative position.
     * @returns {Number}
     */
    Owl.prototype.maximum = function(relative) {
        var settings = this.settings,
            maximum = this._coordinates.length,
            iterator,
            reciprocalItemsWidth,
            elementWidth

        if (settings.loop) {
            maximum = this._clones.length / 2 + this._items.length - 1
        } else if (settings.autoWidth || settings.merge) {
            iterator = this._items.length
            if (iterator) {
                reciprocalItemsWidth = this._items[--iterator].width()
                elementWidth = this.$element.width()
                while (iterator--) {
                    reciprocalItemsWidth +=
                        this._items[iterator].width() + this.settings.margin
                    if (reciprocalItemsWidth > elementWidth) {
                        break
                    }
                }
            }
            maximum = iterator + 1
        } else if (settings.center) {
            maximum = this._items.length - 1
        } else {
            maximum = this._items.length - settings.items
        }

        if (relative) {
            maximum -= this._clones.length / 2
        }

        return Math.max(maximum, 0)
    }

    /**
     * Gets the minimum position for the current item.
     * @public
     * @param {Boolean} [relative=false] - Whether to return an absolute position or a relative position.
     * @returns {Number}
     */
    Owl.prototype.minimum = function(relative) {
        return relative ? 0 : this._clones.length / 2
    }

    /**
     * Gets an item at the specified relative position.
     * @public
     * @param {Number} [position] - The relative position of the item.
     * @return {jQuery|Array.<jQuery>} - The item at the given position or all items if no position was given.
     */
    Owl.prototype.items = function(position) {
        if (position === undefined) {
            return this._items.slice()
        }

        position = this.normalize(position, true)
        return this._items[position]
    }

    /**
     * Gets an item at the specified relative position.
     * @public
     * @param {Number} [position] - The relative position of the item.
     * @return {jQuery|Array.<jQuery>} - The item at the given position or all items if no position was given.
     */
    Owl.prototype.mergers = function(position) {
        if (position === undefined) {
            return this._mergers.slice()
        }

        position = this.normalize(position, true)
        return this._mergers[position]
    }

    /**
     * Gets the absolute positions of clones for an item.
     * @public
     * @param {Number} [position] - The relative position of the item.
     * @returns {Array.<Number>} - The absolute positions of clones for the item or all if no position was given.
     */
    Owl.prototype.clones = function(position) {
        var odd = this._clones.length / 2,
            even = odd + this._items.length,
            map = function(index) {
                return index % 2 === 0
                    ? even + index / 2
                    : odd - (index + 1) / 2
            }

        if (position === undefined) {
            return $.map(this._clones, function(v, i) {
                return map(i)
            })
        }

        return $.map(this._clones, function(v, i) {
            return v === position ? map(i) : null
        })
    }

    /**
     * Sets the current animation speed.
     * @public
     * @param {Number} [speed] - The animation speed in milliseconds or nothing to leave it unchanged.
     * @returns {Number} - The current animation speed in milliseconds.
     */
    Owl.prototype.speed = function(speed) {
        if (speed !== undefined) {
            this._speed = speed
        }

        return this._speed
    }

    /**
     * Gets the coordinate of an item.
     * @todo The name of this method is missleanding.
     * @public
     * @param {Number} position - The absolute position of the item within `minimum()` and `maximum()`.
     * @returns {Number|Array.<Number>} - The coordinate of the item in pixel or all coordinates.
     */
    Owl.prototype.coordinates = function(position) {
        var multiplier = 1,
            newPosition = position - 1,
            coordinate

        if (position === undefined) {
            return $.map(
                this._coordinates,
                $.proxy(function(coordinate, index) {
                    return this.coordinates(index)
                }, this)
            )
        }

        if (this.settings.center) {
            if (this.settings.rtl) {
                multiplier = -1
                newPosition = position + 1
            }

            coordinate = this._coordinates[position]
            coordinate +=
                ((this.width() -
                    coordinate +
                    (this._coordinates[newPosition] || 0)) /
                    2) *
                multiplier
        } else {
            coordinate = this._coordinates[newPosition] || 0
        }

        coordinate = Math.ceil(coordinate)

        return coordinate
    }

    /**
     * Calculates the speed for a translation.
     * @protected
     * @param {Number} from - The absolute position of the start item.
     * @param {Number} to - The absolute position of the target item.
     * @param {Number} [factor=undefined] - The time factor in milliseconds.
     * @returns {Number} - The time in milliseconds for the translation.
     */
    Owl.prototype.duration = function(from, to, factor) {
        if (factor === 0) {
            return 0
        }

        return (
            Math.min(Math.max(Math.abs(to - from), 1), 6) *
            Math.abs(factor || this.settings.smartSpeed)
        )
    }

    /**
     * Slides to the specified item.
     * @public
     * @param {Number} position - The position of the item.
     * @param {Number} [speed] - The time in milliseconds for the transition.
     */
    Owl.prototype.to = function(position, speed) {
        var current = this.current(),
            revert = null,
            distance = position - this.relative(current),
            direction = (distance > 0) - (distance < 0),
            items = this._items.length,
            minimum = this.minimum(),
            maximum = this.maximum()

        if (this.settings.loop) {
            if (!this.settings.rewind && Math.abs(distance) > items / 2) {
                distance += direction * -1 * items
            }

            position = current + distance
            revert =
                ((((position - minimum) % items) + items) % items) + minimum

            if (
                revert !== position &&
                revert - distance <= maximum &&
                revert - distance > 0
            ) {
                current = revert - distance
                position = revert
                this.reset(current)
            }
        } else if (this.settings.rewind) {
            maximum += 1
            position = ((position % maximum) + maximum) % maximum
        } else {
            position = Math.max(minimum, Math.min(maximum, position))
        }

        this.speed(this.duration(current, position, speed))
        this.current(position)

        if (this.isVisible()) {
            this.update()
        }
    }

    /**
     * Slides to the next item.
     * @public
     * @param {Number} [speed] - The time in milliseconds for the transition.
     */
    Owl.prototype.next = function(speed) {
        speed = speed || false
        this.to(this.relative(this.current()) + 1, speed)
    }

    /**
     * Slides to the previous item.
     * @public
     * @param {Number} [speed] - The time in milliseconds for the transition.
     */
    Owl.prototype.prev = function(speed) {
        speed = speed || false
        this.to(this.relative(this.current()) - 1, speed)
    }

    /**
     * Handles the end of an animation.
     * @protected
     * @param {Event} event - The event arguments.
     */
    Owl.prototype.onTransitionEnd = function(event) {
        // if css2 animation then event object is undefined
        if (event !== undefined) {
            event.stopPropagation()

            // Catch only owl-stage transitionEnd event
            if (
                (event.target || event.srcElement || event.originalTarget) !==
                this.$stage.get(0)
            ) {
                return false
            }
        }

        this.leave('animating')
        this.trigger('translated')
    }

    /**
     * Gets viewport width.
     * @protected
     * @return {Number} - The width in pixel.
     */
    Owl.prototype.viewport = function() {
        var width
        if (this.options.responsiveBaseElement !== window) {
            width = $(this.options.responsiveBaseElement).width()
        } else if (window.innerWidth) {
            width = window.innerWidth
        } else if (
            document.documentElement &&
            document.documentElement.clientWidth
        ) {
            width = document.documentElement.clientWidth
        } else {
            console.warn('Can not detect viewport width.')
        }
        return width
    }

    /**
     * Replaces the current content.
     * @public
     * @param {HTMLElement|jQuery|String} content - The new content.
     */
    Owl.prototype.replace = function(content) {
        this.$stage.empty()
        this._items = []

        if (content) {
            content = content instanceof jQuery ? content : $(content)
        }

        if (this.settings.nestedItemSelector) {
            content = content.find('.' + this.settings.nestedItemSelector)
        }

        content
            .filter(function() {
                return this.nodeType === 1
            })
            .each(
                $.proxy(function(index, item) {
                    item = this.prepare(item)
                    this.$stage.append(item)
                    this._items.push(item)
                    this._mergers.push(
                        item
                            .find('[data-merge]')
                            .addBack('[data-merge]')
                            .attr('data-merge') * 1 || 1
                    )
                }, this)
            )

        this.reset(
            this.isNumeric(this.settings.startPosition)
                ? this.settings.startPosition
                : 0
        )

        this.invalidate('items')
    }

    /**
     * Adds an item.
     * @todo Use `item` instead of `content` for the event arguments.
     * @public
     * @param {HTMLElement|jQuery|String} content - The item content to add.
     * @param {Number} [position] - The relative position at which to insert the item otherwise the item will be added to the end.
     */
    Owl.prototype.add = function(content, position) {
        var current = this.relative(this._current)

        position =
            position === undefined
                ? this._items.length
                : this.normalize(position, true)
        content = content instanceof jQuery ? content : $(content)

        this.trigger('add', { content: content, position: position })

        content = this.prepare(content)

        if (this._items.length === 0 || position === this._items.length) {
            this._items.length === 0 && this.$stage.append(content)
            this._items.length !== 0 && this._items[position - 1].after(content)
            this._items.push(content)
            this._mergers.push(
                content
                    .find('[data-merge]')
                    .addBack('[data-merge]')
                    .attr('data-merge') * 1 || 1
            )
        } else {
            this._items[position].before(content)
            this._items.splice(position, 0, content)
            this._mergers.splice(
                position,
                0,
                content
                    .find('[data-merge]')
                    .addBack('[data-merge]')
                    .attr('data-merge') * 1 || 1
            )
        }

        this._items[current] && this.reset(this._items[current].index())

        this.invalidate('items')

        this.trigger('added', { content: content, position: position })
    }

    /**
     * Removes an item by its position.
     * @todo Use `item` instead of `content` for the event arguments.
     * @public
     * @param {Number} position - The relative position of the item to remove.
     */
    Owl.prototype.remove = function(position) {
        position = this.normalize(position, true)

        if (position === undefined) {
            return
        }

        this.trigger('remove', {
            content: this._items[position],
            position: position,
        })

        this._items[position].remove()
        this._items.splice(position, 1)
        this._mergers.splice(position, 1)

        this.invalidate('items')

        this.trigger('removed', { content: null, position: position })
    }

    /**
     * Preloads images with auto width.
     * @todo Replace by a more generic approach
     * @protected
     */
    Owl.prototype.preloadAutoWidthImages = function(images) {
        images.each(
            $.proxy(function(i, element) {
                this.enter('pre-loading')
                element = $(element)
                $(new Image())
                    .one(
                        'load',
                        $.proxy(function(e) {
                            element.attr('src', e.target.src)
                            element.css('opacity', 1)
                            this.leave('pre-loading')
                            !this.is('pre-loading') &&
                                !this.is('initializing') &&
                                this.refresh()
                        }, this)
                    )
                    .attr(
                        'src',
                        element.attr('src') ||
                            element.attr('data-src') ||
                            element.attr('data-src-retina')
                    )
            }, this)
        )
    }

    /**
     * Destroys the carousel.
     * @public
     */
    Owl.prototype.destroy = function() {
        this.$element.off('.owl.core')
        this.$stage.off('.owl.core')
        $(document).off('.owl.core')

        if (this.settings.responsive !== false) {
            window.clearTimeout(this.resizeTimer)
            this.off(window, 'resize', this._handlers.onThrottledResize)
        }

        for (var i in this._plugins) {
            this._plugins[i].destroy()
        }

        this.$stage.children('.cloned').remove()

        this.$stage.unwrap()
        this.$stage
            .children()
            .contents()
            .unwrap()
        this.$stage.children().unwrap()
        this.$stage.remove()
        this.$element
            .removeClass(this.options.refreshClass)
            .removeClass(this.options.loadingClass)
            .removeClass(this.options.loadedClass)
            .removeClass(this.options.rtlClass)
            .removeClass(this.options.dragClass)
            .removeClass(this.options.grabClass)
            .attr(
                'class',
                this.$element
                    .attr('class')
                    .replace(
                        new RegExp(
                            this.options.responsiveClass + '-\\S+\\s',
                            'g'
                        ),
                        ''
                    )
            )
            .removeData('owl.carousel')
    }

    /**
     * Operators to calculate right-to-left and left-to-right.
     * @protected
     * @param {Number} [a] - The left side operand.
     * @param {String} [o] - The operator.
     * @param {Number} [b] - The right side operand.
     */
    Owl.prototype.op = function(a, o, b) {
        var rtl = this.settings.rtl
        switch (o) {
            case '<':
                return rtl ? a > b : a < b
            case '>':
                return rtl ? a < b : a > b
            case '>=':
                return rtl ? a <= b : a >= b
            case '<=':
                return rtl ? a >= b : a <= b
            default:
                break
        }
    }

    /**
     * Attaches to an internal event.
     * @protected
     * @param {HTMLElement} element - The event source.
     * @param {String} event - The event name.
     * @param {Function} listener - The event handler to attach.
     * @param {Boolean} capture - Wether the event should be handled at the capturing phase or not.
     */
    Owl.prototype.on = function(element, event, listener, capture) {
        if (element.addEventListener) {
            element.addEventListener(event, listener, capture)
        } else if (element.attachEvent) {
            element.attachEvent('on' + event, listener)
        }
    }

    /**
     * Detaches from an internal event.
     * @protected
     * @param {HTMLElement} element - The event source.
     * @param {String} event - The event name.
     * @param {Function} listener - The attached event handler to detach.
     * @param {Boolean} capture - Wether the attached event handler was registered as a capturing listener or not.
     */
    Owl.prototype.off = function(element, event, listener, capture) {
        if (element.removeEventListener) {
            element.removeEventListener(event, listener, capture)
        } else if (element.detachEvent) {
            element.detachEvent('on' + event, listener)
        }
    }

    /**
     * Triggers a public event.
     * @todo Remove `status`, `relatedTarget` should be used instead.
     * @protected
     * @param {String} name - The event name.
     * @param {*} [data=null] - The event data.
     * @param {String} [namespace=carousel] - The event namespace.
     * @param {String} [state] - The state which is associated with the event.
     * @param {Boolean} [enter=false] - Indicates if the call enters the specified state or not.
     * @returns {Event} - The event arguments.
     */
    Owl.prototype.trigger = function(name, data, namespace, state, enter) {
        var status = {
                item: { count: this._items.length, index: this.current() },
            },
            handler = $.camelCase(
                $.grep(['on', name, namespace], function(v) {
                    return v
                })
                    .join('-')
                    .toLowerCase()
            ),
            event = $.Event(
                [name, 'owl', namespace || 'carousel'].join('.').toLowerCase(),
                $.extend({ relatedTarget: this }, status, data)
            )

        if (!this._supress[name]) {
            $.each(this._plugins, function(name, plugin) {
                if (plugin.onTrigger) {
                    plugin.onTrigger(event)
                }
            })

            this.register({ type: Owl.Type.Event, name: name })
            this.$element.trigger(event)

            if (this.settings && typeof this.settings[handler] === 'function') {
                this.settings[handler].call(this, event)
            }
        }

        return event
    }

    /**
     * Enters a state.
     * @param name - The state name.
     */
    Owl.prototype.enter = function(name) {
        $.each(
            [name].concat(this._states.tags[name] || []),
            $.proxy(function(i, name) {
                if (this._states.current[name] === undefined) {
                    this._states.current[name] = 0
                }

                this._states.current[name]++
            }, this)
        )
    }

    /**
     * Leaves a state.
     * @param name - The state name.
     */
    Owl.prototype.leave = function(name) {
        $.each(
            [name].concat(this._states.tags[name] || []),
            $.proxy(function(i, name) {
                this._states.current[name]--
            }, this)
        )
    }

    /**
     * Registers an event or state.
     * @public
     * @param {Object} object - The event or state to register.
     */
    Owl.prototype.register = function(object) {
        if (object.type === Owl.Type.Event) {
            if (!$.event.special[object.name]) {
                $.event.special[object.name] = {}
            }

            if (!$.event.special[object.name].owl) {
                var _default = $.event.special[object.name]._default
                $.event.special[object.name]._default = function(e) {
                    if (
                        _default &&
                        _default.apply &&
                        (!e.namespace || e.namespace.indexOf('owl') === -1)
                    ) {
                        return _default.apply(this, arguments)
                    }
                    return e.namespace && e.namespace.indexOf('owl') > -1
                }
                $.event.special[object.name].owl = true
            }
        } else if (object.type === Owl.Type.State) {
            if (!this._states.tags[object.name]) {
                this._states.tags[object.name] = object.tags
            } else {
                this._states.tags[object.name] = this._states.tags[
                    object.name
                ].concat(object.tags)
            }

            this._states.tags[object.name] = $.grep(
                this._states.tags[object.name],
                $.proxy(function(tag, i) {
                    return $.inArray(tag, this._states.tags[object.name]) === i
                }, this)
            )
        }
    }

    /**
     * Suppresses events.
     * @protected
     * @param {Array.<String>} events - The events to suppress.
     */
    Owl.prototype.suppress = function(events) {
        $.each(
            events,
            $.proxy(function(index, event) {
                this._supress[event] = true
            }, this)
        )
    }

    /**
     * Releases suppressed events.
     * @protected
     * @param {Array.<String>} events - The events to release.
     */
    Owl.prototype.release = function(events) {
        $.each(
            events,
            $.proxy(function(index, event) {
                delete this._supress[event]
            }, this)
        )
    }

    /**
     * Gets unified pointer coordinates from event.
     * @todo #261
     * @protected
     * @param {Event} - The `mousedown` or `touchstart` event.
     * @returns {Object} - Contains `x` and `y` coordinates of current pointer position.
     */
    Owl.prototype.pointer = function(event) {
        var result = { x: null, y: null }

        event = event.originalEvent || event || window.event

        event =
            event.touches && event.touches.length
                ? event.touches[0]
                : event.changedTouches && event.changedTouches.length
                ? event.changedTouches[0]
                : event

        if (event.pageX) {
            result.x = event.pageX
            result.y = event.pageY
        } else {
            result.x = event.clientX
            result.y = event.clientY
        }

        return result
    }

    /**
     * Determines if the input is a Number or something that can be coerced to a Number
     * @protected
     * @param {Number|String|Object|Array|Boolean|RegExp|Function|Symbol} - The input to be tested
     * @returns {Boolean} - An indication if the input is a Number or can be coerced to a Number
     */
    Owl.prototype.isNumeric = function(number) {
        return !isNaN(parseFloat(number))
    }

    /**
     * Gets the difference of two vectors.
     * @todo #261
     * @protected
     * @param {Object} - The first vector.
     * @param {Object} - The second vector.
     * @returns {Object} - The difference.
     */
    Owl.prototype.difference = function(first, second) {
        return {
            x: first.x - second.x,
            y: first.y - second.y,
        }
    }

    /**
     * The jQuery Plugin for the Owl Carousel
     * @todo Navigation plugin `next` and `prev`
     * @public
     */
    $.fn.owlCarousel = function(option) {
        var args = Array.prototype.slice.call(arguments, 1)

        return this.each(function() {
            var $this = $(this),
                data = $this.data('owl.carousel')

            if (!data) {
                data = new Owl(this, typeof option == 'object' && option)
                $this.data('owl.carousel', data)

                $.each(
                    [
                        'next',
                        'prev',
                        'to',
                        'destroy',
                        'refresh',
                        'replace',
                        'add',
                        'remove',
                    ],
                    function(i, event) {
                        data.register({ type: Owl.Type.Event, name: event })
                        data.$element.on(
                            event + '.owl.carousel.core',
                            $.proxy(function(e) {
                                if (e.namespace && e.relatedTarget !== this) {
                                    this.suppress([event])
                                    data[event].apply(
                                        this,
                                        [].slice.call(arguments, 1)
                                    )
                                    this.release([event])
                                }
                            }, data)
                        )
                    }
                )
            }

            if (typeof option == 'string' && option.charAt(0) !== '_') {
                data[option].apply(data, args)
            }
        })
    }

    /**
     * The constructor for the jQuery Plugin
     * @public
     */
    $.fn.owlCarousel.Constructor = Owl
})(window.Zepto || window.jQuery, window, document)

!(function(e, t) {
    'object' == typeof exports && 'object' == typeof module
        ? (module.exports = t())
        : 'function' == typeof define && define.amd
        ? define('Siema', [], t)
        : 'object' == typeof exports
        ? (exports.Siema = t())
        : (e.Siema = t())
})('undefined' != typeof self ? self : this, function() {
    return (function(e) {
        function t(r) {
            if (i[r]) return i[r].exports
            var n = (i[r] = { i: r, l: !1, exports: {} })
            return e[r].call(n.exports, n, n.exports, t), (n.l = !0), n.exports
        }
        var i = {}
        return (
            (t.m = e),
            (t.c = i),
            (t.d = function(e, i, r) {
                t.o(e, i) ||
                    Object.defineProperty(e, i, {
                        configurable: !1,
                        enumerable: !0,
                        get: r,
                    })
            }),
            (t.n = function(e) {
                var i =
                    e && e.__esModule
                        ? function() {
                              return e.default
                          }
                        : function() {
                              return e
                          }
                return t.d(i, 'a', i), i
            }),
            (t.o = function(e, t) {
                return Object.prototype.hasOwnProperty.call(e, t)
            }),
            (t.p = ''),
            t((t.s = 0))
        )
    })([
        function(e, t, i) {
            'use strict'
            function r(e, t) {
                if (!(e instanceof t))
                    throw new TypeError('Cannot call a class as a function')
            }
            Object.defineProperty(t, '__esModule', { value: !0 })
            var n =
                    'function' == typeof Symbol &&
                    'symbol' == typeof Symbol.iterator
                        ? function(e) {
                              return typeof e
                          }
                        : function(e) {
                              return e &&
                                  'function' == typeof Symbol &&
                                  e.constructor === Symbol &&
                                  e !== Symbol.prototype
                                  ? 'symbol'
                                  : typeof e
                          },
                s = (function() {
                    function e(e, t) {
                        for (var i = 0; i < t.length; i++) {
                            var r = t[i]
                            ;(r.enumerable = r.enumerable || !1),
                                (r.configurable = !0),
                                'value' in r && (r.writable = !0),
                                Object.defineProperty(e, r.key, r)
                        }
                    }
                    return function(t, i, r) {
                        return i && e(t.prototype, i), r && e(t, r), t
                    }
                })(),
                l = (function() {
                    function e(t) {
                        var i = this
                        if (
                            (r(this, e),
                            (this.config = e.mergeSettings(t)),
                            (this.selector =
                                'string' == typeof this.config.selector
                                    ? document.querySelector(
                                          this.config.selector
                                      )
                                    : this.config.selector),
                            null === this.selector)
                        )
                            throw new Error(
                                'Something wrong with your selector ðŸ˜­'
                            )
                        this.resolveSlidesNumber(),
                            (this.selectorWidth = this.selector.offsetWidth),
                            (this.innerElements = [].slice.call(
                                this.selector.children
                            )),
                            (this.currentSlide = this.config.loop
                                ? this.config.startIndex %
                                  this.innerElements.length
                                : Math.max(
                                      0,
                                      Math.min(
                                          this.config.startIndex,
                                          this.innerElements.length -
                                              this.perPage
                                      )
                                  )),
                            (this.transformProperty = e.webkitOrNot()),
                            [
                                'resizeHandler',
                                'touchstartHandler',
                                'touchendHandler',
                                'touchmoveHandler',
                                'mousedownHandler',
                                'mouseupHandler',
                                'mouseleaveHandler',
                                'mousemoveHandler',
                                'clickHandler',
                            ].forEach(function(e) {
                                i[e] = i[e].bind(i)
                            }),
                            this.init()
                    }
                    return (
                        s(
                            e,
                            [
                                {
                                    key: 'attachEvents',
                                    value: function() {
                                        window.addEventListener(
                                            'resize',
                                            this.resizeHandler
                                        ),
                                            this.config.draggable &&
                                                ((this.pointerDown = !1),
                                                (this.drag = {
                                                    startX: 0,
                                                    endX: 0,
                                                    startY: 0,
                                                    letItGo: null,
                                                    preventClick: !1,
                                                }),
                                                this.selector.addEventListener(
                                                    'touchstart',
                                                    this.touchstartHandler
                                                ),
                                                this.selector.addEventListener(
                                                    'touchend',
                                                    this.touchendHandler
                                                ),
                                                this.selector.addEventListener(
                                                    'touchmove',
                                                    this.touchmoveHandler
                                                ),
                                                this.selector.addEventListener(
                                                    'mousedown',
                                                    this.mousedownHandler
                                                ),
                                                this.selector.addEventListener(
                                                    'mouseup',
                                                    this.mouseupHandler
                                                ),
                                                this.selector.addEventListener(
                                                    'mouseleave',
                                                    this.mouseleaveHandler
                                                ),
                                                this.selector.addEventListener(
                                                    'mousemove',
                                                    this.mousemoveHandler
                                                ),
                                                this.selector.addEventListener(
                                                    'click',
                                                    this.clickHandler
                                                ))
                                    },
                                },
                                {
                                    key: 'detachEvents',
                                    value: function() {
                                        window.removeEventListener(
                                            'resize',
                                            this.resizeHandler
                                        ),
                                            this.selector.removeEventListener(
                                                'touchstart',
                                                this.touchstartHandler
                                            ),
                                            this.selector.removeEventListener(
                                                'touchend',
                                                this.touchendHandler
                                            ),
                                            this.selector.removeEventListener(
                                                'touchmove',
                                                this.touchmoveHandler
                                            ),
                                            this.selector.removeEventListener(
                                                'mousedown',
                                                this.mousedownHandler
                                            ),
                                            this.selector.removeEventListener(
                                                'mouseup',
                                                this.mouseupHandler
                                            ),
                                            this.selector.removeEventListener(
                                                'mouseleave',
                                                this.mouseleaveHandler
                                            ),
                                            this.selector.removeEventListener(
                                                'mousemove',
                                                this.mousemoveHandler
                                            ),
                                            this.selector.removeEventListener(
                                                'click',
                                                this.clickHandler
                                            )
                                    },
                                },
                                {
                                    key: 'init',
                                    value: function() {
                                        this.attachEvents(),
                                            (this.selector.style.overflow =
                                                'hidden'),
                                            (this.selector.style.direction = this
                                                .config.rtl
                                                ? 'rtl'
                                                : 'ltr'),
                                            this.buildSliderFrame(),
                                            this.config.onInit.call(this)
                                    },
                                },
                                {
                                    key: 'buildSliderFrame',
                                    value: function() {
                                        var e =
                                                this.selectorWidth /
                                                this.perPage,
                                            t = this.config.loop
                                                ? this.innerElements.length +
                                                  2 * this.perPage
                                                : this.innerElements.length
                                        ;(this.sliderFrame = document.createElement(
                                            'div'
                                        )),
                                            (this.sliderFrame.style.width =
                                                e * t + 'px'),
                                            this.enableTransition(),
                                            this.config.draggable &&
                                                (this.selector.style.cursor =
                                                    '-webkit-grab')
                                        var i = document.createDocumentFragment()
                                        if (this.config.loop)
                                            for (
                                                var r =
                                                    this.innerElements.length -
                                                    this.perPage;
                                                r < this.innerElements.length;
                                                r++
                                            ) {
                                                var n = this.buildSliderFrameItem(
                                                    this.innerElements[
                                                        r
                                                    ].cloneNode(!0)
                                                )
                                                i.appendChild(n)
                                            }
                                        for (
                                            var s = 0;
                                            s < this.innerElements.length;
                                            s++
                                        ) {
                                            var l = this.buildSliderFrameItem(
                                                this.innerElements[s]
                                            )
                                            i.appendChild(l)
                                        }
                                        if (this.config.loop)
                                            for (
                                                var o = 0;
                                                o < this.perPage;
                                                o++
                                            ) {
                                                var a = this.buildSliderFrameItem(
                                                    this.innerElements[
                                                        o
                                                    ].cloneNode(!0)
                                                )
                                                i.appendChild(a)
                                            }
                                        this.sliderFrame.appendChild(i),
                                            (this.selector.innerHTML = ''),
                                            this.selector.appendChild(
                                                this.sliderFrame
                                            ),
                                            this.slideToCurrent()
                                    },
                                },
                                {
                                    key: 'buildSliderFrameItem',
                                    value: function(e) {
                                        var t = document.createElement('div')
                                        return (
                                            (t.style.cssFloat = this.config.rtl
                                                ? 'right'
                                                : 'left'),
                                            (t.style.float = this.config.rtl
                                                ? 'right'
                                                : 'left'),
                                            (t.style.width =
                                                (this.config.loop
                                                    ? 100 /
                                                      (this.innerElements
                                                          .length +
                                                          2 * this.perPage)
                                                    : 100 /
                                                      this.innerElements
                                                          .length) + '%'),
                                            t.appendChild(e),
                                            t
                                        )
                                    },
                                },
                                {
                                    key: 'resolveSlidesNumber',
                                    value: function() {
                                        if (
                                            'number' ==
                                            typeof this.config.perPage
                                        )
                                            this.perPage = this.config.perPage
                                        else if (
                                            'object' === n(this.config.perPage)
                                        ) {
                                            this.perPage = 1
                                            for (var e in this.config.perPage)
                                                window.innerWidth >= e &&
                                                    (this.perPage = this.config.perPage[
                                                        e
                                                    ])
                                        }
                                    },
                                },
                                {
                                    key: 'prev',
                                    value: function() {
                                        var e =
                                                arguments.length > 0 &&
                                                void 0 !== arguments[0]
                                                    ? arguments[0]
                                                    : 1,
                                            t = arguments[1]
                                        if (
                                            !(
                                                this.innerElements.length <=
                                                this.perPage
                                            )
                                        ) {
                                            var i = this.currentSlide
                                            if (this.config.loop) {
                                                if (this.currentSlide - e < 0) {
                                                    this.disableTransition()
                                                    var r =
                                                            this.currentSlide +
                                                            this.innerElements
                                                                .length,
                                                        n = this.perPage,
                                                        s = r + n,
                                                        l =
                                                            (this.config.rtl
                                                                ? 1
                                                                : -1) *
                                                            s *
                                                            (this
                                                                .selectorWidth /
                                                                this.perPage),
                                                        o = this.config
                                                            .draggable
                                                            ? this.drag.endX -
                                                              this.drag.startX
                                                            : 0
                                                    ;(this.sliderFrame.style[
                                                        this.transformProperty
                                                    ] =
                                                        'translate3d(' +
                                                        (l + o) +
                                                        'px, 0, 0)'),
                                                        (this.currentSlide =
                                                            r - e)
                                                } else
                                                    this.currentSlide =
                                                        this.currentSlide - e
                                            } else
                                                this.currentSlide = Math.max(
                                                    this.currentSlide - e,
                                                    0
                                                )
                                            i !== this.currentSlide &&
                                                (this.slideToCurrent(
                                                    this.config.loop
                                                ),
                                                this.config.onChange.call(this),
                                                t && t.call(this))
                                        }
                                    },
                                },
                                {
                                    key: 'next',
                                    value: function() {
                                        var e =
                                                arguments.length > 0 &&
                                                void 0 !== arguments[0]
                                                    ? arguments[0]
                                                    : 1,
                                            t = arguments[1]
                                        if (
                                            !(
                                                this.innerElements.length <=
                                                this.perPage
                                            )
                                        ) {
                                            var i = this.currentSlide
                                            if (this.config.loop) {
                                                if (
                                                    this.currentSlide + e >
                                                    this.innerElements.length -
                                                        this.perPage
                                                ) {
                                                    this.disableTransition()
                                                    var r =
                                                            this.currentSlide -
                                                            this.innerElements
                                                                .length,
                                                        n = this.perPage,
                                                        s = r + n,
                                                        l =
                                                            (this.config.rtl
                                                                ? 1
                                                                : -1) *
                                                            s *
                                                            (this
                                                                .selectorWidth /
                                                                this.perPage),
                                                        o = this.config
                                                            .draggable
                                                            ? this.drag.endX -
                                                              this.drag.startX
                                                            : 0
                                                    ;(this.sliderFrame.style[
                                                        this.transformProperty
                                                    ] =
                                                        'translate3d(' +
                                                        (l + o) +
                                                        'px, 0, 0)'),
                                                        (this.currentSlide =
                                                            r + e)
                                                } else
                                                    this.currentSlide =
                                                        this.currentSlide + e
                                            } else
                                                this.currentSlide = Math.min(
                                                    this.currentSlide + e,
                                                    this.innerElements.length -
                                                        this.perPage
                                                )
                                            i !== this.currentSlide &&
                                                (this.slideToCurrent(
                                                    this.config.loop
                                                ),
                                                this.config.onChange.call(this),
                                                t && t.call(this))
                                        }
                                    },
                                },
                                {
                                    key: 'disableTransition',
                                    value: function() {
                                        ;(this.sliderFrame.style.webkitTransition =
                                            'all 0ms ' + this.config.easing),
                                            (this.sliderFrame.style.transition =
                                                'all 0ms ' + this.config.easing)
                                    },
                                },
                                {
                                    key: 'enableTransition',
                                    value: function() {
                                        ;(this.sliderFrame.style.webkitTransition =
                                            'all ' +
                                            this.config.duration +
                                            'ms ' +
                                            this.config.easing),
                                            (this.sliderFrame.style.transition =
                                                'all ' +
                                                this.config.duration +
                                                'ms ' +
                                                this.config.easing)
                                    },
                                },
                                {
                                    key: 'goTo',
                                    value: function(e, t) {
                                        if (
                                            !(
                                                this.innerElements.length <=
                                                this.perPage
                                            )
                                        ) {
                                            var i = this.currentSlide
                                            ;(this.currentSlide = this.config
                                                .loop
                                                ? e % this.innerElements.length
                                                : Math.min(
                                                      Math.max(e, 0),
                                                      this.innerElements
                                                          .length - this.perPage
                                                  )),
                                                i !== this.currentSlide &&
                                                    (this.slideToCurrent(),
                                                    this.config.onChange.call(
                                                        this
                                                    ),
                                                    t && t.call(this))
                                        }
                                    },
                                },
                                {
                                    key: 'slideToCurrent',
                                    value: function(e) {
                                        var t = this,
                                            i = this.config.loop
                                                ? this.currentSlide +
                                                  this.perPage
                                                : this.currentSlide,
                                            r =
                                                (this.config.rtl ? 1 : -1) *
                                                i *
                                                (this.selectorWidth /
                                                    this.perPage)
                                        e
                                            ? requestAnimationFrame(function() {
                                                  requestAnimationFrame(
                                                      function() {
                                                          t.enableTransition(),
                                                              (t.sliderFrame.style[
                                                                  t.transformProperty
                                                              ] =
                                                                  'translate3d(' +
                                                                  r +
                                                                  'px, 0, 0)')
                                                      }
                                                  )
                                              })
                                            : (this.sliderFrame.style[
                                                  this.transformProperty
                                              ] =
                                                  'translate3d(' +
                                                  r +
                                                  'px, 0, 0)')
                                    },
                                },
                                {
                                    key: 'updateAfterDrag',
                                    value: function() {
                                        var e =
                                                (this.config.rtl ? -1 : 1) *
                                                (this.drag.endX -
                                                    this.drag.startX),
                                            t = Math.abs(e),
                                            i = this.config.multipleDrag
                                                ? Math.ceil(
                                                      t /
                                                          (this.selectorWidth /
                                                              this.perPage)
                                                  )
                                                : 1,
                                            r =
                                                e > 0 &&
                                                this.currentSlide - i < 0,
                                            n =
                                                e < 0 &&
                                                this.currentSlide + i >
                                                    this.innerElements.length -
                                                        this.perPage
                                        e > 0 &&
                                        t > this.config.threshold &&
                                        this.innerElements.length > this.perPage
                                            ? this.prev(i)
                                            : e < 0 &&
                                              t > this.config.threshold &&
                                              this.innerElements.length >
                                                  this.perPage &&
                                              this.next(i),
                                            this.slideToCurrent(r || n)
                                    },
                                },
                                {
                                    key: 'resizeHandler',
                                    value: function() {
                                        this.resolveSlidesNumber(),
                                            this.currentSlide + this.perPage >
                                                this.innerElements.length &&
                                                (this.currentSlide =
                                                    this.innerElements.length <=
                                                    this.perPage
                                                        ? 0
                                                        : this.innerElements
                                                              .length -
                                                          this.perPage),
                                            (this.selectorWidth = this.selector.offsetWidth),
                                            this.buildSliderFrame()
                                    },
                                },
                                {
                                    key: 'clearDrag',
                                    value: function() {
                                        this.drag = {
                                            startX: 0,
                                            endX: 0,
                                            startY: 0,
                                            letItGo: null,
                                            preventClick: this.drag
                                                .preventClick,
                                        }
                                    },
                                },
                                {
                                    key: 'touchstartHandler',
                                    value: function(e) {
                                        ;-1 !==
                                            [
                                                'TEXTAREA',
                                                'OPTION',
                                                'INPUT',
                                                'SELECT',
                                            ].indexOf(e.target.nodeName) ||
                                            (e.stopPropagation(),
                                            (this.pointerDown = !0),
                                            (this.drag.startX =
                                                e.touches[0].pageX),
                                            (this.drag.startY =
                                                e.touches[0].pageY))
                                    },
                                },
                                {
                                    key: 'touchendHandler',
                                    value: function(e) {
                                        e.stopPropagation(),
                                            (this.pointerDown = !1),
                                            this.enableTransition(),
                                            this.drag.endX &&
                                                this.updateAfterDrag(),
                                            this.clearDrag()
                                    },
                                },
                                {
                                    key: 'touchmoveHandler',
                                    value: function(e) {
                                        if (
                                            (e.stopPropagation(),
                                            null === this.drag.letItGo &&
                                                (this.drag.letItGo =
                                                    Math.abs(
                                                        this.drag.startY -
                                                            e.touches[0].pageY
                                                    ) <
                                                    Math.abs(
                                                        this.drag.startX -
                                                            e.touches[0].pageX
                                                    )),
                                            this.pointerDown &&
                                                this.drag.letItGo)
                                        ) {
                                            e.preventDefault(),
                                                (this.drag.endX =
                                                    e.touches[0].pageX),
                                                (this.sliderFrame.style.webkitTransition =
                                                    'all 0ms ' +
                                                    this.config.easing),
                                                (this.sliderFrame.style.transition =
                                                    'all 0ms ' +
                                                    this.config.easing)
                                            var t = this.config.loop
                                                    ? this.currentSlide +
                                                      this.perPage
                                                    : this.currentSlide,
                                                i =
                                                    t *
                                                    (this.selectorWidth /
                                                        this.perPage),
                                                r =
                                                    this.drag.endX -
                                                    this.drag.startX,
                                                n = this.config.rtl
                                                    ? i + r
                                                    : i - r
                                            this.sliderFrame.style[
                                                this.transformProperty
                                            ] =
                                                'translate3d(' +
                                                (this.config.rtl ? 1 : -1) * n +
                                                'px, 0, 0)'
                                        }
                                    },
                                },
                                {
                                    key: 'mousedownHandler',
                                    value: function(e) {
                                        ;-1 !==
                                            [
                                                'TEXTAREA',
                                                'OPTION',
                                                'INPUT',
                                                'SELECT',
                                            ].indexOf(e.target.nodeName) ||
                                            (e.preventDefault(),
                                            e.stopPropagation(),
                                            (this.pointerDown = !0),
                                            (this.drag.startX = e.pageX))
                                    },
                                },
                                {
                                    key: 'mouseupHandler',
                                    value: function(e) {
                                        e.stopPropagation(),
                                            (this.pointerDown = !1),
                                            (this.selector.style.cursor =
                                                '-webkit-grab'),
                                            this.enableTransition(),
                                            this.drag.endX &&
                                                this.updateAfterDrag(),
                                            this.clearDrag()
                                    },
                                },
                                {
                                    key: 'mousemoveHandler',
                                    value: function(e) {
                                        if (
                                            (e.preventDefault(),
                                            this.pointerDown)
                                        ) {
                                            'A' === e.target.nodeName &&
                                                (this.drag.preventClick = !0),
                                                (this.drag.endX = e.pageX),
                                                (this.selector.style.cursor =
                                                    '-webkit-grabbing'),
                                                (this.sliderFrame.style.webkitTransition =
                                                    'all 0ms ' +
                                                    this.config.easing),
                                                (this.sliderFrame.style.transition =
                                                    'all 0ms ' +
                                                    this.config.easing)
                                            var t = this.config.loop
                                                    ? this.currentSlide +
                                                      this.perPage
                                                    : this.currentSlide,
                                                i =
                                                    t *
                                                    (this.selectorWidth /
                                                        this.perPage),
                                                r =
                                                    this.drag.endX -
                                                    this.drag.startX,
                                                n = this.config.rtl
                                                    ? i + r
                                                    : i - r
                                            this.sliderFrame.style[
                                                this.transformProperty
                                            ] =
                                                'translate3d(' +
                                                (this.config.rtl ? 1 : -1) * n +
                                                'px, 0, 0)'
                                        }
                                    },
                                },
                                {
                                    key: 'mouseleaveHandler',
                                    value: function(e) {
                                        this.pointerDown &&
                                            ((this.pointerDown = !1),
                                            (this.selector.style.cursor =
                                                '-webkit-grab'),
                                            (this.drag.endX = e.pageX),
                                            (this.drag.preventClick = !1),
                                            this.enableTransition(),
                                            this.updateAfterDrag(),
                                            this.clearDrag())
                                    },
                                },
                                {
                                    key: 'clickHandler',
                                    value: function(e) {
                                        this.drag.preventClick &&
                                            e.preventDefault(),
                                            (this.drag.preventClick = !1)
                                    },
                                },
                                {
                                    key: 'remove',
                                    value: function(e, t) {
                                        if (
                                            e < 0 ||
                                            e >= this.innerElements.length
                                        )
                                            throw new Error(
                                                "Item to remove doesn't exist ðŸ˜­"
                                            )
                                        var i = e < this.currentSlide,
                                            r =
                                                this.currentSlide +
                                                    this.perPage -
                                                    1 ===
                                                e
                                        ;(i || r) && this.currentSlide--,
                                            this.innerElements.splice(e, 1),
                                            this.buildSliderFrame(),
                                            t && t.call(this)
                                    },
                                },
                                {
                                    key: 'insert',
                                    value: function(e, t, i) {
                                        if (
                                            t < 0 ||
                                            t > this.innerElements.length + 1
                                        )
                                            throw new Error(
                                                'Unable to inset it at this index ðŸ˜­'
                                            )
                                        if (
                                            -1 !== this.innerElements.indexOf(e)
                                        )
                                            throw new Error(
                                                'The same item in a carousel? Really? Nope ðŸ˜­'
                                            )
                                        var r =
                                            t <= this.currentSlide > 0 &&
                                            this.innerElements.length
                                        ;(this.currentSlide = r
                                            ? this.currentSlide + 1
                                            : this.currentSlide),
                                            this.innerElements.splice(t, 0, e),
                                            this.buildSliderFrame(),
                                            i && i.call(this)
                                    },
                                },
                                {
                                    key: 'prepend',
                                    value: function(e, t) {
                                        this.insert(e, 0), t && t.call(this)
                                    },
                                },
                                {
                                    key: 'append',
                                    value: function(e, t) {
                                        this.insert(
                                            e,
                                            this.innerElements.length + 1
                                        ),
                                            t && t.call(this)
                                    },
                                },
                                {
                                    key: 'destroy',
                                    value: function() {
                                        var e =
                                                arguments.length > 0 &&
                                                void 0 !== arguments[0] &&
                                                arguments[0],
                                            t = arguments[1]
                                        if (
                                            (this.detachEvents(),
                                            (this.selector.style.cursor =
                                                'auto'),
                                            e)
                                        ) {
                                            for (
                                                var i = document.createDocumentFragment(),
                                                    r = 0;
                                                r < this.innerElements.length;
                                                r++
                                            )
                                                i.appendChild(
                                                    this.innerElements[r]
                                                )
                                            ;(this.selector.innerHTML = ''),
                                                this.selector.appendChild(i),
                                                this.selector.removeAttribute(
                                                    'style'
                                                )
                                        }
                                        t && t.call(this)
                                    },
                                },
                            ],
                            [
                                {
                                    key: 'mergeSettings',
                                    value: function(e) {
                                        var t = {
                                                selector: '.siema',
                                                duration: 200,
                                                easing: 'ease-out',
                                                perPage: 1,
                                                startIndex: 0,
                                                draggable: !0,
                                                multipleDrag: !0,
                                                threshold: 20,
                                                loop: !1,
                                                rtl: !1,
                                                onInit: function() {},
                                                onChange: function() {},
                                            },
                                            i = e
                                        for (var r in i) t[r] = i[r]
                                        return t
                                    },
                                },
                                {
                                    key: 'webkitOrNot',
                                    value: function() {
                                        return 'string' ==
                                            typeof document.documentElement
                                                .style.transform
                                            ? 'transform'
                                            : 'WebkitTransform'
                                    },
                                },
                            ]
                        ),
                        e
                    )
                })()
            ;(t.default = l), (e.exports = t.default)
        },
    ])
})

!(function(a, b) {
    var c = b(a, a.document)
    ;(a.lazySizes = c),
        'object' == typeof module && module.exports && (module.exports = c)
})(window, function(a, b) {
    'use strict'
    if (b.getElementsByClassName) {
        var c,
            d,
            e = b.documentElement,
            f = a.Date,
            g = a.HTMLPictureElement,
            h = 'addEventListener',
            i = 'getAttribute',
            j = a[h],
            k = a.setTimeout,
            l = a.requestAnimationFrame || k,
            m = a.requestIdleCallback,
            n = /^picture$/i,
            o = ['load', 'error', 'lazyincluded', '_lazyloaded'],
            p = {},
            q = Array.prototype.forEach,
            r = function(a, b) {
                return (
                    p[b] || (p[b] = new RegExp('(\\s|^)' + b + '(\\s|$)')),
                    p[b].test(a[i]('class') || '') && p[b]
                )
            },
            s = function(a, b) {
                r(a, b) ||
                    a.setAttribute(
                        'class',
                        (a[i]('class') || '').trim() + ' ' + b
                    )
            },
            t = function(a, b) {
                var c
                ;(c = r(a, b)) &&
                    a.setAttribute(
                        'class',
                        (a[i]('class') || '').replace(c, ' ')
                    )
            },
            u = function(a, b, c) {
                var d = c ? h : 'removeEventListener'
                c && u(a, b),
                    o.forEach(function(c) {
                        a[d](c, b)
                    })
            },
            v = function(a, d, e, f, g) {
                var h = b.createEvent('Event')
                return (
                    e || (e = {}),
                    (e.instance = c),
                    h.initEvent(d, !f, !g),
                    (h.detail = e),
                    a.dispatchEvent(h),
                    h
                )
            },
            w = function(b, c) {
                var e
                !g && (e = a.picturefill || d.pf)
                    ? (c &&
                          c.src &&
                          !b[i]('srcset') &&
                          b.setAttribute('srcset', c.src),
                      e({ reevaluate: !0, elements: [b] }))
                    : c && c.src && (b.src = c.src)
            },
            x = function(a, b) {
                return (getComputedStyle(a, null) || {})[b]
            },
            y = function(a, b, c) {
                for (
                    c = c || a.offsetWidth;
                    c < d.minSize && b && !a._lazysizesWidth;

                )
                    (c = b.offsetWidth), (b = b.parentNode)
                return c
            },
            z = (function() {
                var a,
                    c,
                    d = [],
                    e = [],
                    f = d,
                    g = function() {
                        var b = f
                        for (f = d.length ? e : d, a = !0, c = !1; b.length; )
                            b.shift()()
                        a = !1
                    },
                    h = function(d, e) {
                        a && !e
                            ? d.apply(this, arguments)
                            : (f.push(d),
                              c || ((c = !0), (b.hidden ? k : l)(g)))
                    }
                return (h._lsFlush = g), h
            })(),
            A = function(a, b) {
                return b
                    ? function() {
                          z(a)
                      }
                    : function() {
                          var b = this,
                              c = arguments
                          z(function() {
                              a.apply(b, c)
                          })
                      }
            },
            B = function(a) {
                var b,
                    c = 0,
                    e = d.throttleDelay,
                    g = d.ricTimeout,
                    h = function() {
                        ;(b = !1), (c = f.now()), a()
                    },
                    i =
                        m && g > 49
                            ? function() {
                                  m(h, { timeout: g }),
                                      g !== d.ricTimeout && (g = d.ricTimeout)
                              }
                            : A(function() {
                                  k(h)
                              }, !0)
                return function(a) {
                    var d
                    ;(a = !0 === a) && (g = 33),
                        b ||
                            ((b = !0),
                            (d = e - (f.now() - c)),
                            d < 0 && (d = 0),
                            a || d < 9 ? i() : k(i, d))
                }
            },
            C = function(a) {
                var b,
                    c,
                    d = 99,
                    e = function() {
                        ;(b = null), a()
                    },
                    g = function() {
                        var a = f.now() - c
                        a < d ? k(g, d - a) : (m || e)(e)
                    }
                return function() {
                    ;(c = f.now()), b || (b = k(g, d))
                }
            }
        !(function() {
            var b,
                c = {
                    lazyClass: 'lazyload',
                    loadedClass: 'lazyloaded',
                    loadingClass: 'lazyloading',
                    preloadClass: 'lazypreload',
                    errorClass: 'lazyerror',
                    autosizesClass: 'lazyautosizes',
                    srcAttr: 'data-src',
                    srcsetAttr: 'data-srcset',
                    sizesAttr: 'data-sizes',
                    minSize: 40,
                    customMedia: {},
                    init: !0,
                    expFactor: 1.5,
                    hFac: 0.8,
                    loadMode: 2,
                    loadHidden: !0,
                    ricTimeout: 0,
                    throttleDelay: 125,
                }
            d = a.lazySizesConfig || a.lazysizesConfig || {}
            for (b in c) b in d || (d[b] = c[b])
            ;(a.lazySizesConfig = d),
                k(function() {
                    d.init && F()
                })
        })()
        var D = (function() {
                var g,
                    l,
                    m,
                    o,
                    p,
                    y,
                    D,
                    F,
                    G,
                    H,
                    I,
                    J,
                    K = /^img$/i,
                    L = /^iframe$/i,
                    M =
                        'onscroll' in a &&
                        !/(gle|ing)bot/.test(navigator.userAgent),
                    N = 0,
                    O = 0,
                    P = 0,
                    Q = -1,
                    R = function(a) {
                        P--,
                            a && a.target && u(a.target, R),
                            (!a || P < 0 || !a.target) && (P = 0)
                    },
                    S = function(a) {
                        return (
                            null == J &&
                                (J = 'hidden' == x(b.body, 'visibility')),
                            J ||
                                ('hidden' != x(a.parentNode, 'visibility') &&
                                    'hidden' != x(a, 'visibility'))
                        )
                    },
                    T = function(a, c) {
                        var d,
                            f = a,
                            g = S(a)
                        for (
                            F -= c, I += c, G -= c, H += c;
                            g && (f = f.offsetParent) && f != b.body && f != e;

                        )
                            (g = (x(f, 'opacity') || 1) > 0) &&
                                'visible' != x(f, 'overflow') &&
                                ((d = f.getBoundingClientRect()),
                                (g =
                                    H > d.left &&
                                    G < d.right &&
                                    I > d.top - 1 &&
                                    F < d.bottom + 1))
                        return g
                    },
                    U = function() {
                        var a,
                            f,
                            h,
                            j,
                            k,
                            m,
                            n,
                            p,
                            q,
                            r,
                            s,
                            t,
                            u = c.elements
                        if ((o = d.loadMode) && P < 8 && (a = u.length)) {
                            for (
                                f = 0,
                                    Q++,
                                    r =
                                        !d.expand || d.expand < 1
                                            ? e.clientHeight > 500 &&
                                              e.clientWidth > 500
                                                ? 500
                                                : 370
                                            : d.expand,
                                    s = r * d.expFactor,
                                    t = d.hFac,
                                    J = null,
                                    O < s &&
                                    P < 1 &&
                                    Q > 2 &&
                                    o > 2 &&
                                    !b.hidden
                                        ? ((O = s), (Q = 0))
                                        : (O = o > 1 && Q > 1 && P < 6 ? r : N);
                                f < a;
                                f++
                            )
                                if (u[f] && !u[f]._lazyRace)
                                    if (M)
                                        if (
                                            (((p = u[f][i]('data-expand')) &&
                                                (m = 1 * p)) ||
                                                (m = O),
                                            q !== m &&
                                                ((y = innerWidth + m * t),
                                                (D = innerHeight + m),
                                                (n = -1 * m),
                                                (q = m)),
                                            (h = u[f].getBoundingClientRect()),
                                            (I = h.bottom) >= n &&
                                                (F = h.top) <= D &&
                                                (H = h.right) >= n * t &&
                                                (G = h.left) <= y &&
                                                (I || H || G || F) &&
                                                (d.loadHidden || S(u[f])) &&
                                                ((l &&
                                                    P < 3 &&
                                                    !p &&
                                                    (o < 3 || Q < 4)) ||
                                                    T(u[f], m)))
                                        ) {
                                            if ((aa(u[f]), (k = !0), P > 9))
                                                break
                                        } else
                                            !k &&
                                                l &&
                                                !j &&
                                                P < 4 &&
                                                Q < 4 &&
                                                o > 2 &&
                                                (g[0] || d.preloadAfterLoad) &&
                                                (g[0] ||
                                                    (!p &&
                                                        (I ||
                                                            H ||
                                                            G ||
                                                            F ||
                                                            'auto' !=
                                                                u[f][i](
                                                                    d.sizesAttr
                                                                )))) &&
                                                (j = g[0] || u[f])
                                    else aa(u[f])
                            j && !k && aa(j)
                        }
                    },
                    V = B(U),
                    W = function(a) {
                        s(a.target, d.loadedClass),
                            t(a.target, d.loadingClass),
                            u(a.target, Y),
                            v(a.target, 'lazyloaded')
                    },
                    X = A(W),
                    Y = function(a) {
                        X({ target: a.target })
                    },
                    Z = function(a, b) {
                        try {
                            a.contentWindow.location.replace(b)
                        } catch (c) {
                            a.src = b
                        }
                    },
                    $ = function(a) {
                        var b,
                            c = a[i](d.srcsetAttr)
                        ;(b =
                            d.customMedia[
                                a[i]('data-media') || a[i]('media')
                            ]) && a.setAttribute('media', b),
                            c && a.setAttribute('srcset', c)
                    },
                    _ = A(function(a, b, c, e, f) {
                        var g, h, j, l, o, p
                        ;(o = v(a, 'lazybeforeunveil', b)).defaultPrevented ||
                            (e &&
                                (c
                                    ? s(a, d.autosizesClass)
                                    : a.setAttribute('sizes', e)),
                            (h = a[i](d.srcsetAttr)),
                            (g = a[i](d.srcAttr)),
                            f &&
                                ((j = a.parentNode),
                                (l = j && n.test(j.nodeName || ''))),
                            (p = b.firesLoad || ('src' in a && (h || g || l))),
                            (o = { target: a }),
                            p &&
                                (u(a, R, !0),
                                clearTimeout(m),
                                (m = k(R, 2500)),
                                s(a, d.loadingClass),
                                u(a, Y, !0)),
                            l && q.call(j.getElementsByTagName('source'), $),
                            h
                                ? a.setAttribute('srcset', h)
                                : g &&
                                  !l &&
                                  (L.test(a.nodeName) ? Z(a, g) : (a.src = g)),
                            f && (h || l) && w(a, { src: g })),
                            a._lazyRace && delete a._lazyRace,
                            t(a, d.lazyClass),
                            z(function() {
                                ;(!p || (a.complete && a.naturalWidth > 1)) &&
                                    (p ? R(o) : P--, W(o))
                            }, !0)
                    }),
                    aa = function(a) {
                        var b,
                            c = K.test(a.nodeName),
                            e = c && (a[i](d.sizesAttr) || a[i]('sizes')),
                            f = 'auto' == e
                        ;((!f && l) ||
                            !c ||
                            (!a[i]('src') && !a.srcset) ||
                            a.complete ||
                            r(a, d.errorClass) ||
                            !r(a, d.lazyClass)) &&
                            ((b = v(a, 'lazyunveilread').detail),
                            f && E.updateElem(a, !0, a.offsetWidth),
                            (a._lazyRace = !0),
                            P++,
                            _(a, b, f, e, c))
                    },
                    ba = function() {
                        if (!l) {
                            if (f.now() - p < 999) return void k(ba, 999)
                            var a = C(function() {
                                ;(d.loadMode = 3), V()
                            })
                            ;(l = !0),
                                (d.loadMode = 3),
                                V(),
                                j(
                                    'scroll',
                                    function() {
                                        3 == d.loadMode && (d.loadMode = 2), a()
                                    },
                                    !0
                                )
                        }
                    }
                return {
                    _: function() {
                        ;(p = f.now()),
                            (c.elements = b.getElementsByClassName(
                                d.lazyClass
                            )),
                            (g = b.getElementsByClassName(
                                d.lazyClass + ' ' + d.preloadClass
                            )),
                            j('scroll', V, !0),
                            j('resize', V, !0),
                            a.MutationObserver
                                ? new MutationObserver(V).observe(e, {
                                      childList: !0,
                                      subtree: !0,
                                      attributes: !0,
                                  })
                                : (e[h]('DOMNodeInserted', V, !0),
                                  e[h]('DOMAttrModified', V, !0),
                                  setInterval(V, 999)),
                            j('hashchange', V, !0),
                            [
                                'focus',
                                'mouseover',
                                'click',
                                'load',
                                'transitionend',
                                'animationend',
                                'webkitAnimationEnd',
                            ].forEach(function(a) {
                                b[h](a, V, !0)
                            }),
                            /d$|^c/.test(b.readyState)
                                ? ba()
                                : (j('load', ba),
                                  b[h]('DOMContentLoaded', V),
                                  k(ba, 2e4)),
                            c.elements.length ? (U(), z._lsFlush()) : V()
                    },
                    checkElems: V,
                    unveil: aa,
                }
            })(),
            E = (function() {
                var a,
                    c = A(function(a, b, c, d) {
                        var e, f, g
                        if (
                            ((a._lazysizesWidth = d),
                            (d += 'px'),
                            a.setAttribute('sizes', d),
                            n.test(b.nodeName || ''))
                        )
                            for (
                                e = b.getElementsByTagName('source'),
                                    f = 0,
                                    g = e.length;
                                f < g;
                                f++
                            )
                                e[f].setAttribute('sizes', d)
                        c.detail.dataAttr || w(a, c.detail)
                    }),
                    e = function(a, b, d) {
                        var e,
                            f = a.parentNode
                        f &&
                            ((d = y(a, f, d)),
                            (e = v(a, 'lazybeforesizes', {
                                width: d,
                                dataAttr: !!b,
                            })),
                            e.defaultPrevented ||
                                ((d = e.detail.width) &&
                                    d !== a._lazysizesWidth &&
                                    c(a, f, e, d)))
                    },
                    f = function() {
                        var b,
                            c = a.length
                        if (c) for (b = 0; b < c; b++) e(a[b])
                    },
                    g = C(f)
                return {
                    _: function() {
                        ;(a = b.getElementsByClassName(d.autosizesClass)),
                            j('resize', g)
                    },
                    checkElems: g,
                    updateElem: e,
                }
            })(),
            F = function() {
                F.i || ((F.i = !0), E._(), D._())
            }
        return (c = {
            cfg: d,
            autoSizer: E,
            loader: D,
            init: F,
            uP: w,
            aC: s,
            rC: t,
            hC: r,
            fire: v,
            gW: y,
            rAF: z,
        })
    }
})
