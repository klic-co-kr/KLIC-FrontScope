(function () {
  var EVENT_TYPE = 'KLIC_CONSOLE_LOG';
  var INSTALLED_ATTR = 'data-klic-console-spy-installed';
  var ENABLED_ATTR = 'data-klic-console-spy-enabled';
  var COMMAND_EVENT = 'klic-console-spy-command';

  if (window.__KLIC_CONSOLE_SPY_INSTALLED__) {
    document.documentElement.setAttribute(INSTALLED_ATTR, '1');
    document.documentElement.setAttribute(ENABLED_ATTR, window.__KLIC_CONSOLE_SPY_ENABLED__ ? '1' : '0');
    return;
  }

  window.__KLIC_CONSOLE_SPY_INSTALLED__ = true;
  window.__KLIC_CONSOLE_SPY_ENABLED__ = false;
  window.__KLIC_CONSOLE_SPY_ORIGINALS__ = {};

  document.documentElement.setAttribute(INSTALLED_ATTR, '1');
  document.documentElement.setAttribute(ENABLED_ATTR, '0');

  var METHODS = ['log', 'warn', 'error', 'info', 'debug'];

  function formatArgument(arg) {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    if (arg instanceof Error) return arg.name + ': ' + arg.message;
    if (arg instanceof HTMLElement) {
      var id = arg.id ? '#' + arg.id : '';
      var cls = typeof arg.className === 'string' && arg.className.trim().length > 0
        ? '.' + arg.className.trim().split(/\s+/).join('.')
        : '';
      return '<' + arg.tagName.toLowerCase() + id + cls + '>';
    }

    try {
      return JSON.stringify(arg);
    } catch (_error) {
      return Object.prototype.toString.call(arg);
    }
  }

  function serializeArgument(arg) {
    if (arg === undefined) return { __klicType: 'undefined' };
    if (arg === null) return null;
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') return arg;
    if (arg instanceof Error) {
      return {
        __klicType: 'error',
        name: arg.name,
        message: arg.message,
        stack: arg.stack,
      };
    }
    if (arg instanceof HTMLElement) {
      return {
        __klicType: 'element',
        tag: arg.tagName.toLowerCase(),
        id: arg.id || undefined,
        className: typeof arg.className === 'string' ? arg.className : '',
      };
    }

    try {
      return JSON.parse(JSON.stringify(arg));
    } catch (_error) {
      return {
        __klicType: 'non-serializable',
        value: Object.prototype.toString.call(arg),
      };
    }
  }

  function postLog(level, args) {
    var content = args.map(formatArgument).join(' ');
    var serializedArgs = args.map(serializeArgument);

    window.postMessage({
      type: EVENT_TYPE,
      level: level,
      content: content,
      args: serializedArgs,
      timestamp: Date.now(),
    }, window.location.origin);
  }

  window.__KLIC_CONSOLE_SPY_ENABLE__ = function () {
    if (window.__KLIC_CONSOLE_SPY_ENABLED__) return;

    METHODS.forEach(function (method) {
      if (!window.__KLIC_CONSOLE_SPY_ORIGINALS__[method]) {
        window.__KLIC_CONSOLE_SPY_ORIGINALS__[method] = console[method].bind(console);
      }

      console[method] = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__KLIC_CONSOLE_SPY_ORIGINALS__[method].apply(console, args);
        postLog(method, args);
      };
    });

    window.__KLIC_CONSOLE_SPY_ENABLED__ = true;
    document.documentElement.setAttribute(ENABLED_ATTR, '1');
  };

  window.__KLIC_CONSOLE_SPY_DISABLE__ = function () {
    if (!window.__KLIC_CONSOLE_SPY_ENABLED__) return;

    METHODS.forEach(function (method) {
      var original = window.__KLIC_CONSOLE_SPY_ORIGINALS__[method];
      if (original) {
        console[method] = original;
      }
    });

    window.__KLIC_CONSOLE_SPY_ENABLED__ = false;
    document.documentElement.setAttribute(ENABLED_ATTR, '0');
  };

  if (!window.__KLIC_CONSOLE_SPY_COMMAND_BOUND__) {
    document.addEventListener(COMMAND_EVENT, function (event) {
      var command = event && event.detail ? event.detail.command : undefined;
      if (command === 'enable') {
        window.__KLIC_CONSOLE_SPY_ENABLE__();
      } else if (command === 'disable') {
        window.__KLIC_CONSOLE_SPY_DISABLE__();
      }
    });

    window.__KLIC_CONSOLE_SPY_COMMAND_BOUND__ = true;
  }
})();
