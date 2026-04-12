-- ============================================================
-- CREAR USUARIO ADMINISTRADOR - UIAB Conecta
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- IMPORTANTE: Este script crea al usuario directamente en
-- auth.users y luego crea su perfil con rol 'admin'.
-- Después de ejecutarlo, el usuario puede iniciar sesión
-- normalmente desde /login con estas credenciales.
-- ============================================================

DO $$
DECLARE
  nuevo_id uuid := gen_random_uuid();
  email_admin text := 'julianboxler@vaxler.com.ar';
  password_admin text := 'GamesHD32';
BEGIN

  -- Verificar que no exista ya un usuario con ese email
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = email_admin) THEN
    RAISE NOTICE 'El usuario % ya existe. No se crea uno nuevo.', email_admin;
    RETURN;
  END IF;

  -- 1. Crear el usuario en auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    nuevo_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    email_admin,
    crypt(password_admin, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', 'Julián Boxler'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Crear la identidad del usuario (requerido por Supabase para login por email)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    nuevo_id,
    email_admin,
    jsonb_build_object('sub', nuevo_id::text, 'email', email_admin),
    'email',
    now(),
    now(),
    now()
  );

  -- 3. Crear el perfil del usuario con rol 'admin'
  INSERT INTO perfiles (
    id,
    email,
    nombre_completo,
    rol_sistema,
    activo,
    creado_en,
    actualizado_en
  ) VALUES (
    nuevo_id,
    email_admin,
    'Julián Boxler',
    'admin',
    true,
    now(),
    now()
  );

  RAISE NOTICE '✓ Usuario administrador creado exitosamente.';
  RAISE NOTICE '  Email: %', email_admin;
  RAISE NOTICE '  ID: %', nuevo_id;

END $$;
