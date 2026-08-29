import {createRoot, type StyleValue} from "@zavx0z/react"

export function Label(props: Readonly<{
  hidden: boolean
  style?: StyleValue
}>) {
  return <span style={[
    {display: "inline", color: "rgb(230 230 230)"},
    props.hidden && {display: "none"},
    props.style,
  ]}>Label</span>
}

declare const container: Parameters<typeof createRoot>[0]
createRoot(container).render(<Label hidden={false} />)
