const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = "3MVG9VMBZCsTL9hmnIyNIIQevKc6qR35RLGb_tPbFKbOD0cKTQSnGoSgqAx.VT7qAbu_VX3YgK9r3i8bCYxda";
const CLIENT_SECRET = "ADABF8FCBE121EC486F9B478BD5B178BC93B6D09E8C9666995907C2866FFCF99";
const REDIRECT_URI = "http://localhost:3000/callback";
const LOGIN_URL = "https://login.salesforce.com";

const codeVerifiers = new Map();

app.get("/auth/login-url", (req, res) => {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');
    
    codeVerifiers.set(state, codeVerifier);
    
    const authUrl = `${LOGIN_URL}/services/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256&` +
        `state=${state}`;
    
    res.json({ authUrl, state });
});

app.post("/exchange-token", async (req, res) => {
    const { code, state } = req.body;
    
    const codeVerifier = codeVerifiers.get(state);
    if (!codeVerifier) {
        return res.status(400).json({ error: "Invalid state" });
    }
    codeVerifiers.delete(state);
    
    try {
        const response = await axios.post(
            `${LOGIN_URL}/services/oauth2/token`,
            new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error("Token error:", error.response?.data);
        res.status(400).json(error.response?.data);
    }
});

app.get("/api/validation-rules", async (req, res) => {
    const { access_token, instance_url } = req.query;
    
    console.log("=== Fetching Validation Rules ===");
    
    if (!access_token || !instance_url) {
        return res.status(401).json({ error: "Missing credentials" });
    }
    
    try {
        const query = `SELECT Id, ValidationName, ErrorMessage, Active FROM ValidationRule WHERE EntityDefinitionId='Account'`;
        
        const response = await axios.get(
            `${instance_url}/services/data/v58.0/tooling/query?q=${encodeURIComponent(query)}`,
            { headers: { 'Authorization': `Bearer ${access_token}` } }
        );
        
        console.log(`Found ${response.data.records.length} rules`);
        
        const rules = response.data.records.map(rule => ({
            id: rule.Id,
            name: rule.ValidationName || "Unnamed Rule",
            errorMessage: rule.ErrorMessage || "No error message",
            active: rule.Active || false
        }));
        
        res.json({ records: rules });
        
    } catch (error) {
        console.error("Error fetching rules:", error.response?.data);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// FIXED - Update validation rule using Metadata
app.post("/api/update-validation-rule", async (req, res) => {
    const { access_token, instance_url, ruleId, active } = req.body;
    
    console.log("=== Updating Validation Rule ===");
    console.log("Rule ID:", ruleId);
    console.log("Set Active to:", active);
    
    if (!access_token || !instance_url || !ruleId) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    
    try {
        // Get the current rule with its metadata
        const getResponse = await axios.get(
            `${instance_url}/services/data/v58.0/tooling/sobjects/ValidationRule/${ruleId}`,
            { headers: { 'Authorization': `Bearer ${access_token}` } }
        );
        
        // Modify the active status in metadata
        const metadata = getResponse.data.Metadata;
        metadata.active = active;
        
        // Update the rule
        await axios.patch(
            `${instance_url}/services/data/v58.0/tooling/sobjects/ValidationRule/${ruleId}`,
            { Metadata: metadata },
            { headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' } }
        );
        
        console.log("✅ Rule updated successfully");
        res.json({ success: true });
        
    } catch (error) {
        console.error("❌ Update failed:", error.response?.data);
        res.status(500).json({ 
            error: error.response?.data || error.message,
            message: "Failed to update validation rule"
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Backend running on http://localhost:${PORT}`);
    console.log(`📋 Callback URL: ${REDIRECT_URI}`);
});