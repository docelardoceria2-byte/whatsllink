# Corrigir login Google no domínio oficial

## Alterações
- Trocar somente o início do login Google para o fluxo OAuth do backend já conectado, usando `redirectTo: `${window.location.origin}/auth/callback``.
- Manter `/auth/callback` como rota pública e reforçar nela a troca do código por sessão, a espera pela sessão persistida e o redirecionamento para `/planos`.
- Preservar o destino já salvo, as telas, o login por e-mail, o banco e todas as demais funcionalidades.

## Verificação
- Confirmar que não restaram redirecionamentos Google para `localhost`, rotas inexistentes ou `~oauth` no código usado pelo botão.
- Confirmar HTTP 200 para `/auth/callback` no domínio oficial e no domínio Lovable.
- Validar início do OAuth, retorno sem 404, persistência após atualização e novo login após sair, até o limite de não concluir interativamente a escolha de uma conta Google real.
- Confirmar compilação sem erros.
