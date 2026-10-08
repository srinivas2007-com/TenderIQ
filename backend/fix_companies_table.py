import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "bidready.db")

def fix_table():
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if user_id is NOT NULL
    cursor.execute("PRAGMA table_info(companies)")
    cols = cursor.fetchall()
    print("Columns in companies:")
    for c in cols:
        print(c)

    # SQLite doesn't support ALTER COLUMN to drop NOT NULL directly,
    # so we do a standard table rebuild
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='companies'")
    create_sql = cursor.fetchone()[0]
    print(f"Original CREATE TABLE:\n{create_sql}")

    if "user_id VARCHAR(36) NOT NULL" in create_sql or "user_id VARCHAR(36) UNIQUE NOT NULL" in create_sql or "user_id VARCHAR(36)" in create_sql:
        print("Rebuilding companies table with nullable user_id...")
        cursor.execute("ALTER TABLE companies RENAME TO companies_old")
        
        # Create new companies table with nullable user_id
        cursor.execute("""
        CREATE TABLE companies (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            is_sample BOOLEAN DEFAULT 0,
            name VARCHAR(255) NOT NULL,
            company_type VARCHAR(100),
            industry VARCHAR(100),
            description TEXT,
            location VARCHAR(255),
            state VARCHAR(100),
            country VARCHAR(100) DEFAULT 'India',
            website VARCHAR(255),
            annual_turnover FLOAT DEFAULT 0.0,
            average_turnover FLOAT DEFAULT 0.0,
            turnover_history JSON DEFAULT '[]',
            financial_year VARCHAR(50) DEFAULT '2023-2024',
            working_capital FLOAT DEFAULT 0.0,
            credit_rating VARCHAR(50) DEFAULT 'CRISIL BBB+',
            years_in_business INTEGER DEFAULT 0,
            relevant_experience_years INTEGER DEFAULT 0,
            completed_projects_count INTEGER DEFAULT 0,
            similar_projects_desc TEXT,
            major_projects JSON DEFAULT '[]',
            certifications JSON DEFAULT '[]',
            services JSON DEFAULT '[]',
            products JSON DEFAULT '[]',
            technologies JSON DEFAULT '[]',
            equipment JSON DEFAULT '[]',
            workforce_count INTEGER DEFAULT 0,
            engineers_count INTEGER DEFAULT 5,
            team_capacity_hours_weekly FLOAT DEFAULT 160.0,
            active_bids_count INTEGER DEFAULT 0,
            technical_qualifications TEXT,
            gst_number VARCHAR(50),
            pan_number VARCHAR(50),
            registration_number VARCHAR(100),
            pf_esi_compliance BOOLEAN DEFAULT 0,
            other_compliance TEXT,
            completeness_percentage INTEGER DEFAULT 0,
            missing_items JSON DEFAULT '[]',
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # Copy data from old table
        cursor.execute("PRAGMA table_info(companies_old)")
        old_cols = [r[1] for r in cursor.fetchall()]
        common_cols = [c[1] for c in cursor.execute("PRAGMA table_info(companies)").fetchall() if c[1] in old_cols]
        cols_str = ", ".join(common_cols)
        
        cursor.execute(f"INSERT INTO companies ({cols_str}) SELECT {cols_str} FROM companies_old")
        cursor.execute("DROP TABLE companies_old")
        conn.commit()
        print("[OK] companies table successfully rebuilt with nullable user_id!")

    conn.close()

if __name__ == "__main__":
    fix_table()
