ALTER TABLE public.short_links ADD COLUMN IF NOT EXISTS edit_token UUID NOT NULL DEFAULT gen_random_uuid();

REVOKE SELECT ON public.short_links FROM anon, authenticated;
GRANT SELECT (id, code, url, clicks, created_at) ON public.short_links TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_short_link(_code TEXT, _url TEXT)
RETURNS TABLE (code TEXT, edit_token UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _url !~ '^https://wa\.me/' THEN
    RAISE EXCEPTION 'invalid_url';
  END IF;
  IF _code !~ '^[a-zA-Z0-9_-]{3,32}$' THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  RETURN QUERY
  INSERT INTO public.short_links (code, url)
  VALUES (_code, _url)
  RETURNING short_links.code, short_links.edit_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.rename_short_link(_token UUID, _new_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_code TEXT;
BEGIN
  IF _new_code !~ '^[a-zA-Z0-9_-]{3,32}$' THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  UPDATE public.short_links SET code = _new_code
   WHERE edit_token = _token
  RETURNING code INTO v_code;
  IF v_code IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_short_link(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rename_short_link(UUID, TEXT) TO anon, authenticated;