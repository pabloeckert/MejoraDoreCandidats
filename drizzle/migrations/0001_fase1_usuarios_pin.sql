-- Migración FASE 1: Tabla usuarios y funciones de autenticación por PIN de 4 dígitos
-- Idempotente y aditiva para Lovable / Supabase

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabla usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT now(),
    ultimo_acceso TIMESTAMPTZ DEFAULT now(),
    tutorial_visto BOOLEAN DEFAULT false,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS tutorial_visto BOOLEAN DEFAULT false;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INT DEFAULT 0;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

-- Activar RLS sin políticas para anon (acceso exclusivo por RPC)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Función auxiliar de normalización de nombres
CREATE OR REPLACE FUNCTION public.normalizar_nombre_evaluador(p_nombre text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    clean_nombre text;
BEGIN
    clean_nombre := trim(p_nombre);
    IF lower(clean_nombre) = 'cecilia' THEN
        RETURN 'Cecilia';
    ELSIF lower(clean_nombre) = 'dahiana' THEN
        RETURN 'Dahiana';
    ELSIF lower(clean_nombre) = 'silvana' THEN
        RETURN 'Silvana';
    ELSIF lower(clean_nombre) = 'sindy' THEN
        RETURN 'Sindy';
    ELSE
        RETURN initcap(clean_nombre);
    END IF;
END;
$$;

-- 3. RPC: Crear usuario (Alta)
CREATE OR REPLACE FUNCTION public.crear_usuario(p_nombre text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_norm text;
    v_id uuid;
    v_user record;
BEGIN
    IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
        RAISE EXCEPTION 'El nombre no puede estar vacío.';
    END IF;

    IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'El PIN debe tener exactamente 4 dígitos numéricos.';
    END IF;

    v_norm := public.normalizar_nombre_evaluador(p_nombre);

    -- Verificar si ya existe un usuario con este nombre (insensible a mayúsculas)
    SELECT id, nombre INTO v_user FROM public.usuarios WHERE lower(nombre) = lower(v_norm);
    IF FOUND THEN
        RAISE EXCEPTION 'El usuario % ya existe. Si olvidaste tu PIN, contactá al administrador.', v_user.nombre;
    END IF;

    INSERT INTO public.usuarios (nombre, pin, creado_en, ultimo_acceso, tutorial_visto, intentos_fallidos)
    VALUES (v_norm, crypt(p_pin, gen_salt('bf')), now(), now(), false, 0)
    RETURNING id, nombre, tutorial_visto INTO v_user;

    RETURN jsonb_build_object(
        'id', v_user.id,
        'nombre', v_user.nombre,
        'tutorial_visto', v_user.tutorial_visto
    );
END;
$$;

-- 4. RPC: Iniciar sesión con límite de 5 intentos fallidos
CREATE OR REPLACE FUNCTION public.iniciar_sesion(p_nombre text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_norm text;
    v_user record;
BEGIN
    IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
        RAISE EXCEPTION 'Ingresá tu nombre.';
    END IF;

    IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'El PIN debe tener 4 dígitos numéricos.';
    END IF;

    v_norm := public.normalizar_nombre_evaluador(p_nombre);

    SELECT * INTO v_user FROM public.usuarios WHERE lower(nombre) = lower(v_norm);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario o PIN incorrecto.';
    END IF;

    -- Verificar bloqueo temporal
    IF v_user.bloqueado_hasta IS NOT NULL AND v_user.bloqueado_hasta > now() THEN
        RAISE EXCEPTION 'Cuenta bloqueada temporalmente. Probá de nuevo en un minuto.';
    END IF;

    -- Caso de PIN blanqueado
    IF v_user.pin IS NULL THEN
        RETURN jsonb_build_object(
            'requiere_nuevo_pin', true,
            'id', v_user.id,
            'nombre', v_user.nombre
        );
    END IF;

    -- Verificar hash de PIN
    IF v_user.pin = crypt(p_pin, v_user.pin) THEN
        -- Éxito: resetear intentos y actualizar último acceso
        UPDATE public.usuarios
        SET intentos_fallidos = 0,
            bloqueado_hasta = NULL,
            ultimo_acceso = now()
        WHERE id = v_user.id;

        RETURN jsonb_build_object(
            'id', v_user.id,
            'nombre', v_user.nombre,
            'tutorial_visto', v_user.tutorial_visto
        );
    ELSE
        -- Fallo de PIN: incrementar contador
        IF coalesce(v_user.intentos_fallidos, 0) + 1 >= 5 THEN
            UPDATE public.usuarios
            SET intentos_fallidos = 0,
                bloqueado_hasta = now() + interval '60 seconds'
            WHERE id = v_user.id;
            RAISE EXCEPTION 'Demasiados intentos fallidos. Probá de nuevo en un minuto.';
        ELSE
            UPDATE public.usuarios
            SET intentos_fallidos = coalesce(intentos_fallidos, 0) + 1
            WHERE id = v_user.id;
            RAISE EXCEPTION 'Usuario o PIN incorrecto.';
        END IF;
    END IF;
END;
$$;

-- 5. RPC: Definir PIN (solo cuando está en NULL, tras blanqueo)
CREATE OR REPLACE FUNCTION public.definir_pin(p_usuario_id uuid, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user record;
BEGIN
    IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'El PIN debe tener 4 dígitos numéricos.';
    END IF;

    SELECT * INTO v_user FROM public.usuarios WHERE id = p_usuario_id AND pin IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se puede definir el PIN porque el usuario no existe o ya tiene un PIN activo.';
    END IF;

    UPDATE public.usuarios
    SET pin = crypt(p_pin, gen_salt('bf')),
        intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        ultimo_acceso = now()
    WHERE id = p_usuario_id
    RETURNING id, nombre, tutorial_visto INTO v_user;

    RETURN jsonb_build_object(
        'id', v_user.id,
        'nombre', v_user.nombre,
        'tutorial_visto', v_user.tutorial_visto
    );
END;
$$;

-- 6. RPC: Marcar tutorial visto
CREATE OR REPLACE FUNCTION public.marcar_tutorial_visto(p_usuario_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.usuarios
    SET tutorial_visto = true
    WHERE id = p_usuario_id;
    RETURN true;
END;
$$;

-- Permisos de ejecución para anon y authenticated
GRANT EXECUTE ON FUNCTION public.normalizar_nombre_evaluador(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_usuario(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.iniciar_sesion(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.definir_pin(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_tutorial_visto(uuid) TO anon, authenticated;