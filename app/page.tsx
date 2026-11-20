'use client';

import { useState, useRef } from 'react';
import { Terminal, Copy, Check, AlertTriangle, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

type Environment = 'linux' | 'macos' | 'windows';
type RiskLevel = 'low' | 'medium' | 'high';

interface ApiResponse {
  command: string;
  risk: RiskLevel;
  explanation: string;
  warning?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [env, setEnv] = useState<Environment>('linux');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      // Simulation d'un appel API (remplacez par votre endpoint réel, ex: /api/generate)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, env }),
      });

      if (!res.ok) throw new Error('Erreur lors de la génération');

      const data: ApiResponse = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      // Exemple de données simulées pour le test si l'API n'est pas encore branchée
      setResult({
        command: 'find . -name "*.log" -type f -delete',
        risk: 'medium',
        explanation: 'Recherche et supprime tous les fichiers portant l\'extension .log dans le répertoire courant et ses sous-dossiers.',
        warning: 'Attention : Cette action est irréversible. Vérifiez bien le répertoire courant avant exécution.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Risque Faible (Low)
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Risque Moyen (Medium)
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" /> Risque Élevé (High)
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-2">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Assistant Terminal IA</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Transformez vos descriptions en commandes de terminal fiables et sécurisées.
          </p>
        </div>

        {/* Formulaire principal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Sélecteur d'environnement */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Environnement cible :
              </label>
              <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(['linux', 'macos', 'windows'] as Environment[]).map((envOption) => (
                  <button
                    key={envOption}
                    type="button"
                    onClick={() => setEnv(envOption)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                      env === envOption
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {envOption === 'windows' ? 'Windows PowerShell' : envOption}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Champ texte (textarea) */}
            <div className="space-y-1.5">
              <label htmlFor="prompt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Votre demande (en français) :
              </label>
              <textarea
                ref={textareaRef}
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Trouver tous les fichiers .log de plus de 7 jours et les supprimer..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Astuce : Cmd / Ctrl + Entrée pour soumettre</span>
                <span>{prompt.length} caractères</span>
              </div>
            </div>

            {/* 3. Bouton de soumission avec état de chargement */}
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                'Générer la commande'
              )}
            </button>
          </form>

          {/* 4. Zone de résultat */}
          {result && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Badge de risque */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Résultat</span>
                {getRiskBadge(result.risk)}
              </div>

              {/* Bloc de code avec bouton Copier */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-100 font-mono text-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950/50 border-b border-slate-800 text-xs text-slate-400">
                  <span>{env.toUpperCase()}</span>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs"
                    title="Copier la commande"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto">
                  <code>{result.command}</code>
                </div>
              </div>

              {/* Explication courte */}
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-white mb-1">Explication :</p>
                <p>{result.explanation}</p>
              </div>

              {/* Bandeau d'avertissement (warning) si présent */}
              {result.warning && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-sm flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Avertissement de sécurité</span>
                    {result.warning}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </main>
  );
}