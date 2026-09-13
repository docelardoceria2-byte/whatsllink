# Corrigir login com Google

## Alteração
- Manter `/auth/callback` como retorno público e preservar o processamento atual da sessão.
- Quando o WhatsLink estiver em `whatslink.site`, iniciar o Google pelo endereço publicado do Lovable, onde `~oauth` existe.
- Nos endereços Lovable e na prévia, manter o fluxo atual sem mudanças visuais.

## Verificação
- Confirmar HTTP 200 em `/auth/callback` nos dois domínios.
- Confirmar que o início do Google encaminha ao provedor nos dois domínios.
- Confirmar que o projeto compila sem erros.

## Limite
Nenhuma alteração de layout, banco de dados, páginas ou funcionalidades além do login Google.
