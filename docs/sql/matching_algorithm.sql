-- Función para calcular matches de una oportunidad específica
-- El algoritmo compara categorías, tags (pesos) y ubicación.
-- Solo se guardan matches con puntaje > 30.

CREATE OR REPLACE FUNCTION fn_calcular_matches_oportunidad(p_oportunidad_id UUID)
RETURNS void AS $$
DECLARE
    v_categoria_id UUID;
    v_localidad TEXT;
BEGIN
    -- 1. Obtener datos de la oportunidad
    SELECT categoria_id, localidad
    INTO v_categoria_id, v_localidad
    FROM oportunidades
    WHERE id = p_oportunidad_id;

    -- Extraer provincia de la oportunidad (asumiendo que está en la tabla empresas o proveedores vinculada, pero aquí lo simplificamos si la tabla oportunidades tuviera provincia, lo cual no tiene según schema. Usaremos solo localidad de la oportunidad por ahora)
    
    -- 2. Limpiar matches anteriores
    DELETE FROM oportunidades_matches WHERE oportunidad_id = p_oportunidad_id;

    -- 3. Calcular e Insertar Matches (Empresas y Proveedores)
    INSERT INTO oportunidades_matches (
        oportunidad_id,
        empresa_candidata_id,
        proveedor_candidato_id,
        puntaje,
        detalle_puntaje,
        estado,
        motivo_match,
        generado_en
    )
    WITH candidatos AS (
        -- Candidatos: Proveedores
        SELECT 
            p.id as proveedor_id,
            NULL::uuid as empresa_id,
            p.localidad,
            p.provincia,
            pc.categoria_id,
            'proveedor' as tipo
        FROM proveedores p
        LEFT JOIN proveedores_categorias pc ON p.id = pc.proveedor_id
        WHERE p.estado = 'aprobado'
        
        UNION ALL
        
        -- Candidatos: Empresas
        SELECT 
            NULL::uuid as proveedor_id,
            e.id as empresa_id,
            e.localidad,
            e.provincia,
            ec.categoria_id,
            'empresa' as tipo
        FROM empresas e
        LEFT JOIN empresas_categorias ec ON e.id = ec.empresa_id
        WHERE e.estado = 'aprobado'
    ),
    tag_scores AS (
        -- Calcular puntos por tags para cada candidato
        -- Match entre oportunidades_tags y (proveedores_tags O empresas_tags)
        SELECT 
            c.proveedor_id,
            c.empresa_id,
            SUM(ot.peso) as tag_points
        FROM candidatos c
        JOIN oportunidades_tags ot ON ot.oportunidad_id = p_oportunidad_id
        LEFT JOIN proveedores_tags pt ON c.proveedor_id = pt.proveedor_id AND ot.tag_id = pt.tag_id
        LEFT JOIN empresas_tags et ON c.empresa_id = et.empresa_id AND ot.tag_id = et.tag_id
        WHERE pt.tag_id IS NOT NULL OR et.tag_id IS NOT NULL
        GROUP BY c.proveedor_id, c.empresa_id
    ),
    final_scores AS (
        SELECT 
            c.proveedor_id,
            c.empresa_id,
            -- Puntaje Categoría (50 pts)
            (CASE WHEN c.categoria_id = v_categoria_id THEN 50 ELSE 0 END) as cat_score,
            -- Puntaje Tags (40 pts máx - proporcional si queremos, aquí sumamos pesos)
            COALESCE(ts.tag_points, 0) as tags_score,
            -- Puntaje Ubicación (10 pts)
            (CASE WHEN c.localidad = v_localidad THEN 10 ELSE 0 END) as loc_score
        FROM candidatos c
        LEFT JOIN tag_scores ts ON (c.proveedor_id = ts.proveedor_id OR c.empresa_id = ts.empresa_id)
    )
    SELECT 
        p_oportunidad_id,
        empresa_id,
        proveedor_id,
        (cat_score + tags_score + loc_score) as final_score,
        jsonb_build_object(
            'categoria', cat_score,
            'tags', tags_score,
            'ubicacion', loc_score
        ) as detalle,
        'sugerido',
        CASE 
            WHEN (cat_score + tags_score + loc_score) > 80 THEN 'Alta compatibilidad detectada'
            WHEN (cat_score + tags_score + loc_score) > 50 THEN 'Compatibilidad media'
            ELSE 'Cumple requisitos básicos'
        END,
        now()
    FROM final_scores
    WHERE (cat_score + tags_score + loc_score) > 30;

END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar el match al crear/actualizar una oportunidad
CREATE OR REPLACE FUNCTION tr_on_oportunidad_change()
RETURNS trigger AS $$
BEGIN
    PERFORM fn_calcular_matches_oportunidad(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_oportunidades_match
AFTER INSERT OR UPDATE OF categoria_id, localidad ON oportunidades
FOR EACH ROW EXECUTE FUNCTION tr_on_oportunidad_change();

-- Trigger para los tags de la oportunidad
CREATE OR REPLACE FUNCTION tr_on_oportunidad_tags_change()
RETURNS trigger AS $$
BEGIN
    PERFORM fn_calcular_matches_oportunidad(COALESCE(NEW.oportunidad_id, OLD.oportunidad_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_oportunidades_tags_match ON oportunidades_tags;
CREATE TRIGGER tr_oportunidades_tags_match
AFTER INSERT OR UPDATE OR DELETE ON oportunidades_tags
FOR EACH ROW EXECUTE FUNCTION tr_on_oportunidad_tags_change();

-- TRIGGER PARA CANDIDATOS (PROVEEDORES Y EMPRESAS)
-- Cuando un candidato actualiza sus tags o datos básicos, recalculamos sus matches
-- Solo para oportunidades en estado 'abierta' (asumiendo que ese es el nombre del estado activo)

CREATE OR REPLACE FUNCTION tr_on_candidate_change()
RETURNS trigger AS $$
DECLARE
    v_target_id UUID;
    v_rec RECORD;
BEGIN
    -- Identificar si el cambio es de un proveedor o una empresa
    v_target_id := COALESCE(NEW.proveedor_id, OLD.proveedor_id, NEW.empresa_id, OLD.empresa_id);
    
    -- Recalcular matches para todas las oportunidades abiertas
    -- NOTA: Esto es sencillo, pero en producción con miles de oportunidades se puede optimizar
    -- filtrando solo aquellas que comparten la categoría o tags del candidato.
    
    FOR v_rec IN (SELECT id FROM oportunidades WHERE estado = 'abierta') LOOP
        PERFORM fn_calcular_matches_oportunidad(v_rec.id);
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tags de proveedores
DROP TRIGGER IF EXISTS tr_proveedores_tags_match ON proveedores_tags;
CREATE TRIGGER tr_proveedores_tags_match
AFTER INSERT OR UPDATE OR DELETE ON proveedores_tags
FOR EACH ROW EXECUTE FUNCTION tr_on_candidate_change();

-- Aplicar a tags de empresas
DROP TRIGGER IF EXISTS tr_empresas_tags_match ON empresas_tags;
CREATE TRIGGER tr_empresas_tags_match
AFTER INSERT OR UPDATE OR DELETE ON empresas_tags
FOR EACH ROW EXECUTE FUNCTION tr_on_candidate_change();
