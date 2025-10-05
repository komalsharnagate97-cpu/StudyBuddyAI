-- Digital Dynamic Admin Panel - Complete Supabase Schema
-- This schema should be executed in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    source TEXT DEFAULT 'website' CHECK (source IN ('website', 'referral', 'social_media')),
    last_contact TIMESTAMPTZ,
    value DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'inactive')),
    sales INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT CHECK (payment_method IN ('card', 'upi', 'bank_transfer', 'wallet')),
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_earned DECIMAL(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'upi', 'wallet')),
    account_details JSONB, -- Bank details, UPI ID, etc.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    rejection_reason TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('in_app', 'email', 'push', 'all')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    emoji TEXT,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all_users', 'active_clients', 'leads', 'premium_users', 'custom')),
    custom_segment JSONB, -- For custom audience targeting
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipient_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ table
CREATE TABLE faq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('referral', 'marketing', 'promotional')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    budget DECIMAL(10, 2),
    spent DECIMAL(10, 2) DEFAULT 0,
    metrics JSONB, -- Campaign performance metrics
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Config table
CREATE TABLE ai_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    mode TEXT NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'voice', 'both')),
    system_prompt TEXT,
    welcome_message TEXT,
    fallback_response TEXT,
    settings JSONB, -- Additional AI settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'agent')),
    permissions JSONB, -- Role-based permissions
    assigned_leads INTEGER DEFAULT 0,
    performance DECIMAL(5, 2) DEFAULT 0,
    last_active TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log table for audit trail
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_source ON users(source);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_product_id ON payments(product_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_target_audience ON notifications(target_audience);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_faq_category ON faq(category);
CREATE INDEX idx_faq_is_active ON faq(is_active);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);

CREATE INDEX idx_ai_config_product_id ON ai_config(product_id);
CREATE INDEX idx_ai_config_is_enabled ON ai_config(is_enabled);

CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_is_active ON team_members(is_active);

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_faq_updated_at BEFORE UPDATE ON faq FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ai_config_updated_at BEFORE UPDATE ON ai_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default admin user (you should change the password after setup)
INSERT INTO team_members (email, name, role, permissions, is_active) VALUES 
('admin@digitaldynamic.com', 'Admin User', 'admin', '{"all": true}', true);

-- Insert some default FAQ categories
INSERT INTO faq (question, answer, category) VALUES 
('How do I reset my password?', 'You can reset your password by clicking on the "Forgot Password" link on the login page. Enter your email address and follow the instructions sent to your email.', 'General'),
('What payment methods do you accept?', 'We accept all major credit cards, debit cards, UPI payments, net banking, and digital wallets. Payments are processed securely through our payment gateway.', 'Billing'),
('How does the AI assistant work?', 'Our AI assistant uses advanced natural language processing to understand your queries and provide personalized responses. It can help with product information, troubleshooting, and general support.', 'Technical');

-- Enable Row Level Security (RLS) for enhanced security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (you may want to customize these)
-- For now, we'll allow all operations for authenticated users
-- In production, you should implement more granular policies

CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON referrals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON withdrawals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON faq FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON ai_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON team_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON activity_log FOR ALL USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create a view for withdrawal requests with user information
CREATE VIEW withdrawal_requests_with_users AS
SELECT 
    w.*,
    u.name as user_name,
    u.email as user_email
FROM withdrawals w
LEFT JOIN users u ON w.user_id = u.id;

-- Create a function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM users),
        'revenue', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'),
        'conversionRate', (
            CASE 
                WHEN (SELECT COUNT(*) FROM users) > 0 
                THEN ROUND((SELECT COUNT(*) FROM payments WHERE status = 'completed')::DECIMAL / (SELECT COUNT(*) FROM users) * 100, 2)
                ELSE 0
            END
        ),
        'activeCampaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user/client information including leads and active clients';
COMMENT ON TABLE products IS 'Product catalog with pricing and status information';
COMMENT ON TABLE payments IS 'Payment transactions and revenue tracking';
COMMENT ON TABLE referrals IS 'Referral relationships and commission tracking';
COMMENT ON TABLE withdrawals IS 'Commission withdrawal requests and processing';
COMMENT ON TABLE notifications IS 'System notifications and broadcasting';
COMMENT ON TABLE faq IS 'Frequently asked questions organized by category';
COMMENT ON TABLE campaigns IS 'Marketing and referral campaigns';
COMMENT ON TABLE ai_config IS 'AI assistant configuration per product';
COMMENT ON TABLE team_members IS 'Admin panel team members and roles';
COMMENT ON TABLE activity_log IS 'Audit trail for admin actions';

COMMENT ON COLUMN users.status IS 'User status: active (paying client), inactive (lead), suspended';
COMMENT ON COLUMN users.source IS 'How the user was acquired: website, referral, social_media';
COMMENT ON COLUMN users.value IS 'Total monetary value of the client';
COMMENT ON COLUMN withdrawals.account_details IS 'JSON object containing bank details, UPI ID, or wallet info';
COMMENT ON COLUMN notifications.custom_segment IS 'JSON criteria for custom audience targeting';
COMMENT ON COLUMN campaigns.metrics IS 'JSON object containing campaign performance data';
COMMENT ON COLUMN ai_config.settings IS 'JSON object for additional AI configuration options';
COMMENT ON COLUMN team_members.permissions IS 'JSON object defining role-based access permissions';
