CREATE TABLE IF NOT EXISTS public.link_click_days (
  link_id uuid NOT NULL REFERENCES public.short_links(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  clicks integer NOT NULL DEFAULT 0,
  PRIMARY KEY (link_id, day)
);

GRANT SELECT ON public.link_click_days TO authenticated;
GRANT ALL ON public.link_click_days TO service_role;

ALTER TABLE public.link_click_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own link stats"
ON public.link_click_days
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.short_links s
  WHERE s.id = link_click_days.link_id AND s.user_id = auth.uid()
));

CREATE OR REPLACE FUNCTION public.resolve_short_link(_code text)
 RETURNS TABLE(url text, clicks integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid; v_url text; v_clicks integer;
BEGIN
  UPDATE public.short_links s
     SET clicks = s.clicks + 1
   WHERE s.code = _code
  RETURNING s.id, s.url, s.clicks INTO v_id, v_url, v_clicks;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.link_click_days (link_id, day, clicks)
  VALUES (v_id, CURRENT_DATE, 1)
  ON CONFLICT (link_id, day) DO UPDATE SET clicks = public.link_click_days.clicks + 1;

  RETURN QUERY SELECT v_url, v_clicks;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_short_link(_id uuid, _code text, _url text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_code text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _code !~ '^[a-zA-Z0-9_-]{3,32}$' THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  IF _url !~ '^https://wa\.me/' THEN
    RAISE EXCEPTION 'invalid_url';
  END IF;
  UPDATE public.short_links s
     SET code = _code, url = _url
   WHERE s.id = _id AND s.user_id = auth.uid()
  RETURNING s.code INTO v_code;
  IF v_code IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  RETURN v_code;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_short_link(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_short_link(uuid, text, text) TO authenticated;