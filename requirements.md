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

## Shared compiled-template ABI

- `TEMPLATE-COMPILED-001` — Template owns both tagged HTML and JSX lowering.
  JSX lowers into the target-neutral `CompiledTemplate` ABI: static mount code,
  a fixed numeric binding count and a render function that writes addressed
  values. Tagged `html` currently retains its `TemplateProgram`/dynamic-part
  runtime. Both mutate the same exact DOM and obey the same identity and
  transaction laws; they do not yet claim one internal program representation.
- `TEMPLATE-COMPILED-002` — text, property, style, event, ref and bounded
  child-region bindings target exact `@zavx0z/dom` objects. Binding helpers
  validate names, ranges and slot addresses before a consumer mutates a mounted
  document.
- `TEMPLATE-COMPILED-002A` — compiled-template and binding brands use the
  process-global symbol registry, but brands are not part of public TypeScript
  interfaces. Equivalent package-resolution paths are structurally assignable
  and recognize the same immutable branded runtime values; this does not merge
  or replace the exact `@zavx0z/dom` class realm used by their Node targets.
- `TEMPLATE-COMPILED-003` — the ABI contains no scheduler, hooks, component
  state, renderer, Engine or compiler service. Component runtimes consume it;
  build-time JSX lowering produces it.
- `TEMPLATE-COMPILED-004` — build-time compiler entrypoints are separate from
  the default browser runtime entrypoint. TypeScript/Bun compiler code must not
  enter an application bundle merely because it uses `html`, `compile` or a
  previously compiled template.
- `TEMPLATE-COMPILED-005` — `jsx-runtime` exists for TypeScript JSX namespace
  resolution and as a fail-closed misconfiguration boundary. Production JSX is
  eliminated by the compiler; calling `jsx`, `jsxs` or `jsxDEV` at runtime
  throws instead of creating descriptor objects, a virtual DOM or a hidden
  fallback renderer.
- `TEMPLATE-COMPILED-006` — Template owns JSX source analysis and lowering;
  `@zavx0z/react` owns component scheduling, hooks and root lifecycle. Compiler
  output may reference the latter runtime but Template has no React, Fiber or
  virtual-DOM dependency.
- `TEMPLATE-COMPILED-007` — runtime, hook, root and component identities are
  resolved through TypeScript symbols. Same-spelling shadows are not rewritten,
  type-only/namespace runtime imports fail closed and mutable compiled component
  bindings are rejected.
- `TEMPLATE-COMPILED-008` — a compiler session fingerprints every governed
  component/custom-hook dependency used to classify an importer. A changed
  dependency invalidates both the transformed-source cache and TypeScript
  snapshot before the importer can be reused.
- `TEMPLATE-COMPILED-009` — every authored source and relative component or
  custom-hook declaration must remain within an explicitly governed canonical
  source root. Exact file roots and multiple roots are valid; an escaping
  declaration is not loaded as uncompiled JSX.
- `TEMPLATE-COMPILED-010` — the Bun adapter intercepts only JSX-bearing source
  extensions. Build registration owns start/end lifecycle; direct
  `Bun.plugin(...)` registration requires `persistent: true`. Caller source-map
  output is allowed, but the compiler explicitly reports `sourceMaps: false`
  until edits carry exact original-source mappings.
- `TEMPLATE-COMPILED-011` — authored component children are lowered directly
  into existing `@zavx0z/react` composition values. A single governed component
  uses one `ComponentValue`/`bindChild` range; component-or-null uses
  `bindConditional`; primitive text uses `bindText`; compiler-owned keyed
  components use `keyedComponents`/`bindKeyed`. No JSX descriptor, VDOM, Fiber,
  generic child walker or new compiled-template ABI field is introduced.
- `TEMPLATE-COMPILED-012` — a receiving function component renders typed exact
  `props.children`. The compiler recognizes the structural
  `JsxSourceElement` marker across physical package copies and fails closed for
  ambiguous/any/unknown mixtures. Nullable values normalize to `null` before
  the retained conditional range reaches the runtime.
- `TEMPLATE-COMPILED-013` — keyed component children are emitted only from a
  syntactically verified JSX `.map()` whose component has a non-null key, or
  from multiple explicit governed component children where every key is
  non-null. Fragments, intrinsic subtrees crossing the component boundary,
  explicit `children=` props, destructured receivers, raw/arbitrary arrays and
  unkeyed multiple children fail during compilation with a bounded diagnostic.
- `TEMPLATE-COMPILED-014` — updates reuse the fixed receiving range and nested
  component instances. Repeated child updates may change addressed props and
  Text but must not grow mounts, binding slots or a parallel runtime graph.
