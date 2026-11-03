-- Add the ADMIN role to the existing app_role enum.
-- Kept in its own migration because ALTER TYPE ... ADD VALUE cannot run
-- inside the same transaction as other statements using the enum.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ADMIN';