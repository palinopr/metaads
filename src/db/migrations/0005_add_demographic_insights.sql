-- Create demographic_insights table for gender and age analytics
CREATE TABLE IF NOT EXISTS "demographic_insights" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" TEXT NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "ad_set_id" TEXT REFERENCES "ad_sets"("id") ON DELETE CASCADE,
  "ad_id" TEXT REFERENCES "ads"("id") ON DELETE CASCADE,
  "date" TIMESTAMP NOT NULL,
  "gender" TEXT NOT NULL,
  "age_range" TEXT,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "spend" INTEGER NOT NULL DEFAULT 0,
  "conversions" INTEGER NOT NULL DEFAULT 0,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "frequency" INTEGER,
  "ctr" INTEGER,
  "cpc" INTEGER,
  "cpm" INTEGER,
  "cost_per_conversion" INTEGER,
  "video_views" INTEGER,
  "video_avg_time_watched" INTEGER,
  "actions" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "demographic_insights_campaign_id_idx" ON "demographic_insights"("campaign_id");
CREATE INDEX IF NOT EXISTS "demographic_insights_date_idx" ON "demographic_insights"("date");
CREATE INDEX IF NOT EXISTS "demographic_insights_gender_idx" ON "demographic_insights"("gender");
CREATE INDEX IF NOT EXISTS "demographic_insights_campaign_date_gender_idx" ON "demographic_insights"("campaign_id", "date", "gender");

-- Add unique constraint to prevent duplicate entries
ALTER TABLE "demographic_insights" 
ADD CONSTRAINT "demographic_insights_unique" 
UNIQUE ("campaign_id", "ad_set_id", "ad_id", "date", "gender", "age_range");