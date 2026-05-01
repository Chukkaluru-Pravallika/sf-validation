# sf-validation
Salesforce Validation Rule Manager 

# Salesforce Validation Rule Manager

## 📋 Overview

A full-stack web application that connects to Salesforce via OAuth 2.0 and allows management of validation rules on the Account object using Salesforce Tooling API.

## ✨ Features

- 🔐 **OAuth 2.0 Login** - Secure authentication with Salesforce using PKCE flow
- 📋 **Get All Validation Rules** - Fetch all validation rules from Account object
- 📊 **View Status** - Display rules with Active/Inactive status
- ✅ **Enable/Disable All** - Bulk activate or deactivate all rules
- 🔄 **Toggle Single Rule** - Individual rule activation/deactivation
- 🚀 **Deploy Changes** - Deploy all pending changes to Salesforce at once
- 🎨 **Visual Indicators** - Pending changes highlighted in yellow

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React.js | Frontend UI |
| Node.js + Express | Backend API |
| Salesforce Tooling API | Metadata management |
| OAuth 2.0 PKCE | Authentication |
| Axios | HTTP requests |

## 📁 Project Structure
sf-validation/
├── server.js # Express backend
├── package.json # Backend dependencies
├── frontend/
│ ├── src/
│ │ ├── App.js
│ │ ├── Dashboard.jsx
│ │ └── index.js
│ ├── public/
│ │ └── index.html
│ └── package.json # Frontend dependencies
└── README.md

text

## 🚀 How to Run Locally

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Salesforce Developer Account

### Step 1: Clone the Repository

```bash
git clone https://github.com/Chukkaluru-Pravallika/sf-validation.git
cd sf-validation
Step 2: Setup Backend
bash
# Install backend dependencies
npm install

# Start backend server
node server.js
Backend runs on: http://localhost:5000

Step 3: Setup Frontend
Open a new terminal:

bash
cd sf-validation

# Install frontend dependencies
cd frontend
npm install

# Start frontend application
npm start
Frontend runs on: http://localhost:3000

Step 4: Configure Salesforce
Login to your Salesforce Developer Org

Go to Setup → App Manager → New Connected App

Fill in:

Connected App Name: Validation Rule Manager

API Name: Validation_Rule_Manager

Contact Email: Your email

Enable OAuth Settings:

Callback URL: http://localhost:3000/callback

Selected OAuth Scopes:

Access and manage your data (api)

Perform requests at any time (refresh_token, offline_access)

Save and note your Consumer Key and Consumer Secret

Update the CLIENT_ID and CLIENT_SECRET in server.js

Step 5: Create Validation Rules
Go to Setup → Object Manager → Account → Validation Rules

Create 4-5 validation rules (example):

javascript
// Rule 1: Name Required
Rule Name: Name_Required
Formula: ISBLANK(Name)
Error Message: Account Name is required

// Rule 2: Phone Length
Rule Name: Phone_Length_Validation
Formula: LEN(Phone) != 10
Error Message: Phone number must be exactly 10 digits
🎯 How to Use
Login: Click "Login to Salesforce" button

View Rules: Rules automatically load after login

Toggle Rules: Click Activate/Deactivate on any rule

Bulk Actions: Use "Enable All" or "Disable All"

Deploy: Click "Deploy Changes" to save to Salesforce

Reset: Use "Reset Changes" to discard pending changes

📸 Screenshots
Login Screen
https://via.placeholder.com/800x400?text=Login+Screen

Dashboard with Rules
https://via.placeholder.com/800x400?text=Dashboard+with+Validation+Rules

🔧 API Endpoints
Endpoint	Method	Purpose
/auth/login-url	GET	Get Salesforce OAuth URL
/exchange-token	POST	Exchange code for access token
/api/validation-rules	GET	Fetch all validation rules
/api/update-validation-rule	POST	Update rule status
⚠️ Pending Changes Indicator
🟡 Yellow row = Rule has pending changes

(pending) text = Not yet deployed to Salesforce

⚠️ Warning banner = Shows number of pending changes

📝 Assignment Requirements Checklist
Salesforce Developer Org created

4-5 Validation Rules on Account object

Connected App configured with OAuth

Login button to Salesforce

Get all validation rules button

Display rules with Active/Inactive status

Enable/Disable all rules button

Toggle single validation rule

Deploy button to save changes

Deployed on local server
