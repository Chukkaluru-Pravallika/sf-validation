import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [rules, setRules] = useState([]);
    const [originalRules, setOriginalRules] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState('');
    const [instanceUrl, setInstanceUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('sf_access_token');
        const storedInstance = localStorage.getItem('sf_instance_url');
        
        if (storedToken && storedInstance) {
            setAccessToken(storedToken);
            setInstanceUrl(storedInstance);
            setIsAuthenticated(true);
            loadRules(storedToken, storedInstance);
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
            handleCallback(code, state);
        }
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/auth/login-url');
            window.location.href = res.data.authUrl;
        } catch (err) {
            setError('Cannot connect to backend');
            setLoading(false);
        }
    };

    const handleCallback = async (code, state) => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/exchange-token', { code, state });
            
            localStorage.setItem('sf_access_token', res.data.access_token);
            localStorage.setItem('sf_instance_url', res.data.instance_url);
            
            setAccessToken(res.data.access_token);
            setInstanceUrl(res.data.instance_url);
            setIsAuthenticated(true);
            
            await loadRules(res.data.access_token, res.data.instance_url);
        } catch (err) {
            setError('Login failed');
            setLoading(false);
        }
    };

    const loadRules = async (token, instance) => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const res = await axios.get('http://localhost:5000/api/validation-rules', {
                params: {
                    access_token: token || accessToken,
                    instance_url: instance || instanceUrl
                }
            });
            
            const rulesData = res.data.records || [];
            setRules(rulesData);
            setOriginalRules(JSON.parse(JSON.stringify(rulesData))); // Deep copy for comparison
            setHasChanges(false);
        } catch (err) {
            setError('Failed to load rules');
        }
        
        setLoading(false);
    };

    // Track local changes (does NOT deploy to Salesforce)
    const toggleRuleLocally = (ruleId) => {
        setRules(prevRules => 
            prevRules.map(rule => 
                rule.id === ruleId 
                    ? { ...rule, active: !rule.active }
                    : rule
            )
        );
        setHasChanges(true);
        setSuccess('');
        setError('');
    };

    // Track local changes for ALL rules
    const toggleAllRulesLocally = (activate) => {
        setRules(prevRules => 
            prevRules.map(rule => ({ ...rule, active: activate }))
        );
        setHasChanges(true);
        setSuccess('');
        setError('');
    };

    // DEPLOY BUTTON - Saves all changes to Salesforce
    const deployChanges = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        // Find which rules changed
        const changedRules = rules.filter((rule, index) => {
            return rule.active !== originalRules[index]?.active;
        });
        
        if (changedRules.length === 0) {
            setError("No changes to deploy");
            setLoading(false);
            return;
        }
        
        console.log(`Deploying ${changedRules.length} changes to Salesforce...`);
        
        let successCount = 0;
        for (const rule of changedRules) {
            try {
                await axios.post('http://localhost:5000/api/update-validation-rule', {
                    access_token: accessToken,
                    instance_url: instanceUrl,
                    ruleId: rule.id,
                    active: rule.active
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to deploy ${rule.name}:`, err);
                setError(`Failed to deploy: ${rule.name}`);
            }
        }
        
        if (successCount === changedRules.length) {
            setSuccess(`✅ Successfully deployed ${successCount} change(s) to Salesforce`);
            // Reload fresh data from Salesforce
            await loadRules(accessToken, instanceUrl);
        } else {
            setError(`Deployed ${successCount} out of ${changedRules.length} changes`);
        }
        
        setLoading(false);
    };

    // Reset local changes (discard unsaved changes)
    const resetChanges = () => {
        setRules(JSON.parse(JSON.stringify(originalRules)));
        setHasChanges(false);
        setSuccess('');
        setError('');
    };

    const handleLogout = () => {
        localStorage.clear();
        setAccessToken('');
        setInstanceUrl('');
        setIsAuthenticated(false);
        setRules([]);
        setOriginalRules([]);
        setHasChanges(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: '#0070ba', borderBottom: '2px solid #0070ba', paddingBottom: '10px' }}>
                Salesforce Validation Rule Manager
            </h1>
            
            {error && (
                <div style={{ color: 'red', padding: '10px', background: '#ffebee', margin: '10px 0', borderRadius: '4px' }}>
                    ❌ {error}
                </div>
            )}
            
            {success && (
                <div style={{ color: 'green', padding: '10px', background: '#d4edda', margin: '10px 0', borderRadius: '4px' }}>
                    {success}
                </div>
            )}
            
            {hasChanges && (
                <div style={{ color: '#856404', padding: '10px', background: '#fff3cd', margin: '10px 0', borderRadius: '4px' }}>
                    ⚠️ You have unsaved changes. Click "Deploy Changes" to save to Salesforce.
                </div>
            )}
            
            {!isAuthenticated ? (
                <button onClick={handleLogin} disabled={loading} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                    {loading ? 'Loading...' : '🔐 Login to Salesforce'}
                </button>
            ) : (
                <>
                    <div style={{ margin: '20px 0' }}>
                        <button onClick={() => loadRules()} style={{ marginRight: '10px', padding: '8px 15px', cursor: 'pointer' }}>
                            🔄 Get All Rules
                        </button>
                        <button onClick={() => toggleAllRulesLocally(true)} style={{ marginRight: '10px', padding: '8px 15px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                            ✅ Enable All
                        </button>
                        <button onClick={() => toggleAllRulesLocally(false)} style={{ marginRight: '10px', padding: '8px 15px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                            ❌ Disable All
                        </button>
                        <button onClick={deployChanges} style={{ marginRight: '10px', padding: '8px 15px', cursor: 'pointer', background: '#0070ba', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                            🚀 Deploy Changes
                        </button>
                        <button onClick={resetChanges} style={{ marginRight: '10px', padding: '8px 15px', cursor: 'pointer', background: '#ffc107', color: '#333', border: 'none', borderRadius: '4px' }}>
                            ↩️ Reset Changes
                        </button>
                        <button onClick={handleLogout} style={{ padding: '8px 15px', cursor: 'pointer', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Logout
                        </button>
                    </div>
                    
                    {loading && <p>⏳ Loading...</p>}
                    
                    {rules.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ddd' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Rule Name</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Error Message</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule, index) => {
                                    const originalActive = originalRules[index]?.active;
                                    const isChanged = rule.active !== originalActive;
                                    
                                    return (
                                        <tr key={rule.id} style={{ 
                                            borderBottom: '1px solid #ddd',
                                            backgroundColor: isChanged ? '#fff3cd' : (index % 2 === 0 ? '#fff' : '#f9f9f9')
                                        }}>
                                            <td style={{ padding: '10px' }}>
                                                <strong>{rule.name}</strong>
                                                {isChanged && <span style={{ marginLeft: '10px', fontSize: '11px', color: '#856404' }}>(pending)</span>}
                                            </td>
                                            <td style={{ padding: '10px' }}>{rule.errorMessage}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ 
                                                    display: 'inline-block',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: rule.active ? '#d4edda' : '#f8d7da',
                                                    color: rule.active ? '#155724' : '#721c24',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px'
                                                }}>
                                                    {rule.active ? '✓ ACTIVE' : '✗ INACTIVE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <button 
                                                    onClick={() => toggleRuleLocally(rule.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        cursor: 'pointer',
                                                        backgroundColor: rule.active ? '#dc3545' : '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {rule.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    
                    {!loading && rules.length === 0 && (
                        <p>No validation rules found on Account object.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
