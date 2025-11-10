from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os

app = Flask(__name__)
CORS(app)

# ✅ Database config
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", "Sathyam#17"),  # 🔒 change to your MySQL password
    "database": os.getenv("DB_NAME", "bloodbank"),
    "autocommit": True
}

# ✅ Correct connection function
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# ✅ LOGIN - Include all user details
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM users WHERE email=%s AND password=%s",
            (email, password)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": "❌ Invalid email or password"}), 401

        return jsonify({
            "message": "Login successful",
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "blood_group": user.get("blood_group"),
            "location": user.get("location")
        }), 200

    except Exception as e:
        print("Error in /api/login:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ REGISTER
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    blood_group = data.get('blood_group')
    location = data.get('location')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            INSERT INTO users (name, email, password, role, blood_group, location)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (name, email, password, role, blood_group, location))

        user_id = cursor.lastrowid

        # NEW: if donor, create a donors row immediately
        if role == 'donor':
            cursor.execute("""
                INSERT INTO donors (user_id, blood_group, location, last_donation_date)
                VALUES (%s, %s, %s, NULL)
            """, (user_id, blood_group, location))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "✅ Registered successfully!"}), 201

    except mysql.connector.IntegrityError:
        return jsonify({"error": "❌ Email already exists."}), 400
    except Exception as e:
        print("Error in /api/register:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ BLOOD REQUEST
@app.route('/api/request', methods=['POST'])
def create_request():
    data = request.json
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO requests (hospital_id, blood_group, quantity, status)
            VALUES (%s, %s, %s, 'pending')
        """, (data.get('hospital_id'), data.get('blood_group'), data.get('quantity')))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Request submitted successfully'}), 201
    except Exception as e:
        print("Error in /api/request:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ UPDATE REQUEST - Decrease inventory when approved
@app.route('/api/request/<int:rid>', methods=['PUT'])
def update_request(rid):
    data = request.json
    
    # Validate input
    if not data:
        return jsonify({"error": "❌ Request body is required"}), 400
    
    new_status = data.get('status')
    if not new_status:
        return jsonify({"error": "❌ 'status' field is required (approved/rejected/pending)"}), 400
    
    if new_status not in ['approved', 'rejected', 'pending']:
        return jsonify({"error": "❌ Invalid status. Must be 'approved', 'rejected', or 'pending'"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Get request details first
        cur.execute("SELECT * FROM requests WHERE id=%s", (rid,))
        request_data = cur.fetchone()
        
        if not request_data:
            conn.close()
            return jsonify({"error": "❌ Request not found"}), 404
        
        # If approving, check inventory and decrease it
        if new_status == "approved":
            # Check current inventory
            cur.execute(
                "SELECT units FROM inventory WHERE blood_group=%s",
                (request_data['blood_group'],)
            )
            inventory = cur.fetchone()
            
            if not inventory:
                conn.close()
                return jsonify({
                    "error": f"❌ No inventory available for blood group {request_data['blood_group']}"
                }), 400
            
            if inventory['units'] < request_data['quantity']:
                conn.close()
                return jsonify({
                    "error": f"❌ Insufficient inventory. Available: {inventory['units']} units, Requested: {request_data['quantity']} units"
                }), 400
            
            # Decrease inventory
            cur.execute("""
                UPDATE inventory 
                SET units = units - %s 
                WHERE blood_group = %s
            """, (request_data['quantity'], request_data['blood_group']))
        
        # Update request status
        cur.execute("UPDATE requests SET status=%s WHERE id=%s", (new_status, rid))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': f'Request {new_status} successfully',
            'status': new_status
        }), 200
        
    except Exception as e:
        print("Error in /api/request update:", e)
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ INVENTORY
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM inventory")
        rows = cur.fetchall()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print("Error in /api/inventory:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ GET ALL REQUESTS (for Admin and Hospital)
@app.route('/api/request', methods=['GET'])
def get_requests():
    hospital_id = request.args.get('hospital_id', type=int)
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        if hospital_id:
            # Filter by hospital_id if provided
            cur.execute("""
                SELECT r.*, u.name as hospital_name
                FROM requests r
                LEFT JOIN users u ON r.hospital_id = u.id
                WHERE r.hospital_id = %s
                ORDER BY r.created_at DESC
            """, (hospital_id,))
        else:
            # Get all requests (for admin)
            cur.execute("""
                SELECT r.*, u.name as hospital_name
                FROM requests r
                LEFT JOIN users u ON r.hospital_id = u.id
                ORDER BY r.created_at DESC
            """)
        rows = cur.fetchall()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print("Error in /api/request GET:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ GET SINGLE REQUEST by ID
@app.route('/api/request/<int:rid>', methods=['GET'])
def get_single_request(rid):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        cur.execute("""
            SELECT r.*, u.name as hospital_name
            FROM requests r
            LEFT JOIN users u ON r.hospital_id = u.id
            WHERE r.id = %s
        """, (rid,))
        
        request_data = cur.fetchone()
        conn.close()
        
        if not request_data:
            return jsonify({"error": "❌ Request not found"}), 404
        
        return jsonify(request_data), 200
        
    except Exception as e:
        print("Error in /api/request/<id> GET:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ GET ALL HOSPITALS (for Admin)
@app.route('/api/hospitals', methods=['GET'])
def get_hospitals():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT id, name, email, location
            FROM users WHERE role='hospital'
        """)
        rows = cur.fetchall()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print("Error in /api/hospitals:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ RECORD DONATION (updates inventory automatically)
@app.route('/api/donation', methods=['POST'])
def record_donation():
    data = request.get_json()
    donor_id = data.get('donor_id')
    blood_group = data.get('blood_group')
    quantity = data.get('quantity', 1)  # Default 1 unit if not specified
    donation_date = data.get('donation_date')  # Optional, defaults to today
    
    if not donor_id or not blood_group:
        return jsonify({"error": "❌ Donor ID and blood group are required"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get donor's blood group if not provided
        if not blood_group:
            cur.execute("SELECT blood_group FROM users WHERE id=%s AND role='donor'", (donor_id,))
            donor = cur.fetchone()
            if not donor:
                conn.close()
                return jsonify({"error": "❌ Donor not found"}), 404
            blood_group = donor[0]
        
        # Update or insert into donors table (update last_donation_date)
        from datetime import datetime
        if not donation_date:
            donation_date = datetime.now().strftime('%Y-%m-%d')
        
        # Check if donor record exists in donors table
        cur.execute("SELECT id FROM donors WHERE user_id=%s", (donor_id,))
        donor_record = cur.fetchone()
        
        if donor_record:
            # Update existing record
            cur.execute("""
                UPDATE donors 
                SET last_donation_date=%s, blood_group=%s 
                WHERE user_id=%s
            """, (donation_date, blood_group, donor_id))
        else:
            # Insert new record
            cur.execute("SELECT location FROM users WHERE id=%s", (donor_id,))
            location_result = cur.fetchone()
            location = location_result[0] if location_result else None
            
            cur.execute("""
                INSERT INTO donors (user_id, blood_group, location, last_donation_date)
                VALUES (%s, %s, %s, %s)
            """, (donor_id, blood_group, location, donation_date))
        
        # Update inventory: Add units to the blood group
        # Use INSERT ... ON DUPLICATE KEY UPDATE to handle both new and existing blood groups
        cur.execute("""
            INSERT INTO inventory (blood_group, units)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE units = units + %s
        """, (blood_group, quantity, quantity))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": f"✅ Donation recorded successfully! Added {quantity} unit(s) of {blood_group} to inventory."
        }), 201
        
    except Exception as e:
        print("Error in /api/donation:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ GET USER PROFILE
@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Get user info
        cur.execute("SELECT * FROM users WHERE id=%s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            conn.close()
            return jsonify({"error": "❌ User not found"}), 404
        
        # Get donation info if donor
        donation_info = None
        if user['role'] == 'donor':
            cur.execute("""
                SELECT last_donation_date 
                FROM donors 
                WHERE user_id=%s
            """, (user_id,))
            donation_info = cur.fetchone()
        
        conn.close()
        
        profile = {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "blood_group": user.get("blood_group"),
            "location": user.get("location"),
            "last_donation_date": donation_info["last_donation_date"] if donation_info else None
        }
        
        return jsonify(profile), 200
        
    except Exception as e:
        print("Error in /api/user GET:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ UPDATE USER PROFILE
@app.route('/api/user/<int:user_id>', methods=['PUT'])
def update_user_profile(user_id):
    data = request.get_json()
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Check if user exists
        cur.execute("SELECT * FROM users WHERE id=%s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            conn.close()
            return jsonify({"error": "❌ User not found"}), 404
        
        # Build update query dynamically
        updates = []
        values = []
        
        if 'name' in data:
            updates.append("name = %s")
            values.append(data['name'])
        
        if 'email' in data:
            # Check if email already exists for another user
            cur.execute("SELECT id FROM users WHERE email=%s AND id != %s", (data['email'], user_id))
            if cur.fetchone():
                conn.close()
                return jsonify({"error": "❌ Email already exists"}), 400
            updates.append("email = %s")
            values.append(data['email'])
        
        if 'blood_group' in data:
            updates.append("blood_group = %s")
            values.append(data['blood_group'])
        
        if 'location' in data:
            updates.append("location = %s")
            values.append(data['location'])
        
        if 'password' in data and data['password']:
            updates.append("password = %s")
            values.append(data['password'])
        
        if not updates:
            conn.close()
            return jsonify({"error": "❌ No fields to update"}), 400
        
        # Update user
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        cur.execute(query, values)
        
        # If donor and blood_group changed, update donors table too
        if 'blood_group' in data and user['role'] == 'donor':
            cur.execute("""
                UPDATE donors 
                SET blood_group = %s 
                WHERE user_id = %s
            """, (data['blood_group'], user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "✅ Profile updated successfully",
            "user_id": user_id
        }), 200
        
    except Exception as e:
        print("Error in /api/user PUT:", e)
        return jsonify({"error": f"Server error: {e}"}), 500

# ============================================
# ✅ DONORS CRUD OPERATIONS
# ============================================

# ✅ CREATE - Create a new donor record
@app.route('/api/donors', methods=['POST'])
def create_donor():
    data = request.get_json()
    user_id = data.get('user_id')
    blood_group = data.get('blood_group')
    location = data.get('location')
    last_donation_date = data.get('last_donation_date')

    # Validation
    if not user_id:
        return jsonify({"error": "❌ user_id is required"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Check if user exists and is a donor
        cur.execute("SELECT id, role FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            conn.close()
            return jsonify({"error": "❌ User not found"}), 404
        
        if user['role'] != 'donor':
            conn.close()
            return jsonify({"error": "❌ User is not a donor"}), 400

        # Check if donor record already exists
        cur.execute("SELECT id FROM donors WHERE user_id = %s", (user_id,))
        existing = cur.fetchone()
        
        if existing:
            conn.close()
            return jsonify({"error": "❌ Donor record already exists for this user"}), 400

        # Create donor record
        cur.execute("""
            INSERT INTO donors (user_id, blood_group, location, last_donation_date)
            VALUES (%s, %s, %s, %s)
        """, (user_id, blood_group, location, last_donation_date))
        
        donor_id = cur.lastrowid

        # Sync with users table if blood_group or location provided
        if blood_group or location:
            updates = []
            values = []
            
            if blood_group:
                updates.append("blood_group = %s")
                values.append(blood_group)
            
            if location:
                updates.append("location = %s")
                values.append(location)
            
            if updates:
                values.append(user_id)
                cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", values)

        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "✅ Donor created successfully!",
            "donor_id": donor_id,
            "user_id": user_id
        }), 201
        
    except mysql.connector.IntegrityError as e:
        return jsonify({"error": f"❌ Database error: {str(e)}"}), 400
    except Exception as e:
        print("Error in POST /api/donors:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ READ - Get all donors
@app.route('/api/donors', methods=['GET'])
def get_donors():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT u.id AS user_id, u.name, u.email,
                   COALESCE(d.blood_group, u.blood_group) AS blood_group,
                   COALESCE(d.location, u.location) AS location,
                   d.id AS donor_id, d.last_donation_date
            FROM users u
            LEFT JOIN donors d ON u.id = d.user_id
            WHERE u.role = 'donor'
            ORDER BY u.name
        """)
        rows = cur.fetchall()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        print("Error in GET /api/donors:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ READ - Get single donor by user_id
@app.route('/api/donors/user/<int:user_id>', methods=['GET'])
def get_donor_by_user_id(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        cur.execute("""
            SELECT u.id AS user_id, u.name, u.email, u.role,
                   COALESCE(d.blood_group, u.blood_group) AS blood_group,
                   COALESCE(d.location, u.location) AS location,
                   d.id AS donor_id, d.last_donation_date
            FROM users u
            LEFT JOIN donors d ON u.id = d.user_id
            WHERE u.id = %s AND u.role = 'donor'
        """, (user_id,))
        
        donor = cur.fetchone()
        conn.close()
        
        if not donor:
            return jsonify({"error": "❌ Donor not found"}), 404
        
        return jsonify(donor), 200
        
    except Exception as e:
        print("Error in GET /api/donors/user/<id>:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ READ - Get single donor by donor_id (donors table id)
@app.route('/api/donors/<int:donor_id>', methods=['GET'])
def get_donor_by_id(donor_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        cur.execute("""
            SELECT d.id AS donor_id, d.user_id, 
                   d.blood_group, d.location, d.last_donation_date,
                   u.id AS user_id, u.name, u.email, u.role
            FROM donors d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = %s
        """, (donor_id,))
        
        donor = cur.fetchone()
        conn.close()
        
        if not donor:
            return jsonify({"error": "❌ Donor record not found"}), 404
        
        return jsonify(donor), 200
        
    except Exception as e:
        print("Error in GET /api/donors/<id>:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ UPDATE - Update donor record by donor_id
@app.route('/api/donors/<int:donor_id>', methods=['PUT'])
def update_donor_record(donor_id):
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "❌ Request body is required"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Get the donor record and user_id
        cur.execute("SELECT user_id FROM donors WHERE id = %s", (donor_id,))
        donor_record = cur.fetchone()
        
        if not donor_record:
            conn.close()
            return jsonify({"error": "❌ Donor record not found"}), 404
        
        user_id = donor_record['user_id']

        # Build update query for donors table
        updates = []
        values = []
        
        if 'blood_group' in data:
            updates.append("blood_group = %s")
            values.append(data['blood_group'])
        
        if 'location' in data:
            updates.append("location = %s")
            values.append(data['location'])
        
        if 'last_donation_date' in data:
            updates.append("last_donation_date = %s")
            values.append(data['last_donation_date'])

        if not updates:
            conn.close()
            return jsonify({"error": "❌ No fields to update"}), 400

        # Update donors table
        values.append(donor_id)
        cur.execute(f"UPDATE donors SET {', '.join(updates)} WHERE id = %s", values)

        # Sync with users table if blood_group or location changed
        user_updates = []
        user_values = []
        
        if 'blood_group' in data:
            user_updates.append("blood_group = %s")
            user_values.append(data['blood_group'])
        
        if 'location' in data:
            user_updates.append("location = %s")
            user_values.append(data['location'])
        
        if user_updates:
            user_values.append(user_id)
            cur.execute(f"UPDATE users SET {', '.join(user_updates)} WHERE id = %s", user_values)

        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "✅ Donor updated successfully!",
            "donor_id": donor_id,
            "user_id": user_id
        }), 200
        
    except Exception as e:
        print("Error in PUT /api/donors/<donor_id>:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


# ✅ DELETE - Delete donor record by donor_id
@app.route('/api/donors/<int:donor_id>', methods=['DELETE'])
def delete_donor_record(donor_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Get donor info before deletion
        cur.execute("SELECT user_id FROM donors WHERE id = %s", (donor_id,))
        donor = cur.fetchone()
        
        if not donor:
            conn.close()
            return jsonify({"error": "❌ Donor record not found"}), 404

        # Delete donor record
        cur.execute("DELETE FROM donors WHERE id = %s", (donor_id,))

        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "✅ Donor record deleted successfully!",
            "deleted_donor_id": donor_id,
            "user_id": donor['user_id']
        }), 200
        
    except Exception as e:
        print("Error in DELETE /api/donors/<donor_id>:", e)
        return jsonify({"error": f"Server error: {e}"}), 500


@app.route('/')
def home():
    return "Blood Bank API is running ✅"


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('FLASK_RUN_PORT', 5000)), debug=True)
