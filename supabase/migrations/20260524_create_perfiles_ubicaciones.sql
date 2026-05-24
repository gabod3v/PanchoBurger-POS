-- Create perfiles_ubicaciones join table for branch-level permissions
CREATE TABLE perfiles_ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  ubicacion_id UUID NOT NULL REFERENCES ubicaciones(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ubicacion_id)
);

-- Enable RLS
ALTER TABLE perfiles_ubicaciones ENABLE ROW LEVEL SECURITY;

-- Users can read their own rows
CREATE POLICY "users_read_own" ON perfiles_ubicaciones
  FOR SELECT USING (user_id = auth.uid());

-- Users with elevated role in perfiles can read all rows for their tenant
CREATE POLICY "managers_read_all" ON perfiles_ubicaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND role IN ('owner', 'manager', 'super_admin')
    )
  );

-- Owners can insert
CREATE POLICY "owner_insert" ON perfiles_ubicaciones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND role IN ('owner', 'super_admin')
    )
  );

-- Owners can update
CREATE POLICY "owner_update" ON perfiles_ubicaciones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND role IN ('owner', 'super_admin')
    )
  );

-- Owners can delete
CREATE POLICY "owner_delete" ON perfiles_ubicaciones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND role IN ('owner', 'super_admin')
    )
  );
