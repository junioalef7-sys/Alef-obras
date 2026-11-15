-- OBRIX: limite de uma diária por funcionário e DATA (não por obra).
-- Preparada para aplicação no banco oficial APÓS aprovação na versão de teste.
-- Mantém histórico legado inclusive registros pagos e eventuais duplicidades anteriores.
-- Novos registros: 1 inteira OU até 2 meias; canceladas não contam.
-- pg_advisory_xact_lock serializa INSERT/UPDATE de mesmo funcionário/dia entre aparelhos.
CREATE OR REPLACE FUNCTION public.obrix_validar_limite_diarias_dia()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_soma numeric(10,2);
  v_contagem integer;
  v_id uuid;
BEGIN
  IF TG_OP='UPDATE' THEN
    IF NEW.empresa_id IS NOT DISTINCT FROM OLD.empresa_id
       AND NEW.funcionario_id IS NOT DISTINCT FROM OLD.funcionario_id
       AND NEW.data IS NOT DISTINCT FROM OLD.data
       AND NEW.quantidade IS NOT DISTINCT FROM OLD.quantidade
       AND NEW.cancelada_em IS NOT DISTINCT FROM OLD.cancelada_em THEN
       RETURN NEW;
    END IF;
  END IF;
  IF NEW.cancelada_em IS NOT NULL THEN
    RETURN NEW; -- histórico preservado, mas dia liberado para novo lançamento.
  END IF;
  IF NEW.quantidade IS NULL OR NEW.quantidade NOT IN (0.5,1) THEN
    RAISE EXCEPTION USING ERRCODE='23514',
      CONSTRAINT='obrix_diaria_quantidade',
      MESSAGE='OBRIX_DIARIA_QUANTIDADE: escolha diária inteira ou meia diária.';
  END IF;
  IF NEW.empresa_id IS NULL OR NEW.funcionario_id IS NULL OR NEW.data IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='23514',
      CONSTRAINT='obrix_diaria_campos',
      MESSAGE='OBRIX_DIARIA_CAMPOS: informe funcionário e data.';
  END IF;
  -- Chave de transação por EMPRESA + FUNCIONÁRIO + DATA. Impede duas gravações
  -- simultâneas de passarem na leitura antes de a outra transação confirmar.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    NEW.empresa_id::text || ':' || NEW.funcionario_id::text || ':' || NEW.data::text, 882731
  ));
  v_id := CASE WHEN TG_OP='UPDATE' THEN OLD.id ELSE NEW.id END;
  SELECT COALESCE(SUM(d.quantidade),0),COUNT(*)::int
    INTO v_soma,v_contagem
    FROM public.diarias d
   WHERE d.empresa_id=NEW.empresa_id
     AND d.funcionario_id=NEW.funcionario_id
     AND d.data=NEW.data
     AND d.cancelada_em IS NULL
     AND (v_id IS NULL OR d.id<>v_id);
  IF v_soma+NEW.quantidade > 1 OR v_contagem >= 2 THEN
    RAISE EXCEPTION USING ERRCODE='23514',
      CONSTRAINT='obrix_diarias_limite_dia',
      MESSAGE='OBRIX_DIARIA_LIMITE_DIA: este funcionário já atingiu o limite de uma diária inteira ou duas meias diárias nesta data.';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS obrix_diarias_limite_dia_guard ON public.diarias;
CREATE TRIGGER obrix_diarias_limite_dia_guard
BEFORE INSERT OR UPDATE OF empresa_id,funcionario_id,data,quantidade,cancelada_em
ON public.diarias FOR EACH ROW
EXECUTE FUNCTION public.obrix_validar_limite_diarias_dia();

CREATE INDEX IF NOT EXISTS obrix_diarias_dia_ativas_idx
ON public.diarias (empresa_id,funcionario_id,data)
WHERE cancelada_em IS NULL;
