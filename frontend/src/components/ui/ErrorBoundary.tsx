import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Coś poszło nie tak
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Spróbuj odświeżyć stronę
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Odśwież
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
