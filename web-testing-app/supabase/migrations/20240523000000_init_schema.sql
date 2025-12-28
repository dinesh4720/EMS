
-- Create Tables
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

CREATE TABLE IF NOT EXISTS test_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  configuration JSONB DEFAULT '{}',
  is_scheduled BOOLEAN DEFAULT false,
  schedule_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON test_suites(project_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_scheduled ON test_suites(is_scheduled);

CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  actions JSONB NOT NULL DEFAULT '[]',
  expected_results JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_suite_id ON test_cases(test_suite_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_order ON test_cases(order_index);
CREATE INDEX IF NOT EXISTS idx_test_cases_enabled ON test_cases(is_enabled);

CREATE TABLE IF NOT EXISTS test_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  chrome_tab_id VARCHAR(100),
  configuration JSONB DEFAULT '{}',
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_executions_suite_id ON test_executions(test_suite_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
CREATE INDEX IF NOT EXISTS idx_test_executions_start_time ON test_executions(start_time DESC);

CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_execution_id UUID REFERENCES test_executions(id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pass', 'fail', 'skip', 'error')),
  error_message TEXT,
  screenshots JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  actual_results JSONB DEFAULT '{}',
  execution_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_execution_id ON test_results(test_execution_id);
CREATE INDEX IF NOT EXISTS idx_test_results_case_id ON test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp DESC);

CREATE TABLE IF NOT EXISTS test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  test_execution_id UUID REFERENCES test_executions(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  ai_analysis JSONB DEFAULT '{}',
  summary JSONB DEFAULT '{}',
  export_format VARCHAR(20) CHECK (export_format IN ('html', 'pdf', 'json')),
  file_path VARCHAR(500),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_reports_project_id ON test_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_execution_id ON test_reports(test_execution_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_generated_at ON test_reports(generated_at DESC);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow all for authenticated users for now)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON projects FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_suites' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON test_suites FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_cases' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON test_cases FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_executions' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON test_executions FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_results' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON test_results FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_reports' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON test_reports FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Grant permissions
GRANT SELECT ON projects TO anon;
GRANT ALL ON projects TO authenticated;
GRANT SELECT ON test_suites TO anon;
GRANT ALL ON test_suites TO authenticated;
GRANT SELECT ON test_cases TO anon;
GRANT ALL ON test_cases TO authenticated;
GRANT SELECT ON test_executions TO anon;
GRANT ALL ON test_executions TO authenticated;
GRANT SELECT ON test_results TO anon;
GRANT ALL ON test_results TO authenticated;
GRANT SELECT ON test_reports TO anon;
GRANT ALL ON test_reports TO authenticated;
