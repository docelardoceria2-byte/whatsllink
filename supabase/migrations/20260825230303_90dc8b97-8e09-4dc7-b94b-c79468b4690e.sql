CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.short_links TO anon, authenticated;
GRANT ALL ON public.short_links TO service_role;

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read short links" ON public.short_links FOR SELECT USING (true);
CREATE POLICY "Anyone can create short links" ON public.short_links FOR INSERT WITH CHECK (url ~ '^https://wa\.me/');

CREATE OR REPLACE FUNCTION public.resolve_short_link(_code TEXT)
RETURNS TABLE (url TEXT, clicks INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.short_links s
     SET clicks = s.clicks + 1
   WHERE s.code = _code
  RETURNING s.url, s.clicks;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_short_link(TEXT) TO anon, authenticated;