ALTER TABLE public.short_links ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS short_links_user_id_idx ON public.short_links (user_id);

GRANT SELECT (id, code, url, clicks, created_at, user_id) ON public.short_links TO authenticated;

CREATE POLICY "Owners can read own short links"
ON public.short_links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_short_link(_code text, _url text)
 RETURNS TABLE(code text, edit_token uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _url !~ '^https://wa\.me/' THEN
    RAISE EXCEPTION 'invalid_url';
  END IF;
  IF _code !~ '^[a-zA-Z0-9_-]{3,32}$' THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  RETURN QUERY
  INSERT INTO public.short_links (code, url, user_id)
  VALUES (_code, _url, auth.uid())
  RETURNING short_links.code, short_links.edit_token;
END;
$function$;