const _ = require('underscore');
const events = require('backbone-events-standalone');
const fs = require('fs');
const yaml = require('yaml');

function die (message) {
  console.error('Error:', message);

  process.exit(1);
}

module.exports = class app {

  // Program entry-point. It expects a YAML configuration file as the first
  // command-line argument
  static main () {
    var filename = process.argv
      .splice(2, 1)
      .pop();

    if (!filename || !filename.endsWith('.yml')) {
      return die('expected a YAML configuration file as first argument');
    }

    fs.readFile(filename, function (err, data) {
      if (err) {
        return die('could not read configuration file');
      }

      var config;

      try {
        config = yaml.eval(
          data.toString()
        );
      } catch (e) {
        return die('invalid configuration (YAML)');
      }

      // Bootstrap an appliation.
      new app(config, process.argv)
        .bootstrap();
    });
  }

  // Application constructor. It expects a configuration object and any
  // arguments that may be needed for proper execution.
  constructor (config, args) {
    // Mix in an event handling facility. This will register methods such as
    // `trigger()` and `on()` on the application instance.
    // See http://npmjs.org/backbone-events-standalone.
    events.mixin(this);

    this.config = config;
    this.args = args;

    this.required = [];
  }

  // Bootstrap the application by calling `app.require()` on all packages found
  // in configuration. Setting a package's configuration to `true` will
  // force-load it but any *falsy* value will prevent it from being
  // bootstrapped.
  bootstrap () {
    var self = this;

    _.each(this.config.modules, function (config, pkg) {
      if (!config) {
        return;
      }

      self.require(pkg);
    });

    // Trigger `app:bootstrapped` once done.
    this.trigger('app:bootstrapped', this);

    return this;
  }

  // Require a package (containing a module) and its dependencies. Dependencies
  // are guaranteed to have loaded by the time the module is instantiated.
  // All modules are available on the application instance which is passed
  // at instantiation time.
  require (pkg) {
    var self = this;

    if (_.contains(this.required, pkg)) {
      return this;
    }

    var module = require.main.require(pkg);
    var name = module.name;

    _.each(module.requires, function (requiree) {
      self.require(requiree);
    });

    this.required.push(pkg);

    // Trigger `module:initialize` before instantiation.
    this.trigger('module:initialize', module, pkg);

    module = new module(this);
    module.pkg = pkg;
    module.name = name;

    this[name] = module;

    // Trigger `module:initialized` after instantiation.
    this.trigger('module:initialized', module, pkg);

    return this;
  }

};
