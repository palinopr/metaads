#!/usr/bin/env python3
"""
Database Initialization Script

CEO Note: One command to rule them all. Sets up everything you need.
"""

import os
import sys
import sqlite3
from pathlib import Path
import json
from datetime import datetime

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))


def create_sqlite_database():
    """Create SQLite database for quick development"""
    
    print("🚀 CEO Database Initializer")
    print("=" * 50)
    
    # Create data directory
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Connect to database
    db_path = data_dir / "ai_marketing.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    print(f"✅ Created database at: {db_path}")
    
    # Create tables
    tables = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            subscription_tier TEXT DEFAULT 'free'
        )
        """,
        
        """
        CREATE TABLE IF NOT EXISTS campaigns (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            config JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """,
        
        """
        CREATE TABLE IF NOT EXISTS campaign_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            metrics JSON,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
        )
        """,
        
        """
        CREATE TABLE IF NOT EXISTS agent_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_name TEXT NOT NULL,
            user_id TEXT,
            input JSON,
            output JSON,
            success BOOLEAN,
            execution_time REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        """
        CREATE TABLE IF NOT EXISTS content_variations (
            id TEXT PRIMARY KEY,
            campaign_id TEXT NOT NULL,
            content JSON,
            performance_prediction JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
        )
        """,
        
        """
        CREATE TABLE IF NOT EXISTS optimization_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            optimization_type TEXT,
            changes_applied JSON,
            metrics_before JSON,
            metrics_after JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
        )
        """
    ]
    
    for i, table_sql in enumerate(tables):
        cursor.execute(table_sql)
        print(f"✅ Created table {i+1}/6")
    
    # Create indexes for performance
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_metrics_campaign ON campaign_metrics(campaign_id)",
        "CREATE INDEX IF NOT EXISTS idx_executions_agent ON agent_executions(agent_name)",
        "CREATE INDEX IF NOT EXISTS idx_content_campaign ON content_variations(campaign_id)"
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)
    
    print("✅ Created performance indexes")
    
    # Insert demo data
    demo_user_id = "demo_user_001"
    cursor.execute("""
        INSERT OR IGNORE INTO users (id, email, name, subscription_tier)
        VALUES (?, ?, ?, ?)
    """, (demo_user_id, "demo@aimarketing.com", "Demo User", "premium"))
    
    # Create demo campaign
    demo_campaign = {
        "id": "camp_demo_001",
        "user_id": demo_user_id,
        "name": "Demo Fitness App Campaign",
        "status": "active",
        "config": json.dumps({
            "objective": "app_installs",
            "budget": {"amount": 100, "currency": "USD", "schedule": "daily"},
            "targeting": {
                "age_min": 25,
                "age_max": 45,
                "genders": ["all"],
                "interests": ["fitness", "health", "wellness"]
            }
        })
    }
    
    cursor.execute("""
        INSERT OR IGNORE INTO campaigns (id, user_id, name, status, config)
        VALUES (?, ?, ?, ?, ?)
    """, (
        demo_campaign["id"],
        demo_campaign["user_id"],
        demo_campaign["name"],
        demo_campaign["status"],
        demo_campaign["config"]
    ))
    
    print("✅ Created demo data")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 50)
    print("🎉 Database initialization complete!")
    print(f"📁 Database location: {db_path.absolute()}")
    print("\n🚀 Next steps:")
    print("1. Copy .env.example to .env")
    print("2. Add your API keys")
    print("3. Run: npm run dev")
    print("4. Visit: http://localhost:3000")
    print("\n💪 Let's revolutionize marketing together!")
    print("=" * 50)


def create_config_files():
    """Create necessary config files if they don't exist"""
    
    # Create drizzle config
    drizzle_config = """import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './data/ai_marketing.db',
  },
} satisfies Config;
"""
    
    config_path = Path("drizzle.config.ts")
    if not config_path.exists():
        config_path.write_text(drizzle_config)
        print("✅ Created drizzle.config.ts")
    
    # Create .gitignore if not exists
    gitignore_content = """# Dependencies
node_modules/
.pnp
.pnp.js

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Database
data/
*.db
*.sqlite

# Environment
.env
.env.local
.env.production

# Production
build/
dist/
.next/
out/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
*.pem

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/
.nyc_output

# LangSmith
.langchain/

# CEO Notes (private strategy)
CEO_PRIVATE_NOTES.md
"""
    
    gitignore_path = Path(".gitignore")
    if not gitignore_path.exists():
        gitignore_path.write_text(gitignore_content)
        print("✅ Created .gitignore")


if __name__ == "__main__":
    print("\n🚀 AI Marketing Automation - Setup Script")
    print("=" * 50)
    print("CEO Mode: Setting up your empire...\n")
    
    try:
        # Create database
        create_sqlite_database()
        
        # Create config files
        create_config_files()
        
        print("\n✅ ALL SYSTEMS GO!")
        print("\nYour AI Marketing Automation platform is ready.")
        print("Time to disrupt the industry! 💪")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("Don't worry, we'll fix this together!")
        print("Check the error above and try again.")
        sys.exit(1)