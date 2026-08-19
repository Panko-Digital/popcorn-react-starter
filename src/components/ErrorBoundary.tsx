import React from 'react';

interface Props {
    children: React.ReactNode;
    /** Rendered instead of the children when an error is caught. */
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
}

/**
 * Keeps a rendering failure in one section from blanking the whole page.
 *
 * Published sites render arbitrary operator content, so a single malformed
 * element must not take down the document. Wrap sections individually and the
 * rest of the page survives.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error): void {
        // Surfaced in the browser console for operators debugging their site.
        console.error('[popcorn] section failed to render:', error);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}
