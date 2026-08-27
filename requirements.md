# Template requirements

## Direct DOM compiler

- `TEMPLATE-DOM-001` — `html` records an HTML template and live JavaScript
  values without converting the template into a renderer-specific tree.
- `TEMPLATE-DOM-002` — `compile` creates real `@zavx0z/dom` elements and text
  nodes through `Document.createElement`, `Document.createTextNode`,
  `Node.insertBefore`, `Node.removeChild` and attribute methods.
- `TEMPLATE-DOM-003` — `TemplateInstance.update` mutates only addressed parts.
  Unchanged elements, text nodes, attributes and event listeners keep identity;
  a whole mounted tree is never rebuilt or passed through `replaceChildren`.
- `TEMPLATE-DOM-004` — `on*` bindings use `addEventListener` and
  `removeEventListener`. Updating a handler detaches the previous listener.
- `TEMPLATE-DOM-005` — nested templates and arrays own bounded child regions.
  Equal nested template shapes update in place; a changed branch replaces only
  its region. Arrays reconcile by position until a keyed public contract is
  introduced.
- `TEMPLATE-DOM-006` — one public update is one synchronous DOM transaction.
  `dispose` removes the mounted region and every listener owned by it.
- `TEMPLATE-DOM-007` — the compiler is target-neutral. Engine, layout, paint,
  WebGPU and UI component policy are outside this package.
- `TEMPLATE-DOM-008` — dynamic values are never concatenated back into HTML
  source. Child strings become `Text` and attribute strings go through
  `setAttribute`, so data cannot introduce new markup or attributes.
- `TEMPLATE-DOM-009` — public `rootNodes` exposes authored static and dynamic
  roots only. Private `Comment` boundaries remain in the DOM for addressing but
  are not part of the public result.
- `TEMPLATE-DOM-010` — `@zavx0z/dom` is an external peer. Template never
  bundles a second DOM implementation, so producer, consumer and compiler share
  one class realm and `instanceof Node` remains exact.

## Deliberate first-slice limits

- Element and attribute names must be static.
- HTML comments, doctypes, raw-text elements and declarative shadow DOM are not
  compiled yet.
- Attribute interpolation accepts primitive values. `false`, `null` and
  `undefined` remove a wholly dynamic attribute; `true` creates an empty
  attribute.
- Child interpolation accepts primitives, DOM nodes, nested templates and
  arrays of those values. Functions are valid only as whole `on*` bindings.
- Array reconciliation is positional and does not claim keyed move semantics.
- Bounded template regions use standard `Comment` nodes. Comments preserve
  region identity in the DOM tree and never become text or paint content.

The older source parser is a separate syntax-analysis API. It does not
participate in the direct DOM update path.
