(() => {
  "use strict";
  const CMS = window.CMS;
  const h = window.h;
  const createClass = window.createClass;

  if (!CMS || typeof CMS.registerWidget !== "function" || typeof h !== "function" || typeof createClass !== "function") {
    console.error("[KNOT] Gutenberg widget could not initialize. Decap CMS globals are unavailable.");
    return;
  }

  const Control = createClass({
    displayName: "KnotGutenbergControl",
    componentDidMount() {
      this.mountEditor();
    },
    componentDidUpdate() {
      this.updateEditor();
    },
    componentWillUnmount() {
      if (this.node && window.KnotGutenberg) window.KnotGutenberg.unmount(this.node);
    },
    mountEditor() {
      if (!this.node || !window.KnotGutenberg || this.mounted) return;
      window.KnotGutenberg.mount(this.node, this.props.value, this.props.onChange);
      this.mounted = true;
    },
    updateEditor() {
      if (!this.node || !window.KnotGutenberg) return;
      if (!this.mounted) return this.mountEditor();
      window.KnotGutenberg.update(this.node, this.props.value, this.props.onChange);
    },
    render() {
      return h("div", {
        className: "knot-gutenberg-widget",
        ref: node => { this.node = node; }
      });
    }
  });

  CMS.registerWidget("knot-block-editor", Control);
  console.info("[KNOT] Standalone Gutenberg block editor registered.");
})();
