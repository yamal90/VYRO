import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#06080f] flex items-center justify-center p-6">
        <div className="glass-dark rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Qualcosa è andato storto
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.
          </p>
          {this.state.error && (
            <pre className="text-xs text-red-300/70 bg-red-950/30 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={16} />
            Ricarica pagina
          </button>
        </div>
      </div>
    );
  }
}
