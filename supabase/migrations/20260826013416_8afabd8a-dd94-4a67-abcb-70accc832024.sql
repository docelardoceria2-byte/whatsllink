DROP POLICY IF EXISTS "Anyone can read short links" ON public.short_links;
DROP POLICY IF EXISTS "Anyone can create short links" ON public.short_links;

REVOKE ALL ON public.short_links FROM anon, authenticated;
GRANT ALL ON public.short_links TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.create_short_link(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rename_short_link(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_short_link(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_short_link(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rename_short_link(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_short_link(text) TO anon, authenticated;