import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertTriangle } from 'lucide-react';

export const LmStudioConfig: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:1234/v1');
  const [models, setModels] = useState<{ id: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('lmStudioBaseUrl');
    const savedModel = localStorage.getItem('lmStudioModelName');
    if (savedUrl) setBaseUrl(savedUrl);
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setErrorMessage('');
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        setModels(data.data);
        setTestResult('success');
        // Si le modèle sélectionné n'est pas dans la liste, on prend le premier
        if (!selectedModel || !data.data.find((m: any) => m.id === selectedModel)) {
           if (data.data.length > 0) {
              setSelectedModel(data.data[0].id);
              localStorage.setItem('lmStudioModelName', data.data[0].id);
           }
        }
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (err: any) {
      setTestResult('error');
      setErrorMessage(err.message || 'Impossible de se connecter au serveur.');
      if (err.message.includes('Failed to fetch')) {
        setErrorMessage("Impossible de se connecter. Assurez-vous que LM Studio est lancé, que l'option 'Serve on Local Network' est activée et que CORS est activé. Si vous êtes sur GitHub Pages (HTTPS), vérifiez le blocage Mixed Content.");
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Configuration LM Studio (Vision V3)</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>URL de base (ex: http://localhost:1234/v1)</label>
        <input 
          type="text" 
          value={baseUrl} 
          onChange={(e) => {
            setBaseUrl(e.target.value);
            localStorage.setItem('lmStudioBaseUrl', e.target.value);
          }}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Modèle VLM à utiliser</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={selectedModel} 
            onChange={(e) => {
              setSelectedModel(e.target.value);
              localStorage.setItem('lmStudioModelName', e.target.value);
            }}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }}
          >
            {models.length === 0 ? (
              <option value={selectedModel || ''}>{selectedModel || 'Aucun modèle chargé'}</option>
            ) : (
              models.map(m => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))
            )}
          </select>
          <button 
            onClick={handleTestConnection}
            disabled={isTesting}
            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: isTesting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isTesting ? <Loader2 size={16} className="spin" /> : 'Tester la connexion'}
          </button>
        </div>
      </div>

      {testResult === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.85rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '4px' }}>
          <Check size={16} /> Connexion réussie à LM Studio ! {models.length} modèle(s) trouvé(s).
        </div>
      )}

      {testResult === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#ef4444', fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={16} /> Erreur de connexion
          </div>
          <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>{errorMessage}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#eab308', fontSize: '0.8rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Attention :</strong> Ce composant nécessite que LM Studio soit exécuté en arrière-plan. Assurez-vous d'avoir chargé un modèle <strong>Vision (VLM)</strong> comme Qwen2-VL ou LLaVA. 
        </div>
      </div>

    </div>
  );
};
