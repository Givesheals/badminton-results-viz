import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class ShowcaseErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Premium showcase failed to render', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-ink-100 bg-ink-50 px-4 text-center">
          <p className="text-sm text-ink-600">
            Preview unavailable right now. You can still continue with signup.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
