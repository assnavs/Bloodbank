# BloodBankProject (Local, Windows)

This package contains a complete Windows-local full-stack Blood Bank application using:
- Backend: Flask (Python) REST API
- Database: MySQL (local)
- Frontend: React.js (create-react-app style)

## What I included
- backend/ (Flask app, requirements)
- frontend/ (React app source)
- mysql/schema.sql and mysql/sample_data.sql
- this README with setup and testing instructions

## Quick Windows setup (step-by-step)

1. Install prerequisites:
   - Python 3.10+ (Windows) and add to PATH
   - MySQL Server (Windows)
   - Node.js 18+
   - (optional) Git for Windows

2. Create project folder:
   Open PowerShell or CMD as Administrator and run:
   ```
   mkdir C:\BloodBankProject
   ```

3. Import database:
   - Open MySQL Workbench or use `mysql` CLI and run:
     ```
     SOURCE path\to\schema.sql;
     SOURCE path\to\sample_data.sql;
     ```
   - Or run from Command Prompt:
     ```
     mysql -u root -p < mysql\schema.sql
     mysql -u root -p < mysql\sample_data.sql
     ```

4. Backend (Flask):
   - Open PowerShell:
     ```
     cd C:\BloodBankProject\backend
     python -m venv venv
     venv\Scripts\activate
     pip install -r requirements.txt
     set DB_PASS=yourpassword
     set DB_USER=root
     set DB_NAME=bloodbank
     set FLASK_APP=app.py
     flask run
     ```
   - Flask will start at http://127.0.0.1:5000

5. Frontend (React):
   - Open a new PowerShell:
     ```
     cd C:\BloodBankProject\frontend
     npm install
     npm start
     ```
   - React dev server runs at http://localhost:3000 and will call the Flask API at port 5000.

## Testing APIs (examples)

Register:
curl -X POST http://localhost:5000/api/register ^
-H "Content-Type: application/json" ^
-d "{"name":"Test","email":"t@test.com","password":"t","role":"donor"}"

Get donors:
curl http://localhost:5000/api/donors

Get inventory:
curl http://localhost:5000/api/inventory

Submit request:
curl -X POST http://localhost:5000/api/request ^
-H "Content-Type: application/json" ^
-d "{"hospital_id":2,"blood_group":"A+","quantity":2}"

## Notes & security
- This project is designed for local/offline learning and demo purposes.
- Passwords are stored in plaintext for simplicity — **do not** use this approach in production. Use hashing (bcrypt) for real apps.
- Consider adding input validation, authentication (JWT), role-based access control for production.

