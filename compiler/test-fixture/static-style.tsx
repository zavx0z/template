import {createRoot, type StyleValue} from "@zavx0z/react"

const regular = Object.freeze({inner: "rgb(84 84 84)", outline: "rgb(42 42 42)"})
const selected = Object.freeze({inner: "rgb(71 114 179)", text: "rgb(255 255 255)"})

function color(value: string): string {
  return value
}

export function StyledButton(props: Readonly<{
  label: string
  opacity: number
  selected: boolean
  style?: StyleValue
}>) {
  const showLabel = props.label.length > 0
  return <button style={[
    {
      boxSizing: "border-box",
      display: "flex",
      width: 92,
      border: `1px solid ${color(regular.outline)}`,
      background: color(regular.inner),
      ":hover": {background: "rgb(101 101 101)"},
      ":active": {
        background: color(selected.inner),
        color: color(selected.text),
      },
      ":focus": {borderColor: "rgb(113 168 255)"},
      ":disabled": {opacity: 0.5},
    },
    props.selected && {background: color(selected.inner), color: color(selected.text)},
    {opacity: props.opacity},
    props.style,
  ]}>
    <img alt="" style={[
      {width: 14, height: 14},
      !props.selected && {display: "none"},
    ]} />
    <span style={[
      {display: "inline"},
      !showLabel && {display: "none"},
    ]}>{props.label}</span>
    <img alt="" style={[
      {width: 14, height: 14},
      !props.selected && {display: "none"},
    ]} />
  </button>
}

declare const container: Parameters<typeof createRoot>[0]
createRoot(container).render(<StyledButton label="Output" opacity={1} selected={false} />)
